import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { createHash, randomUUID } from "node:crypto"

const HASH_SALT = process.env.HASH_SALT || "usrly_super_privacy_salt_2026_xyz"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

function parseUserAgent(ua: string) {
  let browser = "Chrome"
  let os = "Windows"
  let device = "Desktop"

  if (/Mobile|Android|iP(hone|od)/i.test(ua)) device = "Mobile"
  else if (/Tablet|iPad/i.test(ua)) device = "Tablet"
  else if (/Macintosh|Mac OS/i.test(ua)) device = "Laptop"

  if (/Firefox/i.test(ua)) browser = "Firefox"
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari"
  else if (/Edg/i.test(ua)) browser = "Edge"
  else if (/Opera|OPR/i.test(ua)) browser = "Opera"

  if (/Windows/i.test(ua)) os = "Windows"
  else if (/Mac OS/i.test(ua)) os = "macOS"
  else if (/Android/i.test(ua)) os = "Android"
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS"
  else if (/Linux/i.test(ua)) os = "Linux"

  return { browser, os, device }
}

function parseReferrer(refUrl: string | null, siteDomain: string) {
  if (!refUrl) return "Direct"
  try {
    const host = new URL(refUrl).hostname.toLowerCase()
    if (host.includes(siteDomain)) return "Direct"
    if (host.includes("google")) return "Google"
    if (host.includes("bing")) return "Bing"
    if (host.includes("yahoo")) return "Yahoo"
    if (host.includes("duckduckgo")) return "DuckDuckGo"
    if (host.includes("twitter") || host.includes("t.co") || host.includes("x.com")) return "Twitter / X"
    if (host.includes("linkedin")) return "LinkedIn"
    if (host.includes("github")) return "GitHub"
    if (host.includes("youtube")) return "YouTube"
    if (host.includes("reddit")) return "Reddit"
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook"
    if (host.includes("instagram")) return "Instagram"
    return host.replace("www.", "")
  } catch {
    return "Direct"
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const rawDomain = sanitizeDomain(body.domain)
    if (!rawDomain) return NextResponse.json({ ok: false }, { status: 400, headers: CORS_HEADERS })

    const siteRes = await pool.query("SELECT id, domain FROM sites WHERE domain = $1", [rawDomain])
    let siteId: string

    if (siteRes.rows.length === 0) {
      siteId = randomUUID()
      await pool.query(
        "INSERT INTO sites (id, domain, timezone, public, created_at) VALUES ($1, $2, 'UTC', FALSE, NOW()) ON CONFLICT (domain) DO NOTHING",
        [siteId, rawDomain]
      )
    } else {
      siteId = siteRes.rows[0]?.id || randomUUID()
    }

    const forwarded = req.headers.get("x-forwarded-for") || ""
    const ip = (forwarded.split(",")[0] || "").trim() || "127.0.0.1"
    const ua = req.headers.get("user-agent") || ""
    const today = new Date().toISOString().split("T")[0] || ""
    const visitorHash = createHash("sha256").update(`${rawDomain}-${ip}-${ua}-${today}-${HASH_SALT}`).digest("hex").slice(0, 16)

    const urlObj = new URL(body.url || `https://${rawDomain}/`)
    const pathname = urlObj.pathname || "/"
    const referrerSource = parseReferrer(body.referrer, rawDomain)
    const { browser, os, device } = parseUserAgent(ua)
    const country = req.headers.get("x-vercel-ip-country") || "US"
    const city = req.headers.get("x-vercel-ip-city") || "Washington"

    // Check active session within last 30 minutes
    const sessionRes = await pool.query(
      `SELECT id, started_at, last_activity_at, pageviews_count
       FROM sessions
       WHERE site_id = $1 AND visitor_hash = $2 AND last_activity_at >= NOW() - INTERVAL '30 minutes'
       ORDER BY last_activity_at DESC LIMIT 1`,
      [siteId, visitorHash]
    )

    let sessionId: string
    if (sessionRes.rows.length > 0 && sessionRes.rows[0]) {
      const sess = sessionRes.rows[0]
      sessionId = sess.id
      const started = new Date(sess.started_at).getTime()
      const now = Date.now()
      const duration = Math.max(0, Math.floor((now - started) / 1000))
      const count = (sess.pageviews_count || 1) + 1

      await pool.query(
        `UPDATE sessions
         SET pageviews_count = $1, duration = $2, is_bounce = FALSE, exit_page = $3, last_activity_at = NOW()
         WHERE id = $4`,
        [count, duration, pathname, sessionId]
      )
    } else {
      sessionId = randomUUID()
      await pool.query(
        `INSERT INTO sessions (
          id, site_id, hostname, visitor_hash, entry_page, exit_page,
          referrer, referrer_source, country, city, device, browser, os,
          duration, pageviews_count, is_bounce, started_at, last_activity_at
        ) VALUES (
          $1, $2, $3, $4, $5, $5,
          $6, $7, $8, $9, $10, $11, $12,
          0, 1, TRUE, NOW(), NOW()
        )`,
        [sessionId, siteId, rawDomain, visitorHash, pathname, body.referrer || null, referrerSource, country, city, device, browser, os]
      )
    }

    const pageviewId = randomUUID()
    await pool.query(
      `INSERT INTO pageviews (id, site_id, session_id, pathname, search_query, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [pageviewId, siteId, sessionId, pathname, urlObj.search || null]
    )

    return NextResponse.json({ ok: true, session_id: sessionId }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("POST /api/v1/event error:", err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS })
  }
}
