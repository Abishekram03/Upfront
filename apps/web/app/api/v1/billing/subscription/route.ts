import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { getWorkspaceEntitlements } from "@/lib/billing/entitlements"
import { PLANS, PADDLE_PRICE_IDS } from "@/lib/billing/plans"
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

    // Verify user is a member or owner of this workspace
    const accessRes = await pool.query(
      `SELECT id FROM workspaces w 
       WHERE w.id = $1 
         AND (w.owner_id = $2 OR EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = $2))`,
      [workspaceId, user.id]
    )
    if (accessRes.rows.length === 0) {
      return NextResponse.json({ detail: "Access denied to workspace" }, { status: 403 })
    }

    let entitlements = await getWorkspaceEntitlements(workspaceId)

    // Self-healing Auto-Sync with Paddle API if workspace is currently Free
    if (!entitlements.isPaid && process.env.PADDLE_API_KEY) {
      try {
        const paddleBase = process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
          ? "https://api.paddle.com"
          : "https://sandbox-api.paddle.com"

        const paddleRes = await fetch(`${paddleBase}/subscriptions?status=active`, {
          headers: {
            Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
          },
          next: { revalidate: 0 },
        })

        if (paddleRes.ok) {
          const paddleData = await paddleRes.json()
          const matchedSub = (paddleData.data || []).find((sub: any) => {
            const customWsId = sub.custom_data?.workspace_id || sub.custom_data?.workspaceId
            return customWsId === workspaceId || sub.customer?.email === user.email || sub.customer_id
          })

          if (matchedSub) {
            const priceId = matchedSub.items?.[0]?.price?.id || ""
            const isBusiness =
              priceId === PADDLE_PRICE_IDS.business ||
              priceId === (process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID || "pri_01m3rgx14zzhfr3g10241pxw93") ||
              priceId.toLowerCase().includes("business")

            const targetPlan = isBusiness ? "business" : "growth"

            const now = new Date()
            const periodEnd = matchedSub.current_billing_period?.ends_at
              ? new Date(matchedSub.current_billing_period.ends_at)
              : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

            await pool.query(
              `INSERT INTO subscriptions (
                id, workspace_id, plan, status, paddle_subscription_id, paddle_customer_id,
                paddle_price_id, current_period_start, current_period_end, cancel_at_period_end,
                created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
              ON CONFLICT (workspace_id) DO UPDATE SET
                plan = EXCLUDED.plan,
                status = 'active',
                paddle_subscription_id = EXCLUDED.paddle_subscription_id,
                paddle_customer_id = EXCLUDED.paddle_customer_id,
                paddle_price_id = EXCLUDED.paddle_price_id,
                current_period_start = EXCLUDED.current_period_start,
                current_period_end = EXCLUDED.current_period_end,
                cancel_at_period_end = false,
                updated_at = NOW()`,
              [
                `sub_${workspaceId}`,
                workspaceId,
                targetPlan,
                "active",
                matchedSub.id,
                matchedSub.customer_id,
                priceId,
                now,
                periodEnd,
                false,
              ]
            )

            await pool.query(
              `UPDATE workspaces SET plan_tier = $1, updated_at = NOW() WHERE id = $2`,
              [targetPlan, workspaceId]
            )

            // Reload refreshed entitlements
            entitlements = await getWorkspaceEntitlements(workspaceId)
          }
        }
      } catch (err) {
        console.warn("[Billing Auto-Sync] Paddle check notice:", err)
      }
    }

    const growthPriceId = process.env.NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID || PADDLE_PRICE_IDS.growth
    const businessPriceId = process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID || PADDLE_PRICE_IDS.business
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || ""
    const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox"

    const addonPriceId = process.env.NEXT_PUBLIC_PADDLE_ADDON_100K_PRICE_ID || "pri_01addon_100k_pageviews"

    let extraPageviewsBalance = 0
    try {
      const wsRes = await pool.query(
        `SELECT extra_pageviews_balance FROM workspaces WHERE id = $1 LIMIT 1`,
        [workspaceId]
      )
      extraPageviewsBalance = wsRes.rows[0]?.extra_pageviews_balance || 0
    } catch {
      // ignore
    }

    const enrichedPlans = {
      ...PLANS,
      growth: { ...PLANS.growth, paddlePriceId: growthPriceId },
      business: { ...PLANS.business, paddlePriceId: businessPriceId },
    }

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
      plans: enrichedPlans,
      addons: {
        pageviews_100k: {
          id: "pageviews_100k",
          name: "100k Pageview Booster",
          price: 10,
          pageviews: 100000,
          rollover: true,
          paddlePriceId: addonPriceId,
        },
      },
      extraPageviewsBalance,
      userEmail: user.email,
      paddleConfig: {
        environment: paddleEnv,
        clientToken,
        prices: {
          growth: growthPriceId,
          business: businessPriceId,
          addon100k: addonPriceId,
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
