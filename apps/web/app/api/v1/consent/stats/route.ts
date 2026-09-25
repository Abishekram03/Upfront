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

    // 1. Total consent decision count
    const totRes = await pool.query(
      "SELECT COUNT(id)::int AS total FROM consent_receipts WHERE domain = $1",
      [domain]
    )
    const totalDecisions = totRes.rows[0]?.total || 0

    // 2. Integration / Connectivity check (latest receipt or pageview timestamp)
    const lastReceiptRes = await pool.query(
      "SELECT created_at FROM consent_receipts WHERE domain = $1 ORDER BY created_at DESC LIMIT 1",
      [domain]
    )
    const lastDetectedAt = lastReceiptRes.rows[0]?.created_at || null
    const isConnected = Boolean(lastDetectedAt)

    if (totalDecisions === 0) {
      return NextResponse.json({
        domain,
        total_decisions: 0,
        total_receipts: 0,
        accept_all_count: 0,
        accept_all_rate: 0.0,
        reject_all_count: 0,
        reject_all_rate: 0.0,
        custom_choice_count: 0,
        custom_choice_rate: 0.0,
        analytics_opt_in_pct: 0.0,
        necessary_pct: 100.0,
        functional_pct: 0.0,
        analytics_pct: 0.0,
        performance_pct: 0.0,
        advertisement_pct: 0.0,
        is_connected: isConnected,
        last_detected_at: lastDetectedAt,
        recent_receipts: [],
      })
    }

    // 3. Granular explicit decision calculations:
    // Accept All: all optional categories were granted
    // Reject All: all optional categories were rejected
    // Custom: category-specific choice that is neither Accept All nor Reject All
    const aggRes = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN functional AND analytics AND performance AND advertisement THEN 1 ELSE 0 END), 0)::int AS accept_all,
         COALESCE(SUM(CASE WHEN (NOT functional) AND (NOT analytics) AND (NOT performance) AND (NOT advertisement) THEN 1 ELSE 0 END), 0)::int AS reject_all,
         COALESCE(SUM(CASE WHEN functional THEN 1 ELSE 0 END), 0)::int AS functional_count,
         COALESCE(SUM(CASE WHEN analytics THEN 1 ELSE 0 END), 0)::int AS analytics_count,
         COALESCE(SUM(CASE WHEN performance THEN 1 ELSE 0 END), 0)::int AS performance_count,
         COALESCE(SUM(CASE WHEN advertisement THEN 1 ELSE 0 END), 0)::int AS advertisement_count
       FROM consent_receipts
       WHERE domain = $1`,
      [domain]
    )

    const agg = aggRes.rows[0] || {}
    const acceptAllCount = agg.accept_all || 0
    const rejectAllCount = agg.reject_all || 0
    const customChoiceCount = Math.max(0, totalDecisions - acceptAllCount - rejectAllCount)

    const functionalCount = agg.functional_count || 0
    const analyticsCount = agg.analytics_count || 0
    const performanceCount = agg.performance_count || 0
    const adCount = agg.advertisement_count || 0

    const acceptAllRate = Number(((acceptAllCount / totalDecisions) * 100).toFixed(1))
    const rejectAllRate = Number(((rejectAllCount / totalDecisions) * 100).toFixed(1))
    const customChoiceRate = Number(((customChoiceCount / totalDecisions) * 100).toFixed(1))

    const functionalPct = Number(((functionalCount / totalDecisions) * 100).toFixed(1))
    const analyticsPct = Number(((analyticsCount / totalDecisions) * 100).toFixed(1))
    const performancePct = Number(((performanceCount / totalDecisions) * 100).toFixed(1))
    const adPct = Number(((adCount / totalDecisions) * 100).toFixed(1))

    // 4. Recent receipts
    const recentRes = await pool.query(
      "SELECT * FROM consent_receipts WHERE domain = $1 ORDER BY created_at DESC LIMIT 5",
      [domain]
    )

    return NextResponse.json({
      domain,
      total_decisions: totalDecisions,
      total_receipts: totalDecisions,
      accept_all_count: acceptAllCount,
      accept_all_rate: acceptAllRate,
      reject_all_count: rejectAllCount,
      reject_all_rate: rejectAllRate,
      custom_choice_count: customChoiceCount,
      custom_choice_rate: customChoiceRate,
      analytics_opt_in_pct: analyticsPct,
      necessary_pct: 100.0,
      functional_pct: functionalPct,
      analytics_pct: analyticsPct,
      performance_pct: performancePct,
      advertisement_pct: adPct,
      is_connected: isConnected,
      last_detected_at: lastDetectedAt,
      recent_receipts: recentRes.rows,
    })
  } catch (err: any) {
    console.error("GET /api/v1/consent/stats error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch consent stats" }, { status: 500 })
  }
}
