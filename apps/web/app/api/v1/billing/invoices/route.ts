import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { pool, ensureTables } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/v1/billing/invoices
 * Queries authoritative real invoices/transactions from Paddle API for the current workspace.
 * Falls back to logged billing events or returns empty array if no transactions have taken place.
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

    // Verify workspace membership or ownership
    const accessRes = await pool.query(
      `SELECT id FROM workspaces w 
       WHERE w.id = $1 
         AND (w.owner_id = $2 OR EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = $2))`,
      [workspaceId, user.id]
    )
    if (accessRes.rows.length === 0) {
      return NextResponse.json({ detail: "Access denied" }, { status: 403 })
    }

    // Query active subscription details
    const subRes = await pool.query(
      `SELECT paddle_customer_id, paddle_subscription_id, plan, status FROM subscriptions WHERE workspace_id = $1 LIMIT 1`,
      [workspaceId]
    )
    const sub = subRes.rows[0]
    const paddleCustomerId = sub?.paddle_customer_id || null

    let invoices: any[] = []

    // 1. If Paddle Customer ID & API Key exist, fetch real transactions directly from Paddle API
    if (paddleCustomerId && process.env.PADDLE_API_KEY) {
      try {
        const paddleBase =
          process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
            ? "https://api.paddle.com"
            : "https://sandbox-api.paddle.com"

        const paddleRes = await fetch(
          `${paddleBase}/transactions?customer_id=${encodeURIComponent(paddleCustomerId)}&order_by=created_at[desc]&per_page=15`,
          {
            headers: {
              Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
            },
            cache: "no-store",
          }
        )

        if (paddleRes.ok) {
          const paddleData = await paddleRes.json()
          if (Array.isArray(paddleData.data)) {
            invoices = paddleData.data.map((txn: any) => {
              const rawVal = txn.details?.totals?.total || txn.details?.payout_totals?.total || 0
              const amountRaw = Number(rawVal) || 0
              const currency = txn.currency_code || "USD"
              let formattedAmount = `$${(amountRaw / 100).toFixed(2)}`
              try {
                formattedAmount = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency,
                }).format(amountRaw / 100)
              } catch {
                // fallback to default string
              }

              const statusRaw = (txn.status || "").toLowerCase()
              const displayStatus =
                statusRaw === "paid" || statusRaw === "completed"
                  ? "Paid"
                  : statusRaw === "billed"
                  ? "Billed"
                  : statusRaw === "past_due"
                  ? "Past Due"
                  : statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1)

              return {
                id: txn.id,
                invoiceNumber: txn.invoice_number || txn.id,
                date: txn.billed_at || txn.created_at,
                amount: formattedAmount,
                status: displayStatus,
                receiptUrl: null,
                invoiceId: txn.invoice_id || null,
              }
            })
          }
        } else {
          console.warn("[Billing Invoices] Paddle API returned non-200:", paddleRes.status)
        }
      } catch (paddleErr) {
        console.warn("[Billing Invoices] Failed to query Paddle API transactions:", paddleErr)
      }
    }

    // 2. Query billing_events for any webhook-logged transactions or subscriptions as fallback
    if (invoices.length === 0) {
      try {
        const eventsRes = await pool.query(
          `SELECT event_id, event_type, occurred_at, payload 
           FROM billing_events 
           WHERE (payload->'data'->'custom_data'->>'workspace_id' = $1 
              OR payload->'data'->'custom_data'->>'workspaceId' = $1)
             AND event_type IN ('transaction.completed', 'transaction.paid', 'subscription.created', 'subscription.activated')
           ORDER BY occurred_at DESC 
           LIMIT 10`,
          [workspaceId]
        )

        if (eventsRes.rows.length > 0) {
          invoices = eventsRes.rows.map((row: any) => {
            const data = row.payload?.data || {}
            const amountRaw = data.details?.totals?.total || 1900
            return {
              id: data.id || row.event_id,
              invoiceNumber: data.invoice_number || `INV-${row.event_id.slice(-8).toUpperCase()}`,
              date: row.occurred_at,
              amount: `$${(amountRaw / 100).toFixed(2)}`,
              status: "Paid",
              receiptUrl: null,
              invoiceId: null,
            }
          })
        }
      } catch (dbErr) {
        console.warn("[Billing Invoices] billing_events fallback error:", dbErr)
      }
    }

    return NextResponse.json({
      invoices,
      hasPaddleCustomer: Boolean(paddleCustomerId),
      paddleCustomerId,
    })
  } catch (err: any) {
    console.error("[Billing Invoices Error]:", err)
    return NextResponse.json({ detail: "Failed to retrieve billing history" }, { status: 500 })
  }
}
