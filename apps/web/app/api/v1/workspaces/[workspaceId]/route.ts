import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params
    const body = await req.json()

    // Check permissions (Owner or Admin)
    const memberRes = await pool.query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, user.id]
    )
    if (memberRes.rows.length === 0) {
      return NextResponse.json({ detail: "Workspace not found or unauthorized" }, { status: 404 })
    }
    const role = memberRes.rows[0]?.role
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ detail: "Forbidden. Admin or Owner role required." }, { status: 403 })
    }

    const name = (body.name || "").trim()
    if (!name) {
      return NextResponse.json({ detail: "Workspace name is required" }, { status: 400 })
    }

    const updateRes = await pool.query(
      `UPDATE workspaces 
       SET name = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [name, workspaceId]
    )

    return NextResponse.json(updateRes.rows[0] || null)
  } catch (err: any) {
    console.error("PATCH /api/v1/workspaces/[workspaceId] error:", err)
    return NextResponse.json({ detail: err.message || "Failed to update workspace" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params

    // Only owner can delete workspace
    const wRes = await pool.query(
      `SELECT owner_id FROM workspaces WHERE id = $1`,
      [workspaceId]
    )
    if (wRes.rows.length === 0) {
      return NextResponse.json({ detail: "Workspace not found" }, { status: 404 })
    }
    if (wRes.rows[0]?.owner_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden. Only the owner can delete this workspace." }, { status: 403 })
    }

    // Check total workspaces owned by this user - if this is their only workspace, warn
    const totalUserWorkspaces = await pool.query(
      `SELECT COUNT(w.id)::int as count 
       FROM workspaces w 
       INNER JOIN workspace_members wm ON w.id = wm.workspace_id 
       WHERE wm.user_id = $1`,
      [user.id]
    )
    const count = totalUserWorkspaces.rows[0]?.count || 0
    if (count <= 1) {
      return NextResponse.json(
        { detail: "You cannot delete your only workspace. Create another workspace first." },
        { status: 400 }
      )
    }

    // Cascade delete sites & workspace
    const sitesRes = await pool.query("SELECT id, domain FROM sites WHERE workspace_id = $1", [workspaceId])
    for (const site of sitesRes.rows) {
      await pool.query("DELETE FROM pageviews WHERE site_id = $1", [site.id])
      await pool.query("DELETE FROM sessions WHERE site_id = $1", [site.id])
      await pool.query("DELETE FROM consent_receipts WHERE domain = $1", [site.domain])
      await pool.query("DELETE FROM consent_configs WHERE domain = $1", [site.domain])
      await pool.query("DELETE FROM sites WHERE id = $1", [site.id])
    }

    await pool.query("DELETE FROM workspaces WHERE id = $1", [workspaceId])

    return NextResponse.json({ ok: true, message: "Workspace deleted successfully" })
  } catch (err: any) {
    console.error("DELETE /api/v1/workspaces/[workspaceId] error:", err)
    return NextResponse.json({ detail: err.message || "Failed to delete workspace" }, { status: 500 })
  }
}
