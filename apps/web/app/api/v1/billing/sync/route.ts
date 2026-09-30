import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { pool, ensureTables } from "@/lib/db"
import { getPlan } from "@/lib/billing/plans"

/**
 * POST /api/v1/billing/sync
 * Allows authenticated workspace member to instantly synchronize and provision
 * their subscription status immediately following a completed client checkout.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureTables()
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { workspaceId, plan, paddleSubscriptionId, paddleCustomerId, paddlePriceId } = body

    if (!workspaceId) {
      return NextResponse.json({ detail: "workspaceId is required" }, { status: 400 })
    }

    // Verify user is a member of this workspace
    const memberRes = await pool.query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, user.id]
    )
    if (memberRes.rows.length === 0) {
      return NextResponse.json({ detail: "Access denied to workspace" }, { status: 403 })
    }

    const targetPlan = plan === "business" ? "business" : "growth"
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Upsert subscription state
    await pool.query(
      `INSERT INTO subscriptions (
        id, workspace_id, plan, status, paddle_subscription_id, paddle_customer_id,
        paddle_price_id, current_period_start, current_period_end, cancel_at_period_end,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      ON CONFLICT (workspace_id) DO UPDATE SET
        plan = EXCLUDED.plan,
        status = 'active',
        paddle_subscription_id = COALESCE(EXCLUDED.paddle_subscription_id, subscriptions.paddle_subscription_id),
        paddle_customer_id = COALESCE(EXCLUDED.paddle_customer_id, subscriptions.paddle_customer_id),
        paddle_price_id = COALESCE(EXCLUDED.paddle_price_id, subscriptions.paddle_price_id),
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = false,
        updated_at = NOW()`,
      [
        `sub_${workspaceId}`,
        workspaceId,
        targetPlan,
        "active",
        paddleSubscriptionId || null,
        paddleCustomerId || null,
        paddlePriceId || null,
        now,
        periodEnd,
        false,
      ]
    )

    // Update workspace plan tier column as well
    await pool.query(
      `UPDATE workspaces SET plan_tier = $1, updated_at = NOW() WHERE id = $2`,
      [targetPlan, workspaceId]
    )

    return NextResponse.json({
      success: true,
      plan: targetPlan,
      status: "active",
      workspaceId,
    })
  } catch (err: any) {
    console.error("POST /api/v1/billing/sync error:", err)
    return NextResponse.json(
      { detail: err.message || "Failed to sync billing state" },
      { status: 500 }
    )
  }
}
