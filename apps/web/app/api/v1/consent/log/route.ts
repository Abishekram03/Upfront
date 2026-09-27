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

// In-Memory High-Throughput Batch Buffer for 100K Concurrent Scaling
interface ReceiptRecord {
  id: string
  domain: string
  visitor_hash: string
  country: string | null
  consent_given: boolean
  necessary: boolean
  functional: boolean
  analytics: boolean
  performance: boolean
  advertisement: boolean
  user_agent_category: string
  consent_version: string
}

let batchBuffer: ReceiptRecord[] = []
let flushTimer: NodeJS.Timeout | null = null

async function flushBatch() {
  if (batchBuffer.length === 0) return
  const items = [...batchBuffer]
  batchBuffer = []

  try {
    const client = await pool.connect()
    try {
      // Perform multi-row batch insert
      const valueStrings: string[] = []
      const params: any[] = []
      let pIdx = 1

      for (const item of items) {
        valueStrings.push(
          `($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, NOW())`
        )
        params.push(
          item.id,
          item.domain,
          item.visitor_hash,
          item.country,
          item.consent_given,
          item.necessary,
          item.functional,
          item.analytics,
          item.performance,
          item.advertisement,
          item.user_agent_category,
          item.consent_version
        )
      }

      const query = `
        INSERT INTO consent_receipts (
          id, domain, visitor_hash, country, consent_given,
          necessary, functional, analytics, performance, advertisement,
          user_agent_category, consent_version, created_at
        ) VALUES ${valueStrings.join(", ")}
      `
      await client.query(query, params)
    } finally {
      client.release()
    }
  } catch (err) {
    console.error("[ConsentOS Log Buffer] Batch insert failed:", err)
  }
}

function scheduleFlush() {
  if (batchBuffer.length >= 50) {
    if (flushTimer) clearTimeout(flushTimer)
    flushTimer = null
    flushBatch()
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null
      flushBatch()
    }, 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const cleanDomain = sanitizeDomain(payload.domain)

    if (!cleanDomain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    const rawHeaderCountry = (
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cloudfront-viewer-country") ||
      req.headers.get("x-country-code") ||
      ""
    ).trim().toUpperCase().slice(0, 2)

    const isValidHeaderCountry = /^[A-Z]{2}$/.test(rawHeaderCountry) && rawHeaderCountry !== "XX" && rawHeaderCountry !== "T1"
    const detectedHeaderCountry = isValidHeaderCountry ? rawHeaderCountry : null

    const rawPayloadCountry = typeof payload.country === "string" ? payload.country.trim().toUpperCase().slice(0, 2) : ""
    const isValidPayloadCountry = /^[A-Z]{2}$/.test(rawPayloadCountry) && rawPayloadCountry !== "XX" && rawPayloadCountry !== "T1"
    const detectedPayloadCountry = isValidPayloadCountry ? rawPayloadCountry : null

    const finalReceiptCountry = detectedPayloadCountry || detectedHeaderCountry || null

    const receiptId = randomUUID()
    const record: ReceiptRecord = {
      id: receiptId,
      domain: cleanDomain,
      visitor_hash: payload.visitor_hash || "anonymous",
      country: finalReceiptCountry,
      consent_given: payload.consent_given !== undefined ? Boolean(payload.consent_given) : true,
      necessary: true,
      functional: Boolean(payload.functional),
      analytics: Boolean(payload.analytics),
      performance: Boolean(payload.performance),
      advertisement: Boolean(payload.advertisement || payload.marketing),
      user_agent_category: payload.user_agent_category || "Desktop",
      consent_version: payload.consent_version || "1.0",
    }

    batchBuffer.push(record)
    scheduleFlush()

    return NextResponse.json(
      { ok: true, receipt_id: receiptId },
      {
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    )
  } catch (err: any) {
    console.error("POST /api/v1/consent/log error:", err)
    return NextResponse.json({ detail: err.message || "Failed to buffer receipt" }, { status: 500, headers: CORS_HEADERS })
  }
}
