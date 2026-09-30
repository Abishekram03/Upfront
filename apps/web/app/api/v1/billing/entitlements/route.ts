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

    // Verify user belongs to this workspace (owner or member)
    const accessRes = await pool.query(
      `SELECT id FROM workspaces w 
       WHERE w.id = $1 
         AND (w.owner_id = $2 OR EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = $2))`,
      [workspaceId, user.id]
    )
    if (accessRes.rows.length === 0) {
      return NextResponse.json({ detail: "Access denied to workspace" }, { status: 403 })
    }

    const entitlements = await getWorkspaceEntitlements(workspaceId)
    const usage = await getWorkspaceUsage(workspaceId)

    return NextResponse.json({
      entitlements,
      usage,
    })
  } catch (err: any) {
    console.error("GET /api/v1/billing/entitlements error:", err)
    // Always fallback gracefully to default free entitlements instead of crashing with 500
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
}
