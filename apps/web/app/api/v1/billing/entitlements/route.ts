import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { getWorkspaceEntitlements, getWorkspaceUsage } from "@/lib/billing/entitlements"
import { pool, ensureTables } from "@/lib/db"

/**
 * GET /api/v1/billing/entitlements?workspaceId=<id>
 * Resolves current workspace's plan, capability entitlements, and usage stats.
 */
export async function GET(req: NextRequest) {
  try {
    await ensureTables()
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    let workspaceId = searchParams.get("workspaceId")

    // If no workspaceId provided, find the user's default/first workspace
    if (!workspaceId) {
      const wsRes = await pool.query(
        `SELECT w.id FROM workspaces w
         INNER JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = $1
         ORDER BY w.created_at ASC LIMIT 1`,
        [user.id]
      )
      if (wsRes.rows.length > 0) {
        workspaceId = wsRes.rows[0].id
      }
    }

    if (!workspaceId) {
      // Return default Free entitlements
      const defaultEntitlements = await getWorkspaceEntitlements("")
      return NextResponse.json({
        entitlements: defaultEntitlements,
        usage: {
          pageviewsThisMonth: 0,
          pageviewLimit: 50000,
          pageviewPercent: 0,
          sitesCount: 0,
        },
      })
    }

    // Verify user belongs to this workspace
    const memberRes = await pool.query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, user.id]
    )
    if (memberRes.rows.length === 0) {
      return NextResponse.json({ detail: "Access denied to workspace" }, { status: 403 })
    }

    const [entitlements, usage] = await Promise.all([
      getWorkspaceEntitlements(workspaceId),
      getWorkspaceUsage(workspaceId),
    ])

    return NextResponse.json({
      entitlements,
      usage,
    })
  } catch (err: any) {
    console.error("GET /api/v1/billing/entitlements error:", err)
    return NextResponse.json(
      { detail: err.message || "Failed to load entitlements" },
      { status: 500 }
    )
  }
}
