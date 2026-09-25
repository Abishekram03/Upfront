import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

function incrementVersion(prevVersion?: string | null): string {
  if (!prevVersion) return "1.1"
  const clean = prevVersion.replace(/^v/i, "").trim()
  const parts = clean.split(".")
  if (parts.length === 2) {
    const major = parseInt(parts[0] || "1", 10) || 1
    const minor = parseInt(parts[1] || "0", 10) || 0
    return `${major}.${minor + 1}`
  }
  return `${clean}.1`
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    const res = await pool.query(
      `SELECT id, domain, version, config, change_summary, published_at, published_by, previous_version
       FROM consent_versions
       WHERE domain = $1
       ORDER BY published_at DESC
       LIMIT 50`,
      [domain]
    )

    return NextResponse.json({
      domain,
      versions: res.rows || [],
    }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("GET /api/v1/consent/versions error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch version history" }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function POST(req: Request) {
  const client = await pool.connect()
  try {
    await ensureTables()
    const body = await req.json()
    const domain = sanitizeDomain(body.domain)
    const targetVersion = body.version

    if (!domain || !targetVersion) {
      return NextResponse.json({ detail: "Domain and target version are required" }, { status: 400, headers: CORS_HEADERS })
    }

    // 1. Fetch the target historical version
    const versionRes = await client.query(
      `SELECT * FROM consent_versions WHERE domain = $1 AND version = $2`,
      [domain, targetVersion]
    )

    if (versionRes.rows.length === 0) {
      return NextResponse.json({ detail: `Historical version ${targetVersion} not found` }, { status: 404, headers: CORS_HEADERS })
    }

    const historicalConfig = versionRes.rows[0].config

    // 2. Fetch current config
    const currentRes = await client.query(`SELECT * FROM consent_configs WHERE domain = $1`, [domain])
    const currentConfig = currentRes.rows[0] || null

    // 3. Increment version (e.g. restoring v1.2 while on v1.4 creates v1.5)
    const newVersion = incrementVersion(currentConfig?.consent_version || "1.0")
    const diffs = [`Restored configuration from historical version ${targetVersion}`]

    await client.query("BEGIN")

    // 4. Save new immutable version
    const newVersionId = randomUUID()
    await client.query(
      `INSERT INTO consent_versions (
        id, domain, version, config, change_summary, published_at, previous_version
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
      [
        newVersionId,
        domain,
        newVersion,
        JSON.stringify(historicalConfig),
        JSON.stringify(diffs),
        currentConfig?.consent_version || "1.0",
      ]
    )

    // 5. Update production active config
    const configId = currentConfig?.id || randomUUID()
    await client.query(
      `INSERT INTO consent_configs (
        id, domain, is_enabled, layout, theme, primary_color, border_radius,
        title, description, privacy_policy_url, accept_all_label, reject_all_label,
        preferences_label, preferences_title, preferences_description, save_preferences_label,
        always_active_label, no_cookies_to_display_label, cookie_column_label,
        duration_column_label, description_column_label,
        enable_necessary_category, enable_functional_category,
        enable_analytics_category, enable_performance_category, enable_advertisement_category,
        show_revisit_button, revisit_button_position, enable_consent_mode_v2, geo_targeting,
        enable_gpc, consent_version,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19,
        $20, $21,
        $22, $23,
        $24, $25, $26,
        $27, $28, $29, $30,
        $31, $32,
        NOW(), NOW()
      )
      ON CONFLICT (domain) DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        layout = EXCLUDED.layout,
        theme = EXCLUDED.theme,
        primary_color = EXCLUDED.primary_color,
        border_radius = EXCLUDED.border_radius,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        privacy_policy_url = EXCLUDED.privacy_policy_url,
        accept_all_label = EXCLUDED.accept_all_label,
        reject_all_label = EXCLUDED.reject_all_label,
        preferences_label = EXCLUDED.preferences_label,
        preferences_title = EXCLUDED.preferences_title,
        preferences_description = EXCLUDED.preferences_description,
        save_preferences_label = EXCLUDED.save_preferences_label,
        always_active_label = EXCLUDED.always_active_label,
        no_cookies_to_display_label = EXCLUDED.no_cookies_to_display_label,
        cookie_column_label = EXCLUDED.cookie_column_label,
        duration_column_label = EXCLUDED.duration_column_label,
        description_column_label = EXCLUDED.description_column_label,
        enable_necessary_category = EXCLUDED.enable_necessary_category,
        enable_functional_category = EXCLUDED.enable_functional_category,
        enable_analytics_category = EXCLUDED.enable_analytics_category,
        enable_performance_category = EXCLUDED.enable_performance_category,
        enable_advertisement_category = EXCLUDED.enable_advertisement_category,
        show_revisit_button = EXCLUDED.show_revisit_button,
        revisit_button_position = EXCLUDED.revisit_button_position,
        enable_consent_mode_v2 = EXCLUDED.enable_consent_mode_v2,
        geo_targeting = EXCLUDED.geo_targeting,
        enable_gpc = EXCLUDED.enable_gpc,
        consent_version = EXCLUDED.consent_version,
        updated_at = NOW()
      RETURNING *`,
      [
        configId,
        domain,
        historicalConfig.is_enabled !== undefined ? historicalConfig.is_enabled : true,
        historicalConfig.layout || "bottom_bar",
        historicalConfig.theme || "light",
        historicalConfig.primary_color || "#1868db",
        historicalConfig.border_radius || "rounded-md",
        historicalConfig.title || "We value your privacy",
        historicalConfig.description || "We use cookies...",
        historicalConfig.privacy_policy_url || "/privacy",
        historicalConfig.accept_all_label || "Accept All",
        historicalConfig.reject_all_label || "Reject All",
        historicalConfig.preferences_label || "Customise",
        historicalConfig.preferences_title || "Customise Consent Preferences",
        historicalConfig.preferences_description || "We respect your privacy...",
        historicalConfig.save_preferences_label || "Save My Preferences",
        historicalConfig.always_active_label || "Always Active",
        historicalConfig.no_cookies_to_display_label || "No cookies to display",
        historicalConfig.cookie_column_label || "Cookie",
        historicalConfig.duration_column_label || "Duration",
        historicalConfig.description_column_label || "Description",
        historicalConfig.enable_necessary_category !== undefined ? historicalConfig.enable_necessary_category : true,
        historicalConfig.enable_functional_category !== undefined ? historicalConfig.enable_functional_category : true,
        historicalConfig.enable_analytics_category !== undefined ? historicalConfig.enable_analytics_category : true,
        historicalConfig.enable_performance_category !== undefined ? historicalConfig.enable_performance_category : true,
        historicalConfig.enable_advertisement_category !== undefined ? historicalConfig.enable_advertisement_category : true,
        historicalConfig.show_revisit_button !== undefined ? historicalConfig.show_revisit_button : true,
        historicalConfig.revisit_button_position || "bottom_left",
        historicalConfig.enable_consent_mode_v2 !== undefined ? historicalConfig.enable_consent_mode_v2 : true,
        historicalConfig.geo_targeting || "all",
        historicalConfig.enable_gpc !== undefined ? historicalConfig.enable_gpc : true,
        newVersion,
      ]
    )

    // 6. Clear working draft
    await client.query(`DELETE FROM consent_drafts WHERE domain = $1`, [domain])

    await client.query("COMMIT")

    return NextResponse.json({
      ok: true,
      restored_from: targetVersion,
      new_version: newVersion,
      message: `Successfully rolled back to configuration from ${targetVersion} as new version ${newVersion}`,
    }, { headers: CORS_HEADERS })
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {})
    console.error("POST /api/v1/consent/versions restore error:", err)
    return NextResponse.json({ detail: err.message || "Failed to restore version" }, { status: 500, headers: CORS_HEADERS })
  } finally {
    client.release()
  }
}
