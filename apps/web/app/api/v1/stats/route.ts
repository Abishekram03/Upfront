import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  IN: "India",
  CA: "Canada",
  DE: "Germany",
  AU: "Australia",
  JP: "Japan",
  BR: "Brazil",
  FR: "France",
  NL: "Netherlands",
  ID: "Indonesia",
  PH: "Philippines",
  RU: "Russian Federation",
  IT: "Italy",
  MX: "Mexico",
  ES: "Spain",
  PL: "Poland",
  SG: "Singapore",
  TR: "Turkey",
  SE: "Sweden",
}

function countryCodeToFlag(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return "🌍"
  const code = countryCode.toUpperCase()
  const offset = 127397
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset)
}

export async function GET(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))
    const period = searchParams.get("period") || "30d"

    if (!domain) {
      return NextResponse.json({ detail: "Domain parameter is required" }, { status: 400 })
    }

    // 1. Site lookup
    const siteRes = await pool.query("SELECT id FROM sites WHERE domain = $1", [domain])
    const siteId = siteRes.rows.length > 0 ? siteRes.rows[0].id : "demo_fallback"

    // 2. Period calculation
    let days = 30
    if (period === "24h") days = 1
    else if (period === "7d") days = 7
    else if (period === "12m") days = 365

    // 3. Realtime active visitors (last 5 min)
    const rtRes = await pool.query(
      `SELECT COUNT(DISTINCT visitor_hash)::int AS count
       FROM sessions
       WHERE site_id = $1 AND last_activity_at >= NOW() - INTERVAL '5 minutes'`,
      [siteId]
    )
    const realtimeVisitors = rtRes.rows[0]?.count || 0

    // 4. Current Period Metrics
    const currRes = await pool.query(
      `SELECT
         COUNT(DISTINCT visitor_hash)::int AS unique_visitors,
         COALESCE(SUM(pageviews_count), 0)::int AS total_pageviews,
         COALESCE(AVG(duration), 0)::int AS avg_duration,
         COALESCE(SUM(CASE WHEN is_bounce THEN 1 ELSE 0 END), 0)::int AS bounces,
         COUNT(id)::int AS total_sessions
       FROM sessions
       WHERE site_id = $1
         AND started_at >= NOW() - ($2 || ' days')::INTERVAL
         AND started_at <= NOW()`,
      [siteId, days]
    )
    const curr = currRes.rows[0] || {}
    const visitors = curr.unique_visitors || 0
    const pageviews = curr.total_pageviews || 0
    const avgDuration = curr.avg_duration || 0
    const totalSessions = curr.total_sessions || 0
    const bounces = curr.bounces || 0
    const bounceRate = totalSessions > 0 ? Number(((bounces / totalSessions) * 100).toFixed(1)) : 0

    // 5. Previous Period Metrics
    const prevRes = await pool.query(
      `SELECT
         COUNT(DISTINCT visitor_hash)::int AS prev_visitors,
         COALESCE(SUM(pageviews_count), 0)::int AS prev_pageviews,
         COALESCE(AVG(duration), 0)::int AS prev_duration,
         COALESCE(SUM(CASE WHEN is_bounce THEN 1 ELSE 0 END), 0)::int AS prev_bounces,
         COUNT(id)::int AS prev_sessions
       FROM sessions
       WHERE site_id = $1
         AND started_at >= NOW() - ($2 || ' days')::INTERVAL
         AND started_at < NOW() - ($3 || ' days')::INTERVAL`,
      [siteId, days * 2, days]
    )
    const prev = prevRes.rows[0] || {}
    const prevVisitors = prev.prev_visitors || 0
    const prevPageviews = prev.prev_pageviews || 0
    const prevAvgDur = prev.prev_duration || 0
    const prevSess = prev.prev_sessions || 0
    const prevBounces = prev.prev_bounces || 0
    const prevBounceRate = prevSess > 0 ? Number(((prevBounces / prevSess) * 100).toFixed(1)) : 0

    const calcPct = (c: number, p: number) => {
      if (p === 0) return 0.0
      return Number((((c - p) / p) * 100).toFixed(1))
    }

    const metrics = {
      visitors,
      previous_visitors: prevVisitors,
      visitors_change_pct: calcPct(visitors, prevVisitors),
      pageviews,
      previous_pageviews: prevPageviews,
      pageviews_change_pct: calcPct(pageviews, prevPageviews),
      bounce_rate: bounceRate,
      previous_bounce_rate: prevBounceRate,
      bounce_rate_change_pct: calcPct(bounceRate, prevBounceRate),
      visit_duration: avgDuration,
      previous_visit_duration: prevAvgDur,
      duration_change_pct: calcPct(avgDuration, prevAvgDur),
    }

    // 6. Time Series (Daily points)
    const step = days <= 30 ? 1 : Math.floor(days / 30)
    const timeSeriesRes = await pool.query(
      `SELECT
         TO_CHAR(d, 'YYYY-MM-DD') AS date,
         TO_CHAR(d, 'Dy, DD Mon') AS label,
         COUNT(DISTINCT s.visitor_hash)::int AS visitors,
         COALESCE(SUM(s.pageviews_count), 0)::int AS pageviews,
         COALESCE(AVG(s.duration), 0)::int AS duration,
         COALESCE(SUM(CASE WHEN s.is_bounce THEN 1 ELSE 0 END), 0)::int AS bounces,
         COUNT(s.id)::int AS tot
       FROM generate_series(
         DATE_TRUNC('day', NOW() - ($2 || ' days')::INTERVAL),
         DATE_TRUNC('day', NOW()),
         ($3 || ' day')::INTERVAL
       ) d
       LEFT JOIN sessions s ON s.site_id = $1 AND DATE_TRUNC('day', s.started_at) = d
       GROUP BY d
       ORDER BY d ASC`,
      [siteId, days, step]
    )

    const timeSeries = timeSeriesRes.rows.map((row: any) => {
      const tot = row.tot || 0
      const b = row.bounces || 0
      const br = tot > 0 ? Number(((b / tot) * 100).toFixed(1)) : 0
      return {
        date: row.date,
        label: row.label,
        visitors: row.visitors || 0,
        pageviews: row.pageviews || 0,
        bounce_rate: br,
        duration: row.duration || 0,
      }
    })

    // 7. Top Sources
    const sourcesRes = await pool.query(
      `SELECT
         COALESCE(referrer_source, 'Direct') AS name,
         COUNT(DISTINCT visitor_hash)::int AS cnt
       FROM sessions
       WHERE site_id = $1 AND started_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY referrer_source
       ORDER BY cnt DESC
       LIMIT 20`,
      [siteId, days]
    )
    const topSources = sourcesRes.rows.map((row: any, idx: number) => ({
      id: `s_${idx}`,
      label: row.name,
      value: row.cnt,
      percentage: Math.round((row.cnt / Math.max(1, visitors)) * 100),
      icon: "🌐",
    }))

    // 8. Top Pages
    const pagesRes = await pool.query(
      `SELECT
         pathname AS path,
         COUNT(id)::int AS cnt
       FROM pageviews
       WHERE site_id = $1 AND timestamp >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY pathname
       ORDER BY cnt DESC
       LIMIT 20`,
      [siteId, days]
    )
    const topPages = pagesRes.rows.map((row: any, idx: number) => ({
      id: `p_${idx}`,
      label: row.path,
      value: row.cnt,
      percentage: Math.round((row.cnt / Math.max(1, pageviews)) * 100),
      link: `https://${domain}${row.path}`,
    }))

    // 9. Locations
    const geoRes = await pool.query(
      `SELECT
         COALESCE(country, 'US') AS code,
         COUNT(DISTINCT visitor_hash)::int AS cnt
       FROM sessions
       WHERE site_id = $1 AND started_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY country
       ORDER BY cnt DESC
       LIMIT 30`,
      [siteId, days]
    )
    const locations = geoRes.rows.map((row: any, idx: number) => ({
      id: `c_${idx}`,
      label: COUNTRY_NAMES[row.code] || row.code,
      value: row.cnt,
      percentage: Math.round((row.cnt / Math.max(1, visitors)) * 100),
      icon: countryCodeToFlag(row.code),
    }))

    // 10. Devices breakdown
    const getBreakdown = async (column: "device" | "browser" | "os") => {
      const res = await pool.query(
        `SELECT
           COALESCE(${column}, 'Unknown') AS name,
           COUNT(DISTINCT visitor_hash)::int AS cnt
         FROM sessions
         WHERE site_id = $1 AND started_at >= NOW() - ($2 || ' days')::INTERVAL
         GROUP BY ${column}
         ORDER BY cnt DESC
         LIMIT 10`,
        [siteId, days]
      )
      return res.rows.map((row: any, idx: number) => ({
        id: `dev_${column}_${idx}`,
        label: row.name,
        value: row.cnt,
        percentage: Math.round((row.cnt / Math.max(1, visitors)) * 100),
      }))
    }

    const [devicesList, browsersList, osList] = await Promise.all([
      getBreakdown("device"),
      getBreakdown("browser"),
      getBreakdown("os"),
    ])

    return NextResponse.json({
      domain,
      period,
      realtime_visitors: realtimeVisitors,
      metrics,
      time_series: timeSeries,
      top_sources: topSources,
      top_pages: topPages,
      locations,
      devices: {
        screen_sizes: devicesList,
        browsers: browsersList,
        os: osList,
      },
    })
  } catch (err: any) {
    console.error("GET /api/v1/stats error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch stats" }, { status: 500 })
  }
}
