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

const COUNTRY_CODES: Record<string, string> = Object.entries(COUNTRY_NAMES).reduce(
  (acc, [k, v]) => ({ ...acc, [v.toLowerCase()]: k }),
  {}
)

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

    const filterSource = searchParams.get("source")
    const filterPage = searchParams.get("page")
    const filterCountry = searchParams.get("country")
    const filterBrowser = searchParams.get("browser")
    const filterDevice = searchParams.get("device")
    const filterOs = searchParams.get("os")

    const countryCode = filterCountry
      ? COUNTRY_CODES[filterCountry.toLowerCase()] || filterCountry.toUpperCase()
      : null

    if (!domain) {
      return NextResponse.json({ detail: "Domain parameter is required" }, { status: 400 })
    }

    // 1. Site lookup
    const siteRes = await pool.query("SELECT id FROM sites WHERE domain = $1", [domain])
    const siteId = siteRes.rows.length > 0 && siteRes.rows[0] ? siteRes.rows[0].id : "demo_fallback"

    // 2. Period calculation
    let days = 30
    if (period === "24h") days = 1
    else if (period === "7d") days = 7
    else if (period === "12m") days = 365

    // Helper to build dynamic session SQL conditions
    const buildSessionConditions = (paramStartIndex: number) => {
      const conditions: string[] = []
      const params: any[] = []
      let idx = paramStartIndex

      if (filterSource) {
        conditions.push(`s.referrer_source = $${idx++}`)
        params.push(filterSource)
      }
      if (countryCode) {
        conditions.push(`s.country = $${idx++}`)
        params.push(countryCode)
      }
      if (filterBrowser) {
        conditions.push(`s.browser = $${idx++}`)
        params.push(filterBrowser)
      }
      if (filterDevice) {
        conditions.push(`s.device = $${idx++}`)
        params.push(filterDevice)
      }
      if (filterOs) {
        conditions.push(`s.os = $${idx++}`)
        params.push(filterOs)
      }
      if (filterPage) {
        conditions.push(`s.id IN (SELECT session_id FROM pageviews WHERE site_id = s.site_id AND pathname = $${idx++})`)
        params.push(filterPage)
      }

      return {
        sql: conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "",
        params,
      }
    }

    // 3. Realtime active visitors (last 5 min)
    const rtExtra = buildSessionConditions(2)
    const rtRes = await pool.query(
      `SELECT COUNT(DISTINCT s.visitor_hash)::int AS count
       FROM sessions s
       WHERE s.site_id = $1 AND s.last_activity_at >= NOW() - INTERVAL '5 minutes'
       ${rtExtra.sql}`,
      [siteId, ...rtExtra.params]
    )
    const realtimeVisitors = rtRes.rows[0]?.count || 0

    // 4. Current Period Metrics
    const currExtra = buildSessionConditions(3)
    const currRes = await pool.query(
      `SELECT
         COUNT(DISTINCT s.visitor_hash)::int AS unique_visitors,
         COALESCE(SUM(s.pageviews_count), 0)::int AS total_pageviews,
         COALESCE(AVG(s.duration), 0)::int AS avg_duration,
         COALESCE(SUM(CASE WHEN s.is_bounce THEN 1 ELSE 0 END), 0)::int AS bounces,
         COUNT(s.id)::int AS total_sessions
       FROM sessions s
       WHERE s.site_id = $1
         AND s.started_at >= NOW() - ($2 || ' days')::INTERVAL
         AND s.started_at <= NOW()
         ${currExtra.sql}`,
      [siteId, days, ...currExtra.params]
    )
    const curr = currRes.rows[0] || {}
    const visitors = curr.unique_visitors || 0
    const pageviews = curr.total_pageviews || 0
    const avgDuration = curr.avg_duration || 0
    const totalSessions = curr.total_sessions || 0
    const bounces = curr.bounces || 0
    const bounceRate = totalSessions > 0 ? Number(((bounces / totalSessions) * 100).toFixed(1)) : 0

    // 5. Previous Period Metrics
    const prevExtra = buildSessionConditions(4)
    const prevRes = await pool.query(
      `SELECT
         COUNT(DISTINCT s.visitor_hash)::int AS prev_visitors,
         COALESCE(SUM(s.pageviews_count), 0)::int AS prev_pageviews,
         COALESCE(AVG(s.duration), 0)::int AS prev_duration,
         COALESCE(SUM(CASE WHEN s.is_bounce THEN 1 ELSE 0 END), 0)::int AS prev_bounces,
         COUNT(s.id)::int AS prev_sessions
       FROM sessions s
       WHERE s.site_id = $1
         AND s.started_at >= NOW() - ($2 || ' days')::INTERVAL
         AND s.started_at < NOW() - ($3 || ' days')::INTERVAL
         ${prevExtra.sql}`,
      [siteId, days * 2, days, ...prevExtra.params]
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
    const tsExtra = buildSessionConditions(4)
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
       LEFT JOIN sessions s ON s.site_id = $1 AND DATE_TRUNC('day', s.started_at) = d ${tsExtra.sql}
       GROUP BY d
       ORDER BY d ASC`,
      [siteId, days, step, ...tsExtra.params]
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
    const sourcesExtra = buildSessionConditions(3)
    const sourcesRes = await pool.query(
      `SELECT
         COALESCE(s.referrer_source, 'Direct') AS name,
         COUNT(DISTINCT s.visitor_hash)::int AS cnt
       FROM sessions s
       WHERE s.site_id = $1 AND s.started_at >= NOW() - ($2 || ' days')::INTERVAL
       ${sourcesExtra.sql}
       GROUP BY s.referrer_source
       ORDER BY cnt DESC
       LIMIT 20`,
      [siteId, days, ...sourcesExtra.params]
    )
    const topSources = sourcesRes.rows.map((row: any, idx: number) => ({
      id: `s_${idx}`,
      label: row.name,
      value: row.cnt,
      percentage: Math.round((row.cnt / Math.max(1, visitors)) * 100),
      icon: "🌐",
    }))

    // 8. Top Pages
    const pageFilterSql = filterPage ? `AND p.pathname = $3` : ""
    const pageFilterParams = filterPage ? [filterPage] : []
    const pagesExtra = buildSessionConditions(filterPage ? 4 : 3)

    const pagesRes = await pool.query(
      `SELECT
         p.pathname AS path,
         COUNT(p.id)::int AS cnt
       FROM pageviews p
       JOIN sessions s ON s.id = p.session_id
       WHERE p.site_id = $1 
         AND p.timestamp >= NOW() - ($2 || ' days')::INTERVAL
         ${pageFilterSql}
         ${pagesExtra.sql}
       GROUP BY p.pathname
       ORDER BY cnt DESC
       LIMIT 20`,
      [siteId, days, ...pageFilterParams, ...pagesExtra.params]
    )
    const topPages = pagesRes.rows.map((row: any, idx: number) => ({
      id: `p_${idx}`,
      label: row.path,
      value: row.cnt,
      percentage: Math.round((row.cnt / Math.max(1, pageviews)) * 100),
      link: `https://${domain}${row.path}`,
    }))

    // 9. Locations
    const geoExtra = buildSessionConditions(3)
    const geoRes = await pool.query(
      `SELECT
         COALESCE(s.country, 'US') AS code,
         COUNT(DISTINCT s.visitor_hash)::int AS cnt
       FROM sessions s
       WHERE s.site_id = $1 AND s.started_at >= NOW() - ($2 || ' days')::INTERVAL
       ${geoExtra.sql}
       GROUP BY s.country
       ORDER BY cnt DESC
       LIMIT 30`,
      [siteId, days, ...geoExtra.params]
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
      const devExtra = buildSessionConditions(3)
      const res = await pool.query(
        `SELECT
           COALESCE(s.${column}, 'Unknown') AS name,
           COUNT(DISTINCT s.visitor_hash)::int AS cnt
         FROM sessions s
         WHERE s.site_id = $1 AND s.started_at >= NOW() - ($2 || ' days')::INTERVAL
         ${devExtra.sql}
         GROUP BY s.${column}
         ORDER BY cnt DESC
         LIMIT 10`,
        [siteId, days, ...devExtra.params]
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

