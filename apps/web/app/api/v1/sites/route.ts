import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

export async function GET(req: Request) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json([])
    }

    // Fetch only sites owned by this user
    const res = await pool.query(
      `SELECT id, domain, timezone, public, created_at 
       FROM sites 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user.id]
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
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized. Please log in." }, { status: 401 })
    }

    const body = await req.json()
    const cleanDomain = sanitizeDomain(body.domain)

    if (!cleanDomain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400 })
    }

    const timezone = body.timezone || "UTC"
    const existing = await pool.query(
      "SELECT id, user_id FROM sites WHERE domain = $1",
      [cleanDomain]
    )

    if (existing.rows.length > 0) {
      const site = existing.rows[0]
      // If site exists but has no user_id (legacy), assign it to this user
      if (!site.user_id) {
        await pool.query("UPDATE sites SET user_id = $1 WHERE id = $2", [user.id, site.id])
        return NextResponse.json({ id: site.id, domain: cleanDomain, timezone, public: false })
      }
      if (site.user_id !== user.id) {
        return NextResponse.json({ detail: "Domain is already registered by another account." }, { status: 400 })
      }
      return NextResponse.json(site)
    }

    const id = randomUUID()
    const insertRes = await pool.query(
      `INSERT INTO sites (id, domain, timezone, public, user_id, created_at)
       VALUES ($1, $2, $3, FALSE, $4, NOW())
       RETURNING id, domain, timezone, public, created_at`,
      [id, cleanDomain, timezone, user.id]
    )

    return NextResponse.json(insertRes.rows[0])
  } catch (err: any) {
    console.error("POST /api/v1/sites error:", err)
    return NextResponse.json({ detail: err.message || "Failed to create site" }, { status: 500 })
  }
}
