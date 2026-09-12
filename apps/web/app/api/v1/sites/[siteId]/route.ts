import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const { siteId } = await params

    const siteRes = await pool.query(
      "SELECT id, domain, user_id FROM sites WHERE id = $1",
      [siteId]
    )
    if (siteRes.rows.length === 0) {
      return NextResponse.json({ detail: "Site not found" }, { status: 404 })
    }

    const site = siteRes.rows[0]
    if (site.user_id && site.user_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden. You do not own this site." }, { status: 403 })
    }

    const domain = site.domain

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
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const { siteId } = await params
    const body = await req.json()

    const siteRes = await pool.query("SELECT id, user_id FROM sites WHERE id = $1", [siteId])
    if (siteRes.rows.length === 0) {
      return NextResponse.json({ detail: "Site not found" }, { status: 404 })
    }

    const site = siteRes.rows[0]
    if (site.user_id && site.user_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden. You do not own this site." }, { status: 403 })
    }

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

    return NextResponse.json(updated.rows[0])
  } catch (err: any) {
    console.error("PATCH /api/v1/sites/[siteId] error:", err)
    return NextResponse.json({ detail: err.message || "Failed to update site" }, { status: 500 })
  }
}
