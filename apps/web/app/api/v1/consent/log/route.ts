import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const payload = await req.json()
    const cleanDomain = sanitizeDomain(payload.domain)

    if (!cleanDomain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400 })
    }

    const adConsent = Boolean(payload.advertisement || payload.marketing)
    const receiptId = randomUUID()

    await pool.query(
      `INSERT INTO consent_receipts (
        id, domain, visitor_hash, country, consent_given,
        necessary, functional, analytics, performance, advertisement,
        user_agent_category, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, NOW()
      )`,
      [
        receiptId,
        cleanDomain,
        payload.visitor_hash || "anonymous",
        payload.country || "US",
        payload.consent_given !== undefined ? payload.consent_given : true,
        payload.necessary !== undefined ? payload.necessary : true,
        Boolean(payload.functional),
        Boolean(payload.analytics),
        Boolean(payload.performance),
        adConsent,
        payload.user_agent_category || "Desktop",
      ]
    )

    return NextResponse.json({ ok: true, receipt_id: receiptId })
  } catch (err: any) {
    console.error("POST /api/v1/consent/log error:", err)
    return NextResponse.json({ detail: err.message || "Failed to log consent receipt" }, { status: 500 })
  }
}
