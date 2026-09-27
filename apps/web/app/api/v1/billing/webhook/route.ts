import { NextRequest, NextResponse } from "next/server"
import { verifyPaddleWebhookSignature, processPaddleWebhook, type PaddleWebhookEvent } from "@/lib/billing/paddle"

/**
 * POST /api/v1/billing/webhook
 * Receives and processes authoritative Paddle subscription lifecycle webhooks.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get("Paddle-Signature") || req.headers.get("paddle-signature")

    // 1. Verify webhook signature
    // In local development or test mode without secret, allow testing simulator if explicitly bypassed
    const secretKey = process.env.PADDLE_WEBHOOK_SECRET_KEY
    const isTestBypass = process.env.NODE_ENV !== "production" && req.headers.get("x-paddle-test-bypass") === "true"

    if (!isTestBypass && secretKey) {
      const isValid = verifyPaddleWebhookSignature(rawBody, signatureHeader, secretKey)
      if (!isValid) {
        console.warn("[Paddle Webhook] Rejected invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // 2. Parse event payload
    const event = JSON.parse(rawBody) as PaddleWebhookEvent
    if (!event.event_id || !event.event_type) {
      return NextResponse.json({ error: "Invalid event format" }, { status: 400 })
    }

    // 3. Process event idempotently
    const result = await processPaddleWebhook(event)

    return NextResponse.json({
      received: true,
      action: result.action,
      plan: result.plan,
      status: result.status,
    })
  } catch (err: any) {
    console.error("[Paddle Webhook Error]", err)
    return NextResponse.json(
      { error: "Webhook processing error", detail: err.message },
      { status: 500 }
    )
  }
}
