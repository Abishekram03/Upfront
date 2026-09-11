import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    await ensureTables()
    const { siteId } = await params

    const siteRes = await pool.query("SELECT id, domain FROM sites WHERE id = $1", [siteId])
    if (siteRes.rows.length === 0) {
      return NextResponse.json({ detail: "Site not found" }, { status: 404 })
    }

    const domain = siteRes.rows[0].domain

    // Cascade delete
    await pool.query("DELETE FROM pageviews WHERE site_id = $1", [siteId])
    await pool.query("DELETE FROM sessions WHERE site_id = $1", [siteId])
    await pool.query("DELETE FROM consent_receipts WHERE domain = $1", [domain])
    await pool.query("DELETE FROM consent_configs WHERE domain = $1", [domain])
    await pool.query("DELETE FROM sites WHERE id = $1", [siteId])

    return NextResponse.json({ ok: true, message: "Site and associated data deleted successfully" })
  } catch (err: any) {
    console.error("DELETE /api/v1/sites/[siteId] error:", err)
    return NextResponse.json({ detail: err.message || "Failed to delete site" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    await ensureTables()
    const { siteId } = await params
    const body = await req.json()

    if (body.timezone !== undefined) {
      await pool.query("UPDATE sites SET timezone = $1 WHERE id = $2", [body.timezone, siteId])
    }
    if (body.public !== undefined) {
      await pool.query("UPDATE sites SET public = $1 WHERE id = $2", [body.public, siteId])
    }

    const updated = await pool.query(
      "SELECT id, domain, timezone, public, created_at FROM sites WHERE id = $1",
      [siteId]
    )

    if (updated.rows.length === 0) {
      return NextResponse.json({ detail: "Site not found" }, { status: 404 })
    }

    return NextResponse.json(updated.rows[0])
  } catch (err: any) {
    console.error("PATCH /api/v1/sites/[siteId] error:", err)
    return NextResponse.json({ detail: err.message || "Failed to update site" }, { status: 500 })
  }
}
