import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
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

    const res = await pool.query(
      `SELECT * FROM discovered_cookies WHERE domain = $1 ORDER BY category ASC, name ASC`,
      [domain]
    )

    return NextResponse.json(res.rows || [])
  } catch (err: any) {
    console.error("GET /api/v1/consent/cookies error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch cookies" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const domain = sanitizeDomain(body.domain)
    const name = (body.name || "").trim()

    if (!domain || !name) {
      return NextResponse.json({ detail: "Domain and cookie name are required" }, { status: 400 })
    }

    const category = body.category || "functional"
    const serviceName = body.service_name || "Custom"
    const duration = body.duration || "Session"
    const description = body.description || ""
    const scriptPattern = body.script_pattern_regex || null
    const id = randomUUID()

    const siteRes = await pool.query("SELECT id FROM sites WHERE domain = $1", [domain])
    const siteId = siteRes.rows[0]?.id || null

    const res = await pool.query(
      `INSERT INTO discovered_cookies (id, site_id, domain, name, category, service_name, duration, description, confidence, status, script_pattern_regex, first_detected_at, last_detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'high', 'custom', $9, NOW(), NOW())
       RETURNING *`,
      [id, siteId, domain, name, category, serviceName, duration, description, scriptPattern]
    )

    return NextResponse.json(res.rows[0] || null, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/v1/consent/cookies error:", err)
    return NextResponse.json({ detail: err.message || "Failed to create cookie" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const id = body.id
    const domain = sanitizeDomain(body.domain)

    if (!id && !body.name) {
      return NextResponse.json({ detail: "Cookie ID or Name is required" }, { status: 400 })
    }

    let query = ""
    let params: any[] = []

    if (id) {
      query = `UPDATE discovered_cookies 
               SET category = COALESCE($1, category),
                   service_name = COALESCE($2, service_name),
                   duration = COALESCE($3, duration),
                   description = COALESCE($4, description),
                   script_pattern_regex = COALESCE($5, script_pattern_regex),
                   status = 'manual_override',
                   last_detected_at = NOW()
               WHERE id = $6 RETURNING *`
      params = [body.category, body.service_name, body.duration, body.description, body.script_pattern_regex, id]
    } else {
      query = `UPDATE discovered_cookies 
               SET category = COALESCE($1, category),
                   service_name = COALESCE($2, service_name),
                   duration = COALESCE($3, duration),
                   description = COALESCE($4, description),
                   script_pattern_regex = COALESCE($5, script_pattern_regex),
                   status = 'manual_override',
                   last_detected_at = NOW()
               WHERE domain = $6 AND name = $7 RETURNING *`
      params = [body.category, body.service_name, body.duration, body.description, body.script_pattern_regex, domain, body.name]
    }

    const res = await pool.query(query, params)
    if (res.rows.length === 0) {
      return NextResponse.json({ detail: "Cookie not found" }, { status: 404 })
    }

    return NextResponse.json(res.rows[0] || null)
  } catch (err: any) {
    console.error("PUT /api/v1/consent/cookies error:", err)
    return NextResponse.json({ detail: err.message || "Failed to update cookie" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const domain = sanitizeDomain(searchParams.get("domain"))
    const name = searchParams.get("name")

    if (!id && (!domain || !name)) {
      return NextResponse.json({ detail: "Cookie ID or (Domain and Name) is required" }, { status: 400 })
    }

    if (id) {
      await pool.query("DELETE FROM discovered_cookies WHERE id = $1", [id])
    } else {
      await pool.query("DELETE FROM discovered_cookies WHERE domain = $1 AND name = $2", [domain, name])
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("DELETE /api/v1/consent/cookies error:", err)
    return NextResponse.json({ detail: err.message || "Failed to delete cookie" }, { status: 500 })
  }
}
