import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

export async function GET() {
  try {
    await ensureTables()
    const res = await pool.query(
      "SELECT id, domain, timezone, public, created_at FROM sites ORDER BY created_at DESC"
    )
    return NextResponse.json(res.rows)
  } catch (err: any) {
    console.error("GET /api/v1/sites error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch sites" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const cleanDomain = sanitizeDomain(body.domain)

    if (!cleanDomain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400 })
    }

    const timezone = body.timezone || "UTC"
    const existing = await pool.query("SELECT id FROM sites WHERE domain = $1", [cleanDomain])
    if (existing.rows.length > 0) {
      return NextResponse.json({ detail: "Domain already exists" }, { status: 400 })
    }

    const id = randomUUID()
    const insertRes = await pool.query(
      `INSERT INTO sites (id, domain, timezone, public, created_at)
       VALUES ($1, $2, $3, FALSE, NOW())
       RETURNING id, domain, timezone, public, created_at`,
      [id, cleanDomain, timezone]
    )

    return NextResponse.json(insertRes.rows[0])
  } catch (err: any) {
    console.error("POST /api/v1/sites error:", err)
    return NextResponse.json({ detail: err.message || "Failed to create site" }, { status: 500 })
  }
}
