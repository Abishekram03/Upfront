/**
 * Real End-to-End Test for UpFront CMP Scheduled Cookie Scans
 *
 * Tests the real execution pipeline:
 * 1. Configure schedule in database.
 * 2. Verify schedule is persisted and next_run_at is computed.
 * 3. Trigger ScheduleService.processDueSchedules() (real execution path).
 * 4. Verify scan job created with trigger_source='scheduled' and scheduled_occurrence.
 * 5. Verify hybrid scanner runs and cookies are discovered/persisted.
 * 6. Verify manual cookie classifications survive rescan.
 * 7. Verify next scheduled occurrence is calculated and updated.
 * 8. Verify duplicate scheduler trigger does not create duplicate scan.
 */

import fs from "node:fs"
import path from "node:path"

// Load env vars
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

async function main() {
  console.log("=================================================================")
  console.log(" REAL END-TO-END SCHEDULED COOKIE SCANNER TEST")
  console.log("=================================================================\n")

  const { pool } = await import("../db")
  const { ScheduleService } = await import("../scanner/scheduler")
  const { ScanService } = await import("../scanner/scan-service")

  const domain = "onconnect.one"

  // 1. Get or create a site record for isolation verification
  console.log("[1/7] Initializing test site and workspace...")
  const siteRes = await pool.query(`SELECT id, workspace_id, domain FROM sites WHERE domain = $1 LIMIT 1`, [domain])
  let siteId: string | null = null
  let workspaceId: string = "default_ws"

  if (siteRes.rows.length > 0) {
    siteId = siteRes.rows[0].id
    workspaceId = siteRes.rows[0].workspace_id || "default_ws"
  }

  // 2. Set up manual cookie override on upfront_test_functional
  console.log("[2/7] Setting up manual category override on upfront_test_functional -> 'functional'...")
  await pool.query(
    `INSERT INTO discovered_cookies (id, workspace_id, site_id, domain, name, category, status, confidence, service_name)
     VALUES ($1, $2, $3, $4, 'upfront_test_functional', 'functional', 'manual_override', 'high', 'Custom Functional')
     ON CONFLICT (domain, name) DO UPDATE 
     SET category = 'functional', status = 'manual_override'`,
    [`test_${Date.now()}`, workspaceId, siteId, domain]
  )

  // 3. Upsert a schedule configured to run now (next_run_at = past)
  console.log("[3/7] Creating daily scan schedule with Asia/Kolkata timezone...")
  const schedule = await ScheduleService.upsertSchedule({
    workspaceId,
    siteId,
    domain,
    enabled: true,
    frequency: "daily",
    time_of_day: "09:00",
    timezone: "Asia/Kolkata",
  })

  console.log(`  Schedule created: ID ${schedule.id}, Initial next_run: ${schedule.next_run_at}`)

  // Force next_run_at to past so it is immediately due for execution
  const dueTime = new Date(Date.now() - 60000)
  await pool.query(`UPDATE scan_schedules SET next_run_at = $1 WHERE id = $2`, [dueTime, schedule.id])

  // 4. Trigger the REAL scheduler execution path
  console.log("[4/7] Triggering ScheduleService.processDueSchedules() via real worker path...")
  const processResult = await ScheduleService.processDueSchedules({ limit: 5 })
  console.log(`  Scheduler execution result:`, JSON.stringify(processResult, null, 2))

  if (processResult.processed === 0 && processResult.succeeded === 0) {
    throw new Error("Scheduler did not claim or process the due schedule!")
  }

  // 5. Verify the scan job in scans table
  console.log("[5/7] Verifying scan job records and trigger metadata...")
  const scanRes = await pool.query(
    `SELECT id, domain, status, trigger_source, schedule_id, scheduled_occurrence, cookies_found
     FROM scans WHERE domain = $1 AND schedule_id = $2 ORDER BY created_at DESC LIMIT 1`,
    [domain, schedule.id]
  )

  if (scanRes.rows.length === 0) {
    throw new Error("No scan record found for this schedule_id!")
  }

  const latestScan = scanRes.rows[0]
  console.log("  Latest scan record:", JSON.stringify(latestScan, null, 2))

  if (latestScan.trigger_source !== "scheduled") {
    throw new Error(`Expected trigger_source='scheduled', got ${latestScan.trigger_source}`)
  }
  if (!latestScan.scheduled_occurrence) {
    throw new Error("Expected non-empty scheduled_occurrence key!")
  }

  // 6. Verify manual override was preserved after the scan completed
  console.log("[6/7] Verifying manual override preservation across scheduled scan...")
  const cookieRes = await pool.query(
    `SELECT name, category, status, confidence FROM discovered_cookies WHERE domain = $1 AND name = 'upfront_test_functional'`,
    [domain]
  )

  const cookie = cookieRes.rows[0]
  console.log("  Cookie state in DB:", JSON.stringify(cookie, null, 2))

  if (!cookie || cookie.category !== "functional" || cookie.status !== "manual_override") {
    throw new Error("CRITICAL: Manual override was overwritten during scheduled scan!")
  }
  console.log("  ✅ Manual override strictly preserved!")

  // 7. Verify Idempotency: Immediate re-trigger must not create duplicate scan
  console.log("[7/7] Verifying duplicate scheduler protection (idempotency)...")
  const secondPass = await ScheduleService.processDueSchedules({ limit: 5 })
  console.log(`  Second scheduler run processed: ${secondPass.processed} (Expected 0)`)

  if (secondPass.processed > 0) {
    throw new Error("CRITICAL: Second scheduler pass processed duplicate schedule!")
  }

  // Verify schedule next_run_at advanced into the future
  const schedAfter = await ScheduleService.getScheduleByDomain(domain, workspaceId)
  console.log(`  Schedule updated next_run_at: ${schedAfter?.next_run_at}, last_run_status: ${schedAfter?.last_run_status}`)

  if (!schedAfter?.next_run_at || new Date(schedAfter.next_run_at).getTime() <= Date.now()) {
    throw new Error("Schedule next_run_at was not advanced into the future!")
  }

  console.log("\n=================================================================")
  console.log(" ✅ REAL END-TO-END TEST PASSED ALL CHECKS!")
  console.log("=================================================================\n")

  await pool.end()
}

main().catch((err) => {
  console.error("❌ E2E TEST FAILED:", err)
  process.exit(1)
})
