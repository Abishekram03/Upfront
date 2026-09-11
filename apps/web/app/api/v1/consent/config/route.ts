import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { randomUUID } from "node:crypto"

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

    const res = await pool.query("SELECT * FROM consent_configs WHERE domain = $1", [domain])
    if (res.rows.length > 0) {
      return NextResponse.json(res.rows[0])
    }

    // Default configuration
    const id = randomUUID()
    const insertRes = await pool.query(
      `INSERT INTO consent_configs (
        id, domain, is_enabled, layout, theme, primary_color, border_radius,
        title, description, privacy_policy_url, accept_all_label, reject_all_label,
        preferences_label, enable_necessary_category, enable_functional_category,
        enable_analytics_category, enable_performance_category, enable_advertisement_category,
        show_revisit_button, revisit_button_position, enable_consent_mode_v2, geo_targeting,
        created_at, updated_at
      ) VALUES (
        $1, $2, TRUE, 'bottom_bar', 'light', '#1868db', 'rounded-md',
        'We value your privacy',
        'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking ''Accept All'', you consent to our use of cookies.',
        '/privacy', 'Accept All', 'Reject All', 'Customise',
        TRUE, TRUE, TRUE, TRUE, TRUE,
        TRUE, 'bottom_left', TRUE, 'all',
        NOW(), NOW()
      )
      ON CONFLICT (domain) DO UPDATE SET updated_at = NOW()
      RETURNING *`,
      [id, domain]
    )

    return NextResponse.json(insertRes.rows[0])
  } catch (err: any) {
    console.error("GET /api/v1/consent/config error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch consent config" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const domain = sanitizeDomain(body.domain)

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400 })
    }

    const id = randomUUID()
    const upsertRes = await pool.query(
      `INSERT INTO consent_configs (
        id, domain, is_enabled, layout, theme, primary_color, border_radius,
        title, description, privacy_policy_url, accept_all_label, reject_all_label,
        preferences_label, enable_necessary_category, enable_functional_category,
        enable_analytics_category, enable_performance_category, enable_advertisement_category,
        show_revisit_button, revisit_button_position, enable_consent_mode_v2, geo_targeting,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18,
        $19, $20, $21, $22,
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
        enable_necessary_category = EXCLUDED.enable_necessary_category,
        enable_functional_category = EXCLUDED.enable_functional_category,
        enable_analytics_category = EXCLUDED.enable_analytics_category,
        enable_performance_category = EXCLUDED.enable_performance_category,
        enable_advertisement_category = EXCLUDED.enable_advertisement_category,
        show_revisit_button = EXCLUDED.show_revisit_button,
        revisit_button_position = EXCLUDED.revisit_button_position,
        enable_consent_mode_v2 = EXCLUDED.enable_consent_mode_v2,
        geo_targeting = EXCLUDED.geo_targeting,
        updated_at = NOW()
      RETURNING *`,
      [
        id,
        domain,
        body.is_enabled !== undefined ? body.is_enabled : true,
        body.layout || "bottom_bar",
        body.theme || "light",
        body.primary_color || "#1868db",
        body.border_radius || "rounded-md",
        body.title || "We value your privacy",
        body.description || "We use cookies to enhance your browsing experience...",
        body.privacy_policy_url || "/privacy",
        body.accept_all_label || "Accept All",
        body.reject_all_label || "Reject All",
        body.preferences_label || "Customise",
        body.enable_necessary_category !== undefined ? body.enable_necessary_category : true,
        body.enable_functional_category !== undefined ? body.enable_functional_category : true,
        body.enable_analytics_category !== undefined ? body.enable_analytics_category : true,
        body.enable_performance_category !== undefined ? body.enable_performance_category : true,
        body.enable_advertisement_category !== undefined ? body.enable_advertisement_category : true,
        body.show_revisit_button !== undefined ? body.show_revisit_button : true,
        body.revisit_button_position || "bottom_left",
        body.enable_consent_mode_v2 !== undefined ? body.enable_consent_mode_v2 : true,
        body.geo_targeting || "all",
      ]
    )

    return NextResponse.json(upsertRes.rows[0])
  } catch (err: any) {
    console.error("POST /api/v1/consent/config error:", err)
    return NextResponse.json({ detail: err.message || "Failed to save consent config" }, { status: 500 })
  }
}
