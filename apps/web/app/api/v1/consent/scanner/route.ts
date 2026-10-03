import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { sanitizeDomain, SSRFValidationError } from "@/lib/scanner/ssrf-protection"
import { ScanService } from "@/lib/scanner/scan-service"
import { ScheduleService } from "@/lib/scanner/scheduler"

export async function GET(req: Request) {
  try {
    await ensureTables()

    // Check and process any due scheduled scans before responding
    try {
      await ScheduleService.processDueSchedules({ maxJobs: 5, executeInline: true })
    } catch (err: any) {
      console.warn("[Auto-Trigger] Overdue scan check notice:", err?.message || err)
    }
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))
    const scanId = searchParams.get("scan_id")

    if (scanId) {
      const jobRes = await pool.query(
        `SELECT * FROM scans WHERE id = $1 LIMIT 1`,
        [scanId]
      )
      if (jobRes.rows.length === 0) {
        return NextResponse.json({ detail: "Scan job not found" }, { status: 404 })
      }
      return NextResponse.json({ job: jobRes.rows[0] })
    }

    if (!domain) {
      return NextResponse.json({ detail: "Domain parameter is required" }, { status: 400 })
    }

    const latestScanRes = await pool.query(
      `SELECT * FROM scans WHERE domain = $1 ORDER BY created_at DESC LIMIT 1`,
      [domain]
    )

    const latestSuccessfulScanRes = await pool.query(
      `SELECT * FROM scans WHERE domain = $1 AND status = 'completed' ORDER BY created_at DESC LIMIT 1`,
      [domain]
    )

    const allScansRes = await pool.query(
      `SELECT * FROM scans WHERE domain = $1 ORDER BY created_at DESC LIMIT 20`,
      [domain]
    )

    const cookiesRes = await pool.query(
      `SELECT * FROM discovered_cookies WHERE domain = $1 ORDER BY category ASC, name ASC`,
      [domain]
    )

    const latestScan = latestScanRes.rows[0] || null
    const latestSuccessfulScan = latestSuccessfulScanRes.rows[0] || null
    let findingsList: any[] = []
    if (latestScan && latestScan.findings) {
      try {
        findingsList = typeof latestScan.findings === "string" ? JSON.parse(latestScan.findings) : latestScan.findings
      } catch {
        findingsList = []
      }
    }
    const leaks = findingsList.filter((f: any) => f.type === "leak")

    return NextResponse.json({
      latest_scan: latestScan,
      latest_successful_scan: latestSuccessfulScan,
      scan_history: allScansRes.rows || [],
      cookies: cookiesRes.rows || [],
      pre_consent_leaks: leaks,
    })
  } catch (err: any) {
    console.error("GET /api/v1/consent/scanner error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch scan data" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const body = await req.json().catch(() => ({}))
    const domain = sanitizeDomain(body.domain || searchParams.get("domain"))
    const allowInsecureHttp = body.allowInsecureHttp === true || searchParams.get("allow_insecure_http") === "true"

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400 })
    }

    const siteRes = await pool.query("SELECT id FROM sites WHERE domain = $1", [domain])
    const siteId = siteRes.rows[0]?.id || null

    // 1. Create a scan job with 'queued' status
    const job = await ScanService.createScanJob(domain, siteId, {
      allowInsecureHttp,
    })

    // 2. Execute the hybrid scan (Fast HTTP + Playwright runtime)
    const completedJob = await ScanService.executeScanJob(job.id, {
      allowInsecureHttp,
    })

    // 3. Retrieve updated cookies and findings
    const updatedCookies = await pool.query(
      `SELECT * FROM discovered_cookies WHERE domain = $1 ORDER BY category ASC, name ASC`,
      [domain]
    )

    const latestSuccessfulScanRes = await pool.query(
      `SELECT * FROM scans WHERE domain = $1 AND status = 'completed' ORDER BY created_at DESC LIMIT 1`,
      [domain]
    )

    const leaks = (completedJob.findings || []).filter((f: any) => f.type === "leak")

    return NextResponse.json({
      success: completedJob.status === "completed",
      scan_id: completedJob.id,
      status: completedJob.status,
      latest_scan: completedJob,
      latest_successful_scan: latestSuccessfulScanRes.rows[0] || (completedJob.status === "completed" ? completedJob : null),
      cookies: updatedCookies.rows || [],
      pre_consent_leaks: leaks,
      error_message: completedJob.error_message || null,
    })
  } catch (err: any) {
    if (err instanceof SSRFValidationError) {
      return NextResponse.json({ detail: err.message, ssrf_blocked: true }, { status: 403 })
    }
    console.error("POST /api/v1/consent/scanner error:", err)
    return NextResponse.json({ detail: err.message || "Failed to execute scan" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const { cookieId, category, status } = body

    if (!cookieId) {
      return NextResponse.json({ detail: "cookieId is required" }, { status: 400 })
    }

    if (category) {
      // Mark with 'manual_override' so rescans never overwrite this user preference!
      await pool.query(
        `UPDATE discovered_cookies SET category = $1, status = 'manual_override' WHERE id = $2`,
        [category, cookieId]
      )
    }

    if (status) {
      await pool.query(
        `UPDATE discovered_cookies SET status = $1 WHERE id = $2`,
        [status, cookieId]
      )
    }

    const updated = await pool.query(
      `SELECT * FROM discovered_cookies WHERE id = $1`,
      [cookieId]
    )

    return NextResponse.json(updated.rows[0] || null)
  } catch (err: any) {
    console.error("PATCH /api/v1/consent/scanner error:", err)
    return NextResponse.json({ detail: err.message || "Failed to update cookie category" }, { status: 500 })
  }
}
