import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

export async function GET(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400 })
    }

    // 1. Total receipts
    const totRes = await pool.query(
      "SELECT COUNT(id)::int AS total FROM consent_receipts WHERE domain = $1",
      [domain]
    )
    const totalReceipts = totRes.rows[0]?.total || 0

    if (totalReceipts === 0) {
      return NextResponse.json({
        domain,
        total_receipts: 0,
        acceptance_rate: 0.0,
        rejection_rate: 0.0,
        necessary_accepted_pct: 100.0,
        functional_accepted_pct: 0.0,
        analytics_accepted_pct: 0.0,
        performance_accepted_pct: 0.0,
        advertisement_accepted_pct: 0.0,
        recent_receipts: [],
      })
    }

    // 2. Aggregations
    const aggRes = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN consent_given THEN 1 ELSE 0 END), 0)::int AS accepted,
         COALESCE(SUM(CASE WHEN functional THEN 1 ELSE 0 END), 0)::int AS functional,
         COALESCE(SUM(CASE WHEN analytics THEN 1 ELSE 0 END), 0)::int AS analytics,
         COALESCE(SUM(CASE WHEN performance THEN 1 ELSE 0 END), 0)::int AS performance,
         COALESCE(SUM(CASE WHEN advertisement THEN 1 ELSE 0 END), 0)::int AS advertisement
       FROM consent_receipts
       WHERE domain = $1`,
      [domain]
    )

    const agg = aggRes.rows[0] || {}
    const accepted = agg.accepted || 0
    const functionalCnt = agg.functional || 0
    const analyticsCnt = agg.analytics || 0
    const performanceCnt = agg.performance || 0
    const adCnt = agg.advertisement || 0

    const acceptanceRate = Number(((accepted / totalReceipts) * 100).toFixed(1))
    const rejectionRate = Number((100.0 - acceptanceRate).toFixed(1))

    const functionalPct = Number(((functionalCnt / totalReceipts) * 100).toFixed(1))
    const analyticsPct = Number(((analyticsCnt / totalReceipts) * 100).toFixed(1))
    const performancePct = Number(((performanceCnt / totalReceipts) * 100).toFixed(1))
    const adPct = Number(((adCnt / totalReceipts) * 100).toFixed(1))

    // 3. Recent 5 receipts
    const recentRes = await pool.query(
      "SELECT * FROM consent_receipts WHERE domain = $1 ORDER BY created_at DESC LIMIT 5",
      [domain]
    )

    return NextResponse.json({
      domain,
      total_receipts: totalReceipts,
      acceptance_rate: acceptanceRate,
      rejection_rate: rejectionRate,
      necessary_accepted_pct: 100.0,
      functional_accepted_pct: functionalPct,
      analytics_accepted_pct: analyticsPct,
      performance_accepted_pct: performancePct,
      advertisement_accepted_pct: adPct,
      recent_receipts: recentRes.rows,
    })
  } catch (err: any) {
    console.error("GET /api/v1/consent/stats error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch consent stats" }, { status: 500 })
  }
}
