import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await ensureTables()
    const user = await getCurrentUser()
    const { workspaceId } = await params

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    // Verify workspace membership
    const memberCheck = await pool.query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, user.id]
    )

    if (memberCheck.rows.length === 0) {
      return NextResponse.json({ detail: "Workspace not found or unauthorized" }, { status: 404 })
    }

    const wsRes = await pool.query(
      `SELECT id, name, slug, onboarding_completed, onboarding_step, first_site_id
       FROM workspaces
       WHERE id = $1`,
      [workspaceId]
    )

    if (wsRes.rows.length === 0) {
      return NextResponse.json({ detail: "Workspace not found" }, { status: 404 })
    }

    const ws = wsRes.rows[0]
    let firstSite = null

    if (ws.first_site_id) {
      const siteRes = await pool.query(
        `SELECT id, domain, name, timezone, installation_status, last_verified_at, created_at
         FROM sites
         WHERE id = $1 AND workspace_id = $2`,
        [ws.first_site_id, workspaceId]
      )
      if (siteRes.rows.length > 0) {
        firstSite = siteRes.rows[0]
      }
    } else {
      // Check if there is already a site in this workspace
      const siteRes = await pool.query(
        `SELECT id, domain, name, timezone, installation_status, last_verified_at, created_at
         FROM sites
         WHERE workspace_id = $1
         ORDER BY created_at ASC LIMIT 1`,
        [workspaceId]
      )
      if (siteRes.rows.length > 0) {
        firstSite = siteRes.rows[0]
      }
    }

    return NextResponse.json({
      workspace_id: ws.id,
      name: ws.name,
      slug: ws.slug,
      onboarding_completed: Boolean(ws.onboarding_completed),
      onboarding_step: ws.onboarding_step || "welcome",
      first_site_id: ws.first_site_id || firstSite?.id || null,
      site: firstSite,
    })
  } catch (err: any) {
    console.error("GET /api/v1/workspaces/[workspaceId]/onboarding error:", err)
    return NextResponse.json({ detail: err.message || "Failed to load onboarding state" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await ensureTables()
    const user = await getCurrentUser()
    const { workspaceId } = await params

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    // Verify workspace membership (owner or admin or member)
    const memberCheck = await pool.query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, user.id]
    )

    if (memberCheck.rows.length === 0) {
      return NextResponse.json({ detail: "Workspace not found or unauthorized" }, { status: 404 })
    }

    const body = await req.json()
    const { step, onboarding_completed, first_site_id, skip, installation_status } = body

    // If skipping: set installation_status = 'pending' on the site, mark onboarding_completed = true so user enters dashboard
    if (skip && first_site_id) {
      await pool.query(
        `UPDATE sites SET installation_status = 'pending' WHERE id = $1 AND workspace_id = $2`,
        [first_site_id, workspaceId]
      )
    }

    if (installation_status && first_site_id) {
      await pool.query(
        `UPDATE sites SET installation_status = $1 WHERE id = $2 AND workspace_id = $3`,
        [installation_status, first_site_id, workspaceId]
      )
    }

    const updateFields: string[] = []
    const updateValues: any[] = []
    let valIdx = 1

    if (step !== undefined) {
      updateFields.push(`onboarding_step = $${valIdx++}`)
      updateValues.push(step)
    }

    if (onboarding_completed !== undefined) {
      updateFields.push(`onboarding_completed = $${valIdx++}`)
      updateValues.push(Boolean(onboarding_completed))
    }

    if (first_site_id !== undefined) {
      updateFields.push(`first_site_id = $${valIdx++}`)
      updateValues.push(first_site_id)
    }

    updateFields.push(`updated_at = NOW()`)

    updateValues.push(workspaceId)
    const wsUpdateRes = await pool.query(
      `UPDATE workspaces
       SET ${updateFields.join(", ")}
       WHERE id = $${valIdx}
       RETURNING id, name, slug, onboarding_completed, onboarding_step, first_site_id`,
      updateValues
    )

    const updatedWs = wsUpdateRes.rows[0]
    return NextResponse.json({
      success: true,
      workspace: updatedWs,
    })
  } catch (err: any) {
    console.error("POST /api/v1/workspaces/[workspaceId]/onboarding error:", err)
    return NextResponse.json({ detail: err.message || "Failed to update onboarding state" }, { status: 500 })
  }
}
