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

    console.log("[Billing Sync] Request received:", { workspaceId, plan, paddleSubscriptionId, paddleCustomerId, paddlePriceId })

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

    // Handle Traffic Booster Add-On (100k pageviews with rollover)
    if (plan === "addon_100k" || plan?.includes("addon")) {
      const updateRes = await pool.query(
        `UPDATE workspaces 
         SET extra_pageviews_balance = COALESCE(extra_pageviews_balance, 0) + 100000,
             updated_at = NOW()
         WHERE id = $1
         RETURNING extra_pageviews_balance`,
        [workspaceId]
      )

      await pool.query(
        `INSERT INTO billing_events (id, event_id, event_type, occurred_at, payload)
         VALUES ($1, $2, $3, NOW(), $4)
         ON CONFLICT (event_id) DO NOTHING`,
        [
          `evt_${Date.now()}_addon`,
          `evt_addon_${Date.now()}`,
          "transaction.completed",
          JSON.stringify({
            data: {
              id: `txn_${Date.now()}`,
              invoice_number: `INV-ADDON-${Date.now().toString().slice(-6)}`,
              status: "paid",
              details: { totals: { total: 1000 } },
              custom_data: { workspace_id: workspaceId, plan: "addon_100k" },
            },
          }),
        ]
      )

      return NextResponse.json({
        success: true,
        isAddon: true,
        extraPageviewsBalance: updateRes.rows[0]?.extra_pageviews_balance || 100000,
        message: "🎉 100k Pageview Booster added! Your rollover capacity has been updated.",
      })
    }

    const targetPlan = plan === "business" ? "business" : "growth"
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Upsert subscription state (this is the critical write)
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
        workspaceId.substring(0, 36),
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

    console.log(`[Billing Sync] ✅ Subscription upserted: workspace=${workspaceId}, plan=${targetPlan}`)

    // Update workspace plan_tier and ensure onboarding_completed = true
    try {
      await pool.query(
        `UPDATE workspaces 
         SET plan_tier = $1, 
             onboarding_completed = TRUE, 
             onboarding_step = 'completed', 
             updated_at = NOW() 
         WHERE id = $2`,
        [targetPlan, workspaceId]
      )
      console.log(`[Billing Sync] ✅ Workspace plan_tier updated to ${targetPlan} and onboarding_completed = TRUE`)
    } catch (tierErr: any) {
      console.warn(`[Billing Sync] ⚠️ plan_tier update notice:`, tierErr.message)
    }

    // Verify the subscription was written correctly
    const verifyRes = await pool.query(
      `SELECT plan, status FROM subscriptions WHERE workspace_id = $1 LIMIT 1`,
      [workspaceId]
    )
    const verifiedPlan = verifyRes.rows[0]?.plan || "unknown"
    const verifiedStatus = verifyRes.rows[0]?.status || "unknown"
    console.log(`[Billing Sync] ✅ Verified: plan=${verifiedPlan}, status=${verifiedStatus}`)

    return NextResponse.json({
      success: true,
      plan: targetPlan,
      status: "active",
      workspaceId,
      verified: { plan: verifiedPlan, status: verifiedStatus },
    })
  } catch (err: any) {
    console.error("POST /api/v1/billing/sync error:", err)
    return NextResponse.json(
      { detail: err.message || "Failed to sync billing state" },
      { status: 500 }
    )
  }
}
