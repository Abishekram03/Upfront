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

    if (config) {
      if (!config.preferences_description || String(config.preferences_description).startsWith("We respect your privacy preferences")) {
        config.preferences_description = "We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below."
        config.preference_description = config.preferences_description
        config.preference_message = config.preferences_description
      }
    }

    if (!config) {
      // Default configuration
      const id = randomUUID()
      const insertRes = await pool.query(
        `INSERT INTO consent_configs (
          id, domain, is_enabled, layout, theme, primary_color, border_radius,
          title, description, privacy_policy_url, show_close_button, accept_all_label, reject_all_label,
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
          '/privacy', FALSE, 'Accept All', 'Reject All',
          'Customise', 'Customise Consent Preferences', 'We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below.', 'Save My Preferences',
          'Always Active', 'No cookies to display', 'Cookie',
          'Duration', 'Description',
          TRUE, TRUE,
          TRUE, TRUE, TRUE,
          TRUE, 'bottom_left', TRUE, TRUE,
          TRUE, 'en', ARRAY['en', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'hi', 'ja'], 'all',
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
    } else if (geo === "custom") {
      const list = Array.isArray(config.target_countries) ? config.target_countries : []
      isInGeoZone = list.length === 0 || list.includes(country)
    } else if (geo === "all") {
      isInGeoZone = true
    }

    const cookiesRes = await pool.query(
      `SELECT name, category, service_name, duration, description, script_pattern_regex FROM discovered_cookies WHERE domain = $1 ORDER BY category ASC, name ASC`,
      [domain]
    ).catch(() => ({ rows: [] }))
    const siteCookies = cookiesRes.rows || []

    return NextResponse.json({
      ...config,
      cookies: siteCookies,
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
      if (!entitlements.capabilities["cmp.multilingual"]) {
        body.enable_auto_language = false
        const fallbackLang = typeof body.default_language === "string" && body.default_language.trim().length > 0 ? body.default_language : "en"
        body.supported_languages = [fallbackLang]
      }
      if (!entitlements.capabilities["cmp.whitelabel"]) {
        body.show_branding = true
        body.hide_branding = false
      }
      if (!entitlements.capabilities["cmp.box_layout"] && (typeof body.layout === "string" && (body.layout.startsWith("floating_") || body.layout === "box"))) {
        body.layout = "bottom_bar"
      }
      if (!entitlements.capabilities["cmp.popup_layout"] && (body.layout === "center_modal" || body.layout === "popup")) {
        body.layout = "bottom_bar"
      }
    }

    // Fetch current config to safely preserve non-specified fields
    const currentConfigRes = await pool.query(`SELECT * FROM consent_configs WHERE domain = $1`, [domain])
    const currentConfig = currentConfigRes.rows[0] || null

    const id = currentConfig?.id || randomUUID()
    const categoryConfigsJson = body.category_configs
      ? JSON.stringify(body.category_configs)
      : (currentConfig?.category_configs ? JSON.stringify(currentConfig.category_configs) : null)

    const layout = body.layout || currentConfig?.layout || "bottom_bar"
    const theme = body.theme || currentConfig?.theme || "light"
    const primaryColor = body.primary_color || currentConfig?.primary_color || "#1868db"
    const borderRadius = body.border_radius || currentConfig?.border_radius || "rounded-md"
    const title = body.title || currentConfig?.title || "We value your privacy"
    const description = body.description || currentConfig?.description || "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies."
    const privacyPolicyUrl = body.privacy_policy_url !== undefined ? body.privacy_policy_url : (currentConfig?.privacy_policy_url || "/privacy")
    const showCloseButton = body.show_close_button !== undefined ? body.show_close_button : (currentConfig?.show_close_button ?? false)
    const acceptAllLabel = body.accept_all_label || currentConfig?.accept_all_label || "Accept All"
    const rejectAllLabel = body.reject_all_label || currentConfig?.reject_all_label || "Reject All"
    const preferencesLabel = body.preferences_label || currentConfig?.preferences_label || "Customise"
    const preferencesTitle = body.preferences_title || body.preference_title || currentConfig?.preferences_title || "Customise Consent Preferences"
    const preferencesDescription = body.preferences_description || body.preference_description || body.preference_message || currentConfig?.preferences_description || "We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below."
    const savePreferencesLabel = body.save_preferences_label || currentConfig?.save_preferences_label || "Save My Preferences"
    const alwaysActiveLabel = body.always_active_label || currentConfig?.always_active_label || "Always Active"
    const noCookiesToDisplayLabel = body.no_cookies_to_display_label || currentConfig?.no_cookies_to_display_label || "No cookies to display"
    const cookieColumnLabel = body.cookie_column_label || currentConfig?.cookie_column_label || "Cookie"
    const durationColumnLabel = body.duration_column_label || currentConfig?.duration_column_label || "Duration"
    const descriptionColumnLabel = body.description_column_label || currentConfig?.description_column_label || "Description"
    const isEnabled = body.is_enabled !== undefined ? body.is_enabled : (currentConfig?.is_enabled ?? true)
    const enableNecessary = body.enable_necessary_category !== undefined ? body.enable_necessary_category : (currentConfig?.enable_necessary_category ?? true)
    const enableFunctional = body.enable_functional_category !== undefined ? body.enable_functional_category : (currentConfig?.enable_functional_category ?? true)
    const enableAnalytics = body.enable_analytics_category !== undefined ? body.enable_analytics_category : (currentConfig?.enable_analytics_category ?? true)
    const enablePerformance = body.enable_performance_category !== undefined ? body.enable_performance_category : (currentConfig?.enable_performance_category ?? true)
    const enableAdvertisement = body.enable_advertisement_category !== undefined ? body.enable_advertisement_category : (currentConfig?.enable_advertisement_category ?? true)
    const showRevisitButton = body.show_revisit_button !== undefined ? body.show_revisit_button : (currentConfig?.show_revisit_button ?? true)
    const revisitButtonPosition = body.revisit_button_position || currentConfig?.revisit_button_position || "bottom_left"
    const enableConsentModeV2 = body.enable_consent_mode_v2 !== undefined ? body.enable_consent_mode_v2 : (currentConfig?.enable_consent_mode_v2 ?? true)
    const enableIabTcf = body.enable_iab_tcf !== undefined ? body.enable_iab_tcf : (currentConfig?.enable_iab_tcf ?? true)
    const enableAutoLanguage = body.enable_auto_language !== undefined ? body.enable_auto_language : (currentConfig?.enable_auto_language ?? true)
    const defaultLanguage = body.default_language || currentConfig?.default_language || "en"
    const supportedLanguages = body.supported_languages || currentConfig?.supported_languages || ["en", "de", "fr", "es", "pt", "it", "nl", "hi", "ja"]
    const geoTargeting = body.geo_targeting || currentConfig?.geo_targeting || "all"
    const targetCountries = body.target_countries !== undefined ? (Array.isArray(body.target_countries) ? body.target_countries : []) : (currentConfig?.target_countries || [])
    const enableGpc = body.enable_gpc !== undefined ? body.enable_gpc : (currentConfig?.enable_gpc ?? true)
    const consentVersion = body.consent_version || currentConfig?.consent_version || "1.0"
    const customCss = body.custom_css !== undefined ? body.custom_css : (currentConfig?.custom_css || "")
    const lawTemplate = body.law_template || currentConfig?.law_template || "gdpr"
    const showCookieList = body.show_cookie_list_on_banner !== undefined ? body.show_cookie_list_on_banner : (currentConfig?.show_cookie_list_on_banner ?? true)
    const showGooglePolicy = body.show_google_privacy_policy !== undefined ? body.show_google_privacy_policy : (currentConfig?.show_google_privacy_policy ?? false)

    const necessaryTitle = body.necessary_title || body.category_configs?.necessary?.name || currentConfig?.necessary_title || null
    const necessaryDesc = body.necessary_description || body.category_configs?.necessary?.description || currentConfig?.necessary_description || null
    const functionalTitle = body.functional_title || body.category_configs?.functional?.name || currentConfig?.functional_title || null
    const functionalDesc = body.functional_description || body.category_configs?.functional?.description || currentConfig?.functional_description || null
    const analyticsTitle = body.analytics_title || body.category_configs?.analytics?.name || currentConfig?.analytics_title || null
    const analyticsDesc = body.analytics_description || body.category_configs?.analytics?.description || currentConfig?.analytics_description || null
    const perfTitle = body.performance_title || body.category_configs?.performance?.name || currentConfig?.performance_title || null
    const perfDesc = body.performance_description || body.category_configs?.performance?.description || currentConfig?.performance_description || null
    const adTitle = body.advertisement_title || body.category_configs?.advertisement?.name || currentConfig?.advertisement_title || null
    const adDesc = body.advertisement_description || body.category_configs?.advertisement?.description || currentConfig?.advertisement_description || null

    const upsertRes = await pool.query(
      `INSERT INTO consent_configs (
        id, domain, is_enabled, layout, theme, primary_color, border_radius,
        title, description, privacy_policy_url, show_close_button, accept_all_label, reject_all_label,
        preferences_label, preferences_title, preferences_description, save_preferences_label,
        always_active_label, no_cookies_to_display_label, cookie_column_label,
        duration_column_label, description_column_label,
        enable_necessary_category, enable_functional_category,
        enable_analytics_category, enable_performance_category, enable_advertisement_category,
        show_revisit_button, revisit_button_position, enable_consent_mode_v2, enable_iab_tcf,
        enable_auto_language, default_language, supported_languages, geo_targeting,
        target_countries, enable_gpc, consent_version, custom_css, law_template,
        show_cookie_list_on_banner, show_google_privacy_policy, category_configs,
        necessary_title, necessary_description, functional_title, functional_description,
        analytics_title, analytics_description, performance_title, performance_description,
        advertisement_title, advertisement_description,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20,
        $21, $22,
        $23, $24,
        $25, $26, $27,
        $28, $29, $30, $31,
        $32, $33, $34, $35,
        $36, $37, $38, $39, $40,
        $41, $42, $43::jsonb,
        $44, $45, $46, $47,
        $48, $49, $50, $51,
        $52, $53,
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
        show_close_button = EXCLUDED.show_close_button,
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
        target_countries = EXCLUDED.target_countries,
        enable_gpc = EXCLUDED.enable_gpc,
        consent_version = EXCLUDED.consent_version,
        custom_css = EXCLUDED.custom_css,
        law_template = EXCLUDED.law_template,
        show_cookie_list_on_banner = COALESCE(EXCLUDED.show_cookie_list_on_banner, consent_configs.show_cookie_list_on_banner),
        show_google_privacy_policy = COALESCE(EXCLUDED.show_google_privacy_policy, consent_configs.show_google_privacy_policy),
        category_configs = COALESCE(EXCLUDED.category_configs, consent_configs.category_configs),
        necessary_title = COALESCE(EXCLUDED.necessary_title, consent_configs.necessary_title),
        necessary_description = COALESCE(EXCLUDED.necessary_description, consent_configs.necessary_description),
        functional_title = COALESCE(EXCLUDED.functional_title, consent_configs.functional_title),
        functional_description = COALESCE(EXCLUDED.functional_description, consent_configs.functional_description),
        analytics_title = COALESCE(EXCLUDED.analytics_title, consent_configs.analytics_title),
        analytics_description = COALESCE(EXCLUDED.analytics_description, consent_configs.analytics_description),
        performance_title = COALESCE(EXCLUDED.performance_title, consent_configs.performance_title),
        performance_description = COALESCE(EXCLUDED.performance_description, consent_configs.performance_description),
        advertisement_title = COALESCE(EXCLUDED.advertisement_title, consent_configs.advertisement_title),
        advertisement_description = COALESCE(EXCLUDED.advertisement_description, consent_configs.advertisement_description),
        updated_at = NOW()
      RETURNING *`,
      [
        id,
        domain,
        isEnabled,
        layout,
        theme,
        primaryColor,
        borderRadius,
        title,
        description,
        privacyPolicyUrl,
        showCloseButton,
        acceptAllLabel,
        rejectAllLabel,
        preferencesLabel,
        preferencesTitle,
        preferencesDescription,
        savePreferencesLabel,
        alwaysActiveLabel,
        noCookiesToDisplayLabel,
        cookieColumnLabel,
        durationColumnLabel,
        descriptionColumnLabel,
        enableNecessary,
        enableFunctional,
        enableAnalytics,
        enablePerformance,
        enableAdvertisement,
        showRevisitButton,
        revisitButtonPosition,
        enableConsentModeV2,
        enableIabTcf,
        enableAutoLanguage,
        defaultLanguage,
        supportedLanguages,
        geoTargeting,
        targetCountries,
        enableGpc,
        consentVersion,
        customCss,
        lawTemplate,
        showCookieList,
        showGooglePolicy,
        categoryConfigsJson,
        necessaryTitle,
        necessaryDesc,
        functionalTitle,
        functionalDesc,
        analyticsTitle,
        analyticsDesc,
        perfTitle,
        perfDesc,
        adTitle,
        adDesc,
      ]
    )

    return NextResponse.json(upsertRes.rows[0] || null, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("POST /api/v1/consent/config error:", err)
    return NextResponse.json({ detail: err.message || "Failed to save consent config" }, { status: 500, headers: CORS_HEADERS })
  }
}
