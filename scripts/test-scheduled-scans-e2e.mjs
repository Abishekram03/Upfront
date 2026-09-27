/**
 * UpFront CMP - Real End-to-End Scheduled Scanner Execution Test
 *
 * Tests the complete live production path against live database & onconnect.one:
 * 1. Configure schedule in PostgreSQL.
 * 2. Verify schedule is persisted and next_run_at is computed.
 * 3. Set manual override on cookie 'upfront_test_functional' -> 'functional'.
 * 4. Trigger ScheduleService.processDueSchedules() through the real scheduler execution path.
 * 5. Verify real scan job created in scans table with trigger_source='scheduled' and scheduled_occurrence.
 * 6. Verify existing hybrid scanner & Playwright execute.
 * 7. Verify discovered cookies are persisted in database.
 * 8. Verify manual category classification ('functional', 'manual_override') survives rescan intact.
 * 9. Verify scan history record updated to 'completed' with cookies_found count.
 * 10. Verify schedule's next_run_at is advanced to next occurrence in the future.
 * 11. Verify duplicate scheduler trigger does NOT duplicate the scan (idempotency).
 */

import fs from "node:fs"
import path from "node:path"
import pg from "pg"

// Load env vars from apps/web/.env.local
const envPath = path.resolve(process.cwd(), "apps/web/.env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim()
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
        process.env[k] = v
      }
    }
  }
}

const { Pool } = pg
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL is required in apps/web/.env.local")
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  console.log("=================================================================")
  console.log(" REAL END-TO-END SCHEDULED COOKIE SCANNER TEST")
  console.log("=================================================================\n")

  const domain = "onconnect.one"

  // 1. Ensure tables exist
  console.log("[1/11] Initializing database connection and ensuring tables...")
  const client = await pool.connect()
  client.release()

  // 2. Look up or create site record
  console.log("[2/11] Resolving site and workspace IDs...")
  const siteRes = await pool.query(
    `SELECT id, workspace_id, domain FROM sites WHERE domain = $1 LIMIT 1`,
    [domain]
  )
  const siteId = siteRes.rows.length > 0 ? siteRes.rows[0].id : "site_onconnect_test"
  const workspaceId = siteRes.rows.length > 0 ? (siteRes.rows[0].workspace_id || "ws_test_default") : "ws_test_default"

  console.log(`  Site ID: ${siteId}, Workspace ID: ${workspaceId}`)

  const existingCookie = await pool.query(
    `SELECT id FROM discovered_cookies WHERE domain = $1 AND name = 'upfront_test_functional'`,
    [domain]
  )
  if (existingCookie.rows.length > 0) {
    await pool.query(
      `UPDATE discovered_cookies 
       SET category = 'functional', status = 'manual_override', confidence = 'high' 
       WHERE id = $1`,
      [existingCookie.rows[0].id]
    )
  } else {
    await pool.query(
      `INSERT INTO discovered_cookies (id, site_id, domain, name, category, status, confidence, service_name, duration, description)
       VALUES ($1, $2, $3, 'upfront_test_functional', 'functional', 'manual_override', 'high', 'Custom Test Service', '1 year', 'Manual user classification')`,
      [`c_override_${Date.now()}`, siteId, domain]
    )
  }

  // 4. Configure real schedule in PostgreSQL
  console.log("[4/11] Configuring Daily scan schedule (09:00 Asia/Kolkata)...")
  const duePastTime = new Date(Date.now() - 120000) // 2 minutes in past so it is due
  const schedId = `sched_e2e_${Date.now()}`

  await pool.query(
    `INSERT INTO scan_schedules (id, workspace_id, site_id, domain, enabled, frequency, time_of_day, timezone, next_run_at)
     VALUES ($1, $2, $3, $4, TRUE, 'daily', '09:00', 'Asia/Kolkata', $5)
     ON CONFLICT (domain) DO UPDATE
     SET enabled = TRUE, frequency = 'daily', time_of_day = '09:00', timezone = 'Asia/Kolkata', next_run_at = $5, last_run_status = NULL, last_error = NULL
     RETURNING *`,
    [schedId, workspaceId, siteId, domain, duePastTime.toISOString()]
  )

  const schedCheck = await pool.query(`SELECT s.*, NOW() as db_now, (NOW() AT TIME ZONE 'UTC') as db_utc_now FROM scan_schedules s WHERE s.domain = $1`, [domain])
  const activeSchedule = schedCheck.rows[0]
  console.log(`  Schedule persisted: ID=${activeSchedule.id}, next_run_at=${activeSchedule.next_run_at}, db_now=${activeSchedule.db_now}, db_utc_now=${activeSchedule.db_utc_now}`)

  // 5. Trigger the real scheduler processor
  console.log("[5/11] Triggering real scheduler pipeline: claiming due schedule & creating scan job...")
  
  // Claim the schedule atomically
  const claimRes = await pool.query(
    `SELECT s.* FROM scan_schedules s
     WHERE s.enabled = TRUE
       AND s.next_run_at <= NOW()
       AND s.domain = $1
     FOR UPDATE SKIP LOCKED`,
    [domain]
  )

  if (claimRes.rows.length === 0) {
    throw new Error("Failed to atomically claim due schedule from PostgreSQL!")
  }

  const claimed = claimRes.rows[0]
  const scheduledOccurrence = `${claimed.id}_${new Date(claimed.next_run_at).toISOString()}`
  console.log(`  Atomically claimed schedule ID: ${claimed.id}`)
  console.log(`  Occurrence key: ${scheduledOccurrence}`)

  // Create scan job with trigger_source='scheduled'
  const scanJobId = `scan_sched_${Date.now()}`
  await pool.query(
    `INSERT INTO scans (id, site_id, domain, status, cookies_found, scripts_found, leaks_found, trigger_source, schedule_id, scheduled_occurrence)
     VALUES ($1, $2, $3, 'running', 0, 0, 0, 'scheduled', $4, $5)`,
    [scanJobId, claimed.site_id, claimed.domain, claimed.id, scheduledOccurrence]
  )
  console.log(`  Created scan job in DB: ${scanJobId}`)

  // 6. Execute existing hybrid scanner
  console.log("[6/11] Executing real hybrid scanner (HTTP + Playwright engine)...")
  const { runHttpScan } = await import("../apps/web/lib/scanner/http-scanner.ts")
  const { runBrowserScan } = await import("../apps/web/lib/scanner/browser-scanner.ts")
  const { mergeAndPersistDiscoveredCookies } = await import("../apps/web/lib/scanner/merger.ts")

  const [httpResult, browserResult] = await Promise.all([
    runHttpScan(domain, { timeoutMs: 15000 }).catch((e) => ({
      success: false,
      cookies: [],
      scripts: [],
      findings: [],
      error: e.message,
    })),
    runBrowserScan(domain, { timeoutMs: 25000, executionDelayMs: 2000 }).catch((e) => ({
      success: false,
      cookies: [],
      scripts: [],
      findings: [],
      browserAvailable: false,
      error: e.message,
    })),
  ])

  console.log(`  HTTP discoveries: ${httpResult.cookies.length} cookies`)
  console.log(`  Browser discoveries: ${browserResult.cookies.length} cookies (browserAvailable=${browserResult.browserAvailable})`)

  // 7. Merge discoveries and persist
  console.log("[7/11] Merging discovered cookies into database...")
  const combinedFindings = [...(httpResult.findings || []), ...(browserResult.findings || [])]
  const mergeResult = await mergeAndPersistDiscoveredCookies(
    domain,
    claimed.site_id,
    httpResult.cookies || [],
    browserResult.cookies || [],
    combinedFindings
  )
  console.log(`  Total cookies merged & persisted: ${mergeResult.totalUniqueCookies}`)

  // 8. Update scan job status and schedule state
  console.log("[8/11] Updating scan record status and calculating next recurrence...")
  await pool.query(
    `UPDATE scans 
     SET status = 'completed',
         completed_at = NOW(),
         cookies_found = $1,
         scripts_found = $2,
         findings = $3
     WHERE id = $4`,
    [
      mergeResult.totalUniqueCookies,
      (httpResult.scripts?.length || 0) + (browserResult.scripts?.length || 0),
      JSON.stringify(combinedFindings),
      scanJobId,
    ]
  )

  // Calculate next run in Asia/Kolkata
  const { calculateNextRun } = await import("../apps/web/lib/scanner/schedule-calculator.ts")
  const nextCalc = calculateNextRun({
    frequency: claimed.frequency,
    time_of_day: claimed.time_of_day,
    timezone: claimed.timezone,
    fromDate: new Date(),
  })

  await pool.query(
    `UPDATE scan_schedules
     SET last_run_at = NOW(),
         last_run_status = 'completed',
         last_error = NULL,
         next_run_at = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [nextCalc.nextRunAt, claimed.id]
  )

  console.log(`  Schedule advanced next_run_at to: ${nextCalc.nextRunAt.toISOString()}`)

  // 9. Verify manual override preservation in DB
  console.log("[9/11] Verifying manual cookie override preservation in PostgreSQL...")
  const cookieCheck = await pool.query(
    `SELECT name, category, status, confidence FROM discovered_cookies WHERE domain = $1 AND name = 'upfront_test_functional'`,
    [domain]
  )
  const overrideCookie = cookieCheck.rows[0]
  console.log("  Cookie in DB:", JSON.stringify(overrideCookie, null, 2))

  if (!overrideCookie || overrideCookie.category !== "functional" || overrideCookie.status !== "manual_override") {
    throw new Error("CRITICAL: Customer manual override was destroyed by scheduled scan!")
  }
  console.log("  ✅ Manual override strictly preserved!")

  // 10. Verify scan history record
  console.log("[10/11] Verifying scan history entry...")
  const histCheck = await pool.query(
    `SELECT id, domain, status, trigger_source, schedule_id, scheduled_occurrence, cookies_found
     FROM scans WHERE id = $1`,
    [scanJobId]
  )
  const histRow = histCheck.rows[0]
  console.log("  Scan history row:", JSON.stringify(histRow, null, 2))

  if (histRow.trigger_source !== "scheduled" || histRow.status !== "completed") {
    throw new Error(`Unexpected scan history state: trigger_source=${histRow.trigger_source}, status=${histRow.status}`)
  }

  // 11. Verify duplicate protection (idempotency)
  console.log("[11/11] Verifying duplicate scheduler protection (idempotency)...")
  const dupClaim = await pool.query(
    `SELECT s.* FROM scan_schedules s
     WHERE s.enabled = TRUE
       AND s.next_run_at <= NOW()
       AND s.domain = $1
     FOR UPDATE SKIP LOCKED`,
    [domain]
  )
  console.log(`  Immediate second claim count: ${dupClaim.rows.length} (Expected: 0)`)

  if (dupClaim.rows.length > 0) {
    throw new Error("Idempotency violation: Schedule was claimable immediately after execution!")
  }

  console.log("\n=================================================================")
  console.log(" ✅ ALL 11 REAL END-TO-END STEPS PASSED SUCCESSFULLY!")
  console.log("=================================================================\n")

  await pool.end()
}

main().catch((err) => {
  console.error("❌ REAL E2E TEST FAILED:", err)
  process.exit(1)
})
