/**
 * UpFront - Paddle Billing & Webhook Processing Engine
 *
 * Implements:
 * 1. HMAC-SHA256 signature verification for Paddle webhooks
 * 2. Event deduplication via billing_events table
 * 3. Out-of-order event protection using occurred_at timestamp comparison
 * 4. Authoritative subscription state synchronization
 */

import { pool, ensureTables } from "../db"
import crypto from "node:crypto"
import { getPlanByPaddlePriceId, type PlanId, type SubscriptionStatus } from "./plans"

export interface PaddleWebhookEvent {
  event_id: string
  event_type: string
  occurred_at: string
  data: {
    id: string // subscription ID
    customer_id?: string
    status?: string
    items?: Array<{
      price?: {
        id?: string
        product_id?: string
      }
    }>
    current_billing_period?: {
      starts_at?: string
      ends_at?: string
    }
    scheduled_change?: {
      action?: string
      effective_at?: string
    } | null
    custom_data?: {
      workspace_id?: string
      workspaceId?: string
      user_id?: string
    }
    [key: string]: any
  }
}

/**
 * Verifies the Paddle webhook HMAC-SHA256 signature.
 * Header format: ts=1671552777;h1=eb38...
 */
export function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader?: string | null,
  secretKey?: string | null
): boolean {
  const secret = secretKey || process.env.PADDLE_WEBHOOK_SECRET_KEY
  if (!secret || !signatureHeader || !rawBody) {
    return false
  }

  try {
    const parts = signatureHeader.split(";")
    const tsPart = parts.find((p) => p.startsWith("ts="))
    const h1Part = parts.find((p) => p.startsWith("h1="))

    if (!tsPart || !h1Part) return false

    const ts = tsPart.slice(3)
    const h1 = h1Part.slice(3)

    const signedPayload = `${ts}:${rawBody}`
    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex")

    return crypto.timingSafeEqual(Buffer.from(h1, "hex"), Buffer.from(expectedHash, "hex"))
  } catch (err) {
    console.error("[Paddle Webhook] Signature verification failed:", err)
    return false
  }
}

/**
 * Processes an incoming verified Paddle webhook event idempotently.
 */
export async function processPaddleWebhook(event: PaddleWebhookEvent): Promise<{
  success: boolean
  action: "processed" | "deduplicated" | "skipped_out_of_order" | "ignored"
  workspaceId?: string
  plan?: PlanId
  status?: SubscriptionStatus
}> {
  await ensureTables()

  const { event_id, event_type, occurred_at, data } = event
  const eventDate = new Date(occurred_at || Date.now())

  // 1. Idempotency Check: Verify if event_id has already been processed
  const existingEvent = await pool.query(
    `SELECT id FROM billing_events WHERE event_id = $1 LIMIT 1`,
    [event_id]
  )

  if (existingEvent.rows.length > 0) {
    return { success: true, action: "deduplicated" }
  }

  // 2. Filter supported subscription lifecycle events
  const supportedEvents = [
    "subscription.created",
    "subscription.updated",
    "subscription.activated",
    "subscription.trialing",
    "subscription.past_due",
    "subscription.paused",
    "subscription.resumed",
    "subscription.canceled",
  ]

  if (!supportedEvents.includes(event_type)) {
    // Record event and exit cleanly
    await pool.query(
      `INSERT INTO billing_events (id, event_id, event_type, occurred_at, payload)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id) DO NOTHING`,
      [`evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, event_id, event_type, eventDate, JSON.stringify(event)]
    )
    return { success: true, action: "ignored" }
  }

  const paddleSubscriptionId = data.id
  const paddleCustomerId = data.customer_id || null
  const priceId = data.items?.[0]?.price?.id || null
  const plan = getPlanByPaddlePriceId(priceId)
  
  // Map Paddle status to internal status
  const rawStatus = (data.status || "").toLowerCase()
  let status: SubscriptionStatus = "active"
  if (rawStatus === "trialing") status = "trialing"
  else if (rawStatus === "past_due") status = "past_due"
  else if (rawStatus === "paused") status = "paused"
  else if (rawStatus === "canceled") status = "canceled"
  else status = "active"

  const periodStart = data.current_billing_period?.starts_at
    ? new Date(data.current_billing_period.starts_at)
    : null
  const periodEnd = data.current_billing_period?.ends_at
    ? new Date(data.current_billing_period.ends_at)
    : null
  const cancelAtPeriodEnd = data.scheduled_change?.action === "cancel"

  // 3. Resolve target workspace ID
  let workspaceId = data.custom_data?.workspace_id || data.custom_data?.workspaceId

  if (!workspaceId) {
    // Fallback: look up workspace by existing paddle_subscription_id or paddle_customer_id
    const subLookup = await pool.query(
      `SELECT workspace_id FROM subscriptions 
       WHERE paddle_subscription_id = $1 OR paddle_customer_id = $2 
       LIMIT 1`,
      [paddleSubscriptionId, paddleCustomerId]
    )
    if (subLookup.rows.length > 0) {
      workspaceId = subLookup.rows[0].workspace_id
    }
  }

  if (!workspaceId) {
    console.warn(`[Paddle Webhook] No workspaceId could be resolved for subscription ${paddleSubscriptionId}`)
    // Store event for audit
    await pool.query(
      `INSERT INTO billing_events (id, event_id, event_type, occurred_at, payload)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id) DO NOTHING`,
      [`evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, event_id, event_type, eventDate, JSON.stringify(event)]
    )
    return { success: true, action: "ignored" }
  }

  // 4. Out-of-Order Protection: Compare occurred_at against last_event_at
  const currentSub = await pool.query(
    `SELECT last_event_at FROM subscriptions WHERE workspace_id = $1 LIMIT 1`,
    [workspaceId]
  )

  if (currentSub.rows.length > 0 && currentSub.rows[0].last_event_at) {
    const lastEventTime = new Date(currentSub.rows[0].last_event_at).getTime()
    if (eventDate.getTime() < lastEventTime) {
      console.warn(`[Paddle Webhook] Skipping out-of-order event ${event_id} (occurred ${occurred_at} < last ${currentSub.rows[0].last_event_at})`)
      await pool.query(
        `INSERT INTO billing_events (id, event_id, event_type, occurred_at, payload)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (event_id) DO NOTHING`,
        [`evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, event_id, event_type, eventDate, JSON.stringify(event)]
      )
      return { success: true, action: "skipped_out_of_order", workspaceId }
    }
  }

  // 5. Upsert subscription record in PostgreSQL
  const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  await pool.query(
    `INSERT INTO subscriptions (
      id, workspace_id, plan, paddle_customer_id, paddle_subscription_id,
      paddle_price_id, status, current_period_start, current_period_end,
      cancel_at_period_end, last_event_id, last_event_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, $11, $12, NOW()
    )
    ON CONFLICT (workspace_id) DO UPDATE SET
      plan = EXCLUDED.plan,
      paddle_customer_id = COALESCE(EXCLUDED.paddle_customer_id, subscriptions.paddle_customer_id),
      paddle_subscription_id = COALESCE(EXCLUDED.paddle_subscription_id, subscriptions.paddle_subscription_id),
      paddle_price_id = EXCLUDED.paddle_price_id,
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      last_event_id = EXCLUDED.last_event_id,
      last_event_at = EXCLUDED.last_event_at,
      updated_at = NOW()`,
    [
      subId,
      workspaceId,
      plan,
      paddleCustomerId,
      paddleSubscriptionId,
      priceId,
      status,
      periodStart,
      periodEnd,
      cancelAtPeriodEnd,
      event_id,
      eventDate,
    ]
  )

  // 6. Update workspaces plan_tier and ensure onboarding_completed = true
  await pool.query(
    `UPDATE workspaces 
     SET plan_tier = $1, 
         onboarding_completed = TRUE, 
         onboarding_step = 'completed', 
         updated_at = NOW() 
     WHERE id = $2`,
    [plan, workspaceId]
  )

  // 7. Record processed event in billing_events table
  await pool.query(
    `INSERT INTO billing_events (id, event_id, event_type, occurred_at, payload)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (event_id) DO NOTHING`,
    [`evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, event_id, event_type, eventDate, JSON.stringify(event)]
  )

  console.log(`[Paddle Webhook] Successfully synchronized workspace ${workspaceId} -> Plan: ${plan}, Status: ${status}`)

  return {
    success: true,
    action: "processed",
    workspaceId,
    plan,
    status,
  }
}
