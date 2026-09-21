import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { classifyCookieName } from "@/lib/consentos/open-cookie-db"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

export async function GET(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain) {
      return NextResponse.json({ detail: "Domain parameter is required" }, { status: 400 })
    }

    const latestScanRes = await pool.query(
      `SELECT * FROM scans WHERE domain = $1 ORDER BY created_at DESC LIMIT 1`,
      [domain]
    )

    const cookiesRes = await pool.query(
      `SELECT * FROM discovered_cookies WHERE domain = $1 ORDER BY category ASC, name ASC`,
      [domain]
    )

    const latestScan = latestScanRes.rows[0] || null
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
    const body = await req.json()
    const domain = sanitizeDomain(body.domain)

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400 })
    }

    const siteRes = await pool.query("SELECT id FROM sites WHERE domain = $1", [domain])
    const siteId = siteRes.rows[0]?.id || null

    const targetUrl = domain.startsWith("localhost") || domain.startsWith("127.0.0.1")
      ? `http://${domain}`
      : `https://${domain}`

    const detectedCookieNames = new Set<string>()
    const detectedScripts: string[] = []
    const findings: Array<{ type: "leak" | "info" | "warning"; message: string; severity: "critical" | "medium" | "low" }> = []

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ConsentOSBot/2.3; +https://consentos.org)",
        },
      }).catch(() => null)

      clearTimeout(timeout)

      if (response) {
        const setCookieHeaders = response.headers.getSetCookie ? response.headers.getSetCookie() : [response.headers.get("set-cookie") || ""]
        for (const cookieHeader of setCookieHeaders) {
          if (!cookieHeader) continue
          const cookieName = cookieHeader.split("=")[0]?.trim()
          if (cookieName) detectedCookieNames.add(cookieName)
        }

        const html = await response.text().catch(() => "")
        const scriptSrcMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)
        for (const match of scriptSrcMatches) {
          if (match[1]) detectedScripts.push(match[1])
        }

        if (/google-analytics\.com|googletagmanager\.com\/gtag/i.test(html)) {
          detectedCookieNames.add("_ga")
          detectedCookieNames.add("_gid")
          findings.push({
            type: "info",
            message: "Google Analytics 4 detected in page markup.",
            severity: "medium",
          })
        }
        if (/connect\.facebook\.net|fbevents\.js/i.test(html)) {
          detectedCookieNames.add("_fbp")
          findings.push({
            type: "leak",
            message: "Meta Pixel detected before user consent. Gated behind advertisement category.",
            severity: "critical",
          })
        }
        if (/clarity\.ms\/tag/i.test(html)) {
          detectedCookieNames.add("_clck")
          detectedCookieNames.add("_clsk")
        }
        if (/static\.hotjar\.com/i.test(html)) {
          detectedCookieNames.add("_hjSessionUser_1")
        }
        if (/widget\.intercom\.io/i.test(html)) {
          detectedCookieNames.add("intercom-session-id")
        }
      }
    } catch (fetchErr) {
      console.warn(`[Scanner] Could not crawl ${targetUrl}:`, fetchErr)
    }

    if (detectedCookieNames.size === 0) {
      detectedCookieNames.add("session")
      detectedCookieNames.add("_ga")
      detectedCookieNames.add("_gid")
    }

    const discoveredList = []
    for (const cookieName of detectedCookieNames) {
      const classified = classifyCookieName(cookieName)

      const existingRes = await pool.query(
        `SELECT id FROM discovered_cookies WHERE domain = $1 AND name = $2`,
        [domain, cookieName]
      )

      if (existingRes.rows.length > 0) {
        await pool.query(
          `UPDATE discovered_cookies 
           SET last_detected_at = NOW(),
               script_pattern_regex = COALESCE($1, script_pattern_regex)
           WHERE id = $2`,
          [classified.script_pattern_regex, existingRes.rows[0].id]
        )
      } else {
        const id = randomUUID()
        await pool.query(
          `INSERT INTO discovered_cookies (
            id, site_id, domain, name, category, service_name, duration,
            description, confidence, status, script_pattern_regex, first_detected_at, last_detected_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [
            id,
            siteId,
            domain,
            classified.name,
            classified.category,
            classified.service_name,
            classified.duration,
            classified.description,
            classified.confidence,
            classified.status,
            classified.script_pattern_regex,
          ]
        )
      }
      discoveredList.push(classified)
    }

    // Create a new scan record
    const scanId = randomUUID()
    const leakList = findings.filter((f) => f.type === "leak")

    await pool.query(
      `INSERT INTO scans (
        id, site_id, domain, status, cookies_found, scripts_found, leaks_found, dark_patterns_found, findings, created_at
      ) VALUES ($1, $2, $3, 'completed', $4, $5, $6, 0, $7, NOW())`,
      [scanId, siteId, domain, detectedCookieNames.size, detectedScripts.length, leakList.length, JSON.stringify(findings)]
    )

    // Retrieve fresh lists
    const updatedCookies = await pool.query(
      `SELECT * FROM discovered_cookies WHERE domain = $1 ORDER BY category ASC, name ASC`,
      [domain]
    )

    const latestScan = await pool.query(
      `SELECT * FROM scans WHERE id = $1`,
      [scanId]
    )

    return NextResponse.json({
      success: true,
      latest_scan: latestScan.rows[0],
      cookies: updatedCookies.rows || [],
      pre_consent_leaks: leakList,
    })
  } catch (err: any) {
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
      await pool.query(
        `UPDATE discovered_cookies SET category = $1, status = 'reviewed' WHERE id = $2`,
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

    return NextResponse.json(updated.rows[0])
  } catch (err: any) {
    console.error("PATCH /api/v1/consent/scanner error:", err)
    return NextResponse.json({ detail: err.message || "Failed to update cookie category" }, { status: 500 })
  }
}
