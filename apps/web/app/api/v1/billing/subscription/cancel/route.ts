import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { getWorkspaceEntitlements } from "@/lib/billing/entitlements"
import { pool, ensureTables } from "@/lib/db"

/**
 * POST /api/v1/billing/subscription/cancel
 * Body: { workspaceId: string, cancelImmediately?: boolean }
 * Cancels active subscription via Paddle API or updates database records directly.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureTables()
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { workspaceId, cancelImmediately = false } = body

    if (!workspaceId) {
      return NextResponse.json({ detail: "workspaceId is required" }, { status: 400 })
    }

    // Verify user is an owner or admin of this workspace
    const accessRes = await pool.query(
      `SELECT id, owner_id FROM workspaces w 
       WHERE w.id = $1 
         AND (w.owner_id = $2 OR EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = $2 AND wm.role IN ('owner', 'admin')))`,
      [workspaceId, user.id]
    )
    if (accessRes.rows.length === 0) {
      return NextResponse.json(
        { detail: "Access denied. Only workspace owners and admins can cancel subscriptions." },
        { status: 403 }
      )
    }

    // Fetch existing subscription
    const subRes = await pool.query(
      `SELECT * FROM subscriptions WHERE workspace_id = $1 LIMIT 1`,
      [workspaceId]
    )
    const subscription = subRes.rows[0]

    // Call Paddle API if live/sandbox credentials and subscription ID exist
    if (subscription?.paddle_subscription_id && process.env.PADDLE_API_KEY) {
      try {
        const paddleBase =
          process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
            ? "https://api.paddle.com"
            : "https://sandbox-api.paddle.com"

        const effectiveFrom = cancelImmediately ? "immediately" : "next_billing_period"
        const paddleRes = await fetch(
          `${paddleBase}/subscriptions/${subscription.paddle_subscription_id}/cancel`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ effective_from: effectiveFrom }),
          }
        )

        if (!paddleRes.ok) {
          const errData = await paddleRes.json().catch(() => ({}))
          console.warn("[Paddle API Cancel Warning]", errData)
        }
      } catch (paddleErr) {
        console.warn("[Paddle Cancel Network Notice]", paddleErr)
      }
    }

    // Update local database subscription state
    if (cancelImmediately) {
      await pool.query(
        `UPDATE subscriptions 
         SET status = 'canceled', 
             plan = 'free', 
             cancel_at_period_end = false, 
             updated_at = NOW() 
         WHERE workspace_id = $1`,
        [workspaceId]
      )
      await pool.query(
        `UPDATE workspaces SET plan_tier = 'free', updated_at = NOW() WHERE id = $1`,
        [workspaceId]
      )
    } else {
      // Retain active plan until currentPeriodEnd, but set cancel_at_period_end = true
      await pool.query(
        `UPDATE subscriptions 
         SET cancel_at_period_end = true, 
             updated_at = NOW() 
         WHERE workspace_id = $1`,
        [workspaceId]
      )
    }

    const refreshedEntitlements = await getWorkspaceEntitlements(workspaceId)

    return NextResponse.json({
      success: true,
      message: cancelImmediately
        ? "Subscription cancelled immediately. Workspace is now on Free Plan."
        : "Subscription will cancel at the end of the current billing cycle.",
      entitlements: refreshedEntitlements,
    })
  } catch (err: any) {
    console.error("POST /api/v1/billing/subscription/cancel error:", err)
    return NextResponse.json(
      { detail: err.message || "Failed to cancel subscription" },
      { status: 500 }
    )
  }
}
