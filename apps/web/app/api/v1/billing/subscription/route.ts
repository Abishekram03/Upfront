import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { getWorkspaceEntitlements } from "@/lib/billing/entitlements"
import { PLANS } from "@/lib/billing/plans"
import { pool, ensureTables } from "@/lib/db"

/**
 * GET /api/v1/billing/subscription?workspaceId=<id>
 * Returns subscription state and available plan price IDs for Paddle Checkout.
 */
export async function GET(req: NextRequest) {
  try {
    await ensureTables()
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")

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

    const entitlements = await getWorkspaceEntitlements(workspaceId)

    const growthPriceId = process.env.NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID || "pri_growth_monthly"
    const businessPriceId = process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID || "pri_business_monthly"
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || ""
    const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox"

    return NextResponse.json({
      subscription: {
        workspaceId,
        plan: entitlements.plan,
        status: entitlements.status,
        isPaid: entitlements.isPaid,
        isPastDue: entitlements.isPastDue,
        currentPeriodStart: entitlements.currentPeriodStart,
        currentPeriodEnd: entitlements.currentPeriodEnd,
        cancelAtPeriodEnd: entitlements.cancelAtPeriodEnd,
        paddleSubscriptionId: entitlements.paddleSubscriptionId,
        paddleCustomerId: entitlements.paddleCustomerId,
      },
      plans: PLANS,
      paddleConfig: {
        environment: paddleEnv,
        clientToken,
        prices: {
          growth: growthPriceId,
          business: businessPriceId,
        },
      },
    })
  } catch (err: any) {
    console.error("GET /api/v1/billing/subscription error:", err)
    return NextResponse.json(
      { detail: err.message || "Failed to load subscription info" },
      { status: 500 }
    )
  }
}
