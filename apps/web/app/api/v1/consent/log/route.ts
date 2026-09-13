import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const payload = await req.json()
    const cleanDomain = sanitizeDomain(payload.domain)

    if (!cleanDomain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    const adConsent = Boolean(payload.advertisement || payload.marketing)
    const receiptId = randomUUID()

    await pool.query(
      `INSERT INTO consent_receipts (
        id, domain, visitor_hash, country, consent_given,
        necessary, functional, analytics, performance, advertisement,
        user_agent_category, consent_version, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, NOW()
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
        payload.consent_version || "1.0",
      ]
    )

    return NextResponse.json({ ok: true, receipt_id: receiptId }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("POST /api/v1/consent/log error:", err)
    return NextResponse.json({ detail: err.message || "Failed to log consent receipt" }, { status: 500, headers: CORS_HEADERS })
  }
}
