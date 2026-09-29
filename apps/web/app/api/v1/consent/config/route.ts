import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getWorkspaceEntitlements } from "@/lib/billing/entitlements"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function GET(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    const rawHeaderCountry = (
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cloudfront-viewer-country") ||
      req.headers.get("x-country-code") ||
      ""
    ).trim().toUpperCase().slice(0, 2)

    const isValidCountry = /^[A-Z]{2}$/.test(rawHeaderCountry) && rawHeaderCountry !== "XX" && rawHeaderCountry !== "T1"
    const detectedCountry: string | null = isValidCountry ? rawHeaderCountry : null
    const country = detectedCountry || "US"

    const region = (
      req.headers.get("x-vercel-ip-country-region") ||
      req.headers.get("x-region") ||
      ""
    ).trim().toUpperCase().slice(0, 3)

    const EU_UK_COUNTRIES = new Set([
      "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB", "UK"
    ])

    const res = await pool.query("SELECT * FROM consent_configs WHERE domain = $1", [domain])
    let config = res.rows.length > 0 ? res.rows[0] : null

    if (!config) {
      // Default configuration
      const id = randomUUID()
      const insertRes = await pool.query(
        `INSERT INTO consent_configs (
          id, domain, is_enabled, layout, theme, primary_color, border_radius,
          title, description, privacy_policy_url, accept_all_label, reject_all_label,
          preferences_label, preferences_title, preferences_description, save_preferences_label,
          always_active_label, no_cookies_to_display_label, cookie_column_label,
          duration_column_label, description_column_label,
          enable_necessary_category, enable_functional_category,
          enable_analytics_category, enable_performance_category, enable_advertisement_category,
          show_revisit_button, revisit_button_position, enable_consent_mode_v2, enable_iab_tcf,
          enable_auto_language, default_language, supported_languages, geo_targeting,
          enable_gpc, consent_version, custom_css, law_template,
          created_at, updated_at
        ) VALUES (
          $1, $2, TRUE, 'bottom_bar', 'light', '#1868db', 'rounded-md',
          'We value your privacy',
          'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking ''Accept All'', you consent to our use of cookies.',
          '/privacy', 'Accept All', 'Reject All',
          'Customise', 'Customise Consent Preferences', 'We respect your privacy preferences and allow you to select which cookies and tracking technologies are enabled.', 'Save My Preferences',
          'Always Active', 'No cookies to display', 'Cookie',
          'Duration', 'Description',
          TRUE, TRUE,
          TRUE, TRUE, TRUE,
          TRUE, 'bottom_left', TRUE, TRUE,
          TRUE, 'en', ARRAY['en', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'hi'], 'all',
          TRUE, '1.0', '', 'gdpr',
          NOW(), NOW()
        )
        ON CONFLICT (domain) DO UPDATE SET updated_at = NOW()
        RETURNING *`,
        [id, domain]
      )
      config = insertRes.rows[0]
    }

    let isInGeoZone = true
    const geo = (config.geo_targeting || "all").toLowerCase()
    if (geo === "eu_only" || geo === "eu_uk" || geo === "eu") {
      isInGeoZone = EU_UK_COUNTRIES.has(country)
    } else if (geo === "us_ca") {
      isInGeoZone = country === "US" && (region === "CA" || !region)
    } else if (geo === "in") {
      isInGeoZone = country === "IN"
    } else if (geo === "br") {
      isInGeoZone = country === "BR"
    } else if (geo === "all") {
      isInGeoZone = true
    }

    return NextResponse.json({
      ...config,
      visitor_country: detectedCountry,
      visitor_region: region || null,
      is_in_geo_zone: isInGeoZone,
      is_enabled: config.is_enabled && isInGeoZone,
    }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("GET /api/v1/consent/config error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch consent config" }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const domain = sanitizeDomain(body.domain)

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    // Server-side Entitlement Gating & Auto-coercion
    const siteLookup = await pool.query(`SELECT workspace_id FROM sites WHERE domain = $1 LIMIT 1`, [domain])
    const workspaceId = siteLookup.rows[0]?.workspace_id
    if (workspaceId) {
      const entitlements = await getWorkspaceEntitlements(workspaceId)
      if (!entitlements.capabilities["cmp.tcf_v23"]) {
        body.enable_iab_tcf = false
      }
      if (!entitlements.capabilities["cmp.custom_css"]) {
        body.custom_css = ""
      }
      if (!entitlements.capabilities["cmp.gpc"]) {
        body.enable_gpc = false
      }
      if (!entitlements.capabilities["cmp.geo_targeting"]) {
        body.geo_targeting = "all"
      }
      if (!entitlements.capabilities["cmp.google_consent_mode_v2"]) {
        body.enable_consent_mode_v2 = false
      }
      if (!entitlements.capabilities["cmp.box_layout"] && (typeof body.layout === "string" && (body.layout.startsWith("floating_") || body.layout === "box"))) {
        body.layout = "bottom_bar"
      }
      if (!entitlements.capabilities["cmp.popup_layout"] && (body.layout === "center_modal" || body.layout === "popup")) {
        body.layout = "bottom_bar"
      }
    }

    const id = randomUUID()
    const upsertRes = await pool.query(
      `INSERT INTO consent_configs (
        id, domain, is_enabled, layout, theme, primary_color, border_radius,
        title, description, privacy_policy_url, accept_all_label, reject_all_label,
        preferences_label, preferences_title, preferences_description, save_preferences_label,
        always_active_label, no_cookies_to_display_label, cookie_column_label,
        duration_column_label, description_column_label,
        enable_necessary_category, enable_functional_category,
        enable_analytics_category, enable_performance_category, enable_advertisement_category,
        show_revisit_button, revisit_button_position, enable_consent_mode_v2, enable_iab_tcf,
        enable_auto_language, default_language, supported_languages, geo_targeting,
        enable_gpc, consent_version, custom_css, law_template,
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
        $31, $32, $33, $34,
        $35, $36, $37, $38,
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
        enable_iab_tcf = EXCLUDED.enable_iab_tcf,
        enable_auto_language = EXCLUDED.enable_auto_language,
        default_language = EXCLUDED.default_language,
        supported_languages = EXCLUDED.supported_languages,
        geo_targeting = EXCLUDED.geo_targeting,
        enable_gpc = EXCLUDED.enable_gpc,
        consent_version = EXCLUDED.consent_version,
        custom_css = EXCLUDED.custom_css,
        law_template = EXCLUDED.law_template,
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
        body.preferences_title || "Customise Consent Preferences",
        body.preferences_description || "We respect your privacy preferences...",
        body.save_preferences_label || "Save My Preferences",
        body.always_active_label || "Always Active",
        body.no_cookies_to_display_label || "No cookies to display",
        body.cookie_column_label || "Cookie",
        body.duration_column_label || "Duration",
        body.description_column_label || "Description",
        body.enable_necessary_category !== undefined ? body.enable_necessary_category : true,
        body.enable_functional_category !== undefined ? body.enable_functional_category : true,
        body.enable_analytics_category !== undefined ? body.enable_analytics_category : true,
        body.enable_performance_category !== undefined ? body.enable_performance_category : true,
        body.enable_advertisement_category !== undefined ? body.enable_advertisement_category : true,
        body.show_revisit_button !== undefined ? body.show_revisit_button : true,
        body.revisit_button_position || "bottom_left",
        body.enable_consent_mode_v2 !== undefined ? body.enable_consent_mode_v2 : true,
        body.enable_iab_tcf !== undefined ? body.enable_iab_tcf : true,
        body.enable_auto_language !== undefined ? body.enable_auto_language : true,
        body.default_language || "en",
        body.supported_languages || ["en", "de", "fr", "es", "pt", "it", "nl", "hi"],
        body.geo_targeting || "all",
        body.enable_gpc !== undefined ? body.enable_gpc : true,
        body.consent_version || "1.0",
        body.custom_css || "",
        body.law_template || "gdpr",
      ]
    )

    return NextResponse.json(upsertRes.rows[0] || null, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("POST /api/v1/consent/config error:", err)
    return NextResponse.json({ detail: err.message || "Failed to save consent config" }, { status: 500, headers: CORS_HEADERS })
  }
}
