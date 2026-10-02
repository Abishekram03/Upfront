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

    let countQuery = "SELECT COUNT(*)::int AS total FROM consent_receipts WHERE domain = $1"
    let query = "SELECT * FROM consent_receipts WHERE domain = $1"
    const params: any[] = [domain]
    const countParams: any[] = [domain]

    if (search) {
      params.push(`%${search.trim()}%`)
      countParams.push(`%${search.trim()}%`)
      const searchParamIdx = params.length
      const clause = ` AND (visitor_hash ILIKE $${searchParamIdx} OR country ILIKE $${searchParamIdx} OR id::text ILIKE $${searchParamIdx})`
      query += clause
      countQuery += clause
    }

    const countRes = await pool.query(countQuery, countParams)
    const totalCount = countRes.rows[0]?.total || 0

    params.push(limit, offset)
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`

    const res = await pool.query(query, params)
    return NextResponse.json(res.rows, {
      headers: {
        "x-total-count": totalCount.toString(),
        "x-page": page.toString(),
        "x-limit": limit.toString(),
        "x-total-pages": (Math.ceil(totalCount / limit) || 1).toString(),
      },
    })
  } catch (err: any) {
    console.error("GET /api/v1/consent/receipts error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch consent receipts" }, { status: 500 })
  }
}
