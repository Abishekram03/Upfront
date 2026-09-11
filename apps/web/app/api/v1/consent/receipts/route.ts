import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"

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

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400 })
    }

    let query = "SELECT * FROM consent_receipts WHERE domain = $1"
    const params: any[] = [domain]

    if (search) {
      params.push(`%${search.trim()}%`)
      query += ` AND (visitor_hash ILIKE $${params.length} OR country ILIKE $${params.length})`
    }

    params.push(limit, offset)
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`

    const res = await pool.query(query, params)
    return NextResponse.json(res.rows)
  } catch (err: any) {
    console.error("GET /api/v1/consent/receipts error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch consent receipts" }, { status: 500 })
  }
}
