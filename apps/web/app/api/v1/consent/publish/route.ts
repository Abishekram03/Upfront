import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

// Function to increment version string (e.g. "1.0" -> "1.1", "1.9" -> "1.10", "v1.2" -> "v1.3")
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

// Validation function
function validateConsentConfiguration(config: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Content validation
  if (!config.title || typeof config.title !== "string" || config.title.trim().length === 0) {
    errors.push("Banner title is required.")
  } else if (config.title.length > 300) {
    errors.push("Banner title is too long (max 300 characters).")
  }

  if (!config.description || typeof config.description !== "string" || config.description.trim().length === 0) {
    errors.push("Banner description is required.")
  }

  if (!config.accept_all_label || config.accept_all_label.trim().length === 0) {
    errors.push("Accept All button label cannot be empty.")
  }

  if (!config.reject_all_label || config.reject_all_label.trim().length === 0) {
    errors.push("Reject All button label cannot be empty.")
  }

  if (!config.preferences_label || config.preferences_label.trim().length === 0) {
    errors.push("Preferences button label cannot be empty.")
  }

  // Privacy policy URL
  if (config.privacy_policy_url) {
    const url = config.privacy_policy_url.trim()
    if (!url.startsWith("/") && !url.startsWith("http://") && !url.startsWith("https://")) {
      errors.push("Privacy policy URL must be a valid relative path (/privacy) or absolute URL (https://...).")
    }
  }

  // Colors & Theme validation
  if (config.primary_color) {
    const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/
    if (!hexRegex.test(config.primary_color) && !config.primary_color.startsWith("rgb") && !config.primary_color.startsWith("hsl")) {
      errors.push("Primary brand color must be a valid HEX (e.g. #1868db) or CSS color.")
    }
  }

  // Custom CSS Security Sanitization
  if (config.custom_css && typeof config.custom_css === "string") {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /expression\s*\(/gi,
      /behavior\s*:/gi,
      /-moz-binding\s*:/gi,
      /@import\s+(?:url\(['"]?)?https?:\/\//gi,
    ]
    for (const pattern of dangerousPatterns) {
      if (pattern.test(config.custom_css)) {
        errors.push("Custom CSS contains unsafe expressions or prohibited external scripts.")
        break
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings }
}

// Compute structured diff
function computeConfigurationDiff(oldConfig: any, newConfig: any): string[] {
  const diffs: string[] = []
  if (!oldConfig) {
    return ["Initial consent configuration published."]
  }

  if (oldConfig.title !== newConfig.title) diffs.push("Updated banner title")
  if (oldConfig.description !== newConfig.description) diffs.push("Updated banner description")
  if (oldConfig.show_close_button !== newConfig.show_close_button) diffs.push(`Close [X] button set to ${newConfig.show_close_button ? "Visible" : "Hidden"}`)
  if (oldConfig.primary_color !== newConfig.primary_color) diffs.push(`Changed primary color to ${newConfig.primary_color}`)
  if (oldConfig.layout !== newConfig.layout) diffs.push(`Changed layout to ${newConfig.layout}`)
  if (oldConfig.theme !== newConfig.theme) diffs.push(`Changed theme to ${newConfig.theme}`)
  if (oldConfig.border_radius !== newConfig.border_radius) diffs.push(`Updated border radius to ${newConfig.border_radius}`)
  if (oldConfig.accept_all_label !== newConfig.accept_all_label) diffs.push("Updated Accept button label")
  if (oldConfig.reject_all_label !== newConfig.reject_all_label) diffs.push("Updated Reject button label")
  if (oldConfig.preferences_label !== newConfig.preferences_label) diffs.push("Updated Customise button label")
  if (oldConfig.enable_gpc !== newConfig.enable_gpc) diffs.push(`Global Privacy Control (GPC) set to ${newConfig.enable_gpc ? "Enabled" : "Disabled"}`)
  if (oldConfig.enable_consent_mode_v2 !== newConfig.enable_consent_mode_v2) diffs.push(`Google Consent Mode v2 set to ${newConfig.enable_consent_mode_v2 ? "Enabled" : "Disabled"}`)
  if (oldConfig.geo_targeting !== newConfig.geo_targeting) diffs.push(`Geo-targeting policy set to ${newConfig.geo_targeting}`)
  if (oldConfig.custom_css !== newConfig.custom_css) diffs.push("Updated custom Shadow-DOM CSS rules")
  if (oldConfig.enable_auto_language !== newConfig.enable_auto_language) diffs.push(`Automatic language detection set to ${newConfig.enable_auto_language ? "Enabled" : "Disabled"}`)
  if (oldConfig.default_language !== newConfig.default_language) diffs.push(`Default language changed to ${newConfig.default_language}`)
  if (oldConfig.is_enabled !== newConfig.is_enabled) diffs.push(`Banner state set to ${newConfig.is_enabled ? "Active" : "Disabled"}`)

  if (diffs.length === 0) {
    diffs.push("Configuration refreshed & published.")
  }

  return diffs
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  const client = await pool.connect()
  try {
    await ensureTables()
    const body = await req.json()
    const domain = sanitizeDomain(body.domain)

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    const draftConfig = body.config || body
    const baseVersion = body.base_version

    // Server-side Entitlement Gating & Auto-coercion
    const siteLookup = await client.query(`SELECT workspace_id FROM sites WHERE domain = $1 LIMIT 1`, [domain])
    const workspaceId = siteLookup.rows[0]?.workspace_id
    if (workspaceId) {
      const { getWorkspaceEntitlements } = await import("@/lib/billing/entitlements")
      const entitlements = await getWorkspaceEntitlements(workspaceId)
      if (!entitlements.capabilities["cmp.tcf_v23"]) {
        draftConfig.enable_iab_tcf = false
      }
      if (!entitlements.capabilities["cmp.custom_css"]) {
        draftConfig.custom_css = ""
      }
      if (!entitlements.capabilities["cmp.gpc"]) {
        draftConfig.enable_gpc = false
      }
      if (!entitlements.capabilities["cmp.geo_targeting"]) {
        draftConfig.geo_targeting = "all"
      }
      if (!entitlements.capabilities["cmp.google_consent_mode_v2"]) {
        draftConfig.enable_consent_mode_v2 = false
      }
      if (!entitlements.capabilities["cmp.box_layout"] && (typeof draftConfig.layout === "string" && (draftConfig.layout.startsWith("floating_") || draftConfig.layout === "box"))) {
        draftConfig.layout = "bottom_bar"
      }
      if (!entitlements.capabilities["cmp.popup_layout"] && (draftConfig.layout === "center_modal" || draftConfig.layout === "popup")) {
        draftConfig.layout = "bottom_bar"
      }
    }

    // 1. Validation
    const validation = validateConsentConfiguration(draftConfig)
    if (!validation.isValid) {
      return NextResponse.json({
        detail: "Validation failed before publishing.",
        errors: validation.errors,
      }, { status: 422, headers: CORS_HEADERS })
    }

    // 2. Fetch current published config for atomic comparison & version increment
    const currentRes = await client.query(
      `SELECT * FROM consent_configs WHERE domain = $1`,
      [domain]
    )
    const currentPublished = currentRes.rows[0] || null

    // 3. Concurrent editing conflict detection
    if (baseVersion && currentPublished?.consent_version && baseVersion !== currentPublished.consent_version) {
      return NextResponse.json({
        conflict: true,
        detail: `This configuration was published as v${currentPublished.consent_version} while you were editing v${baseVersion}. Review the latest version before publishing.`,
        current_version: currentPublished.consent_version,
      }, { status: 409, headers: CORS_HEADERS })
    }

    // 4. Calculate diff & guaranteed unique new version
    const existingVersionsRes = await client.query(
      `SELECT version FROM consent_versions WHERE domain = $1`,
      [domain]
    )
    const existingVersionSet = new Set(existingVersionsRes.rows.map((r: any) => r.version))

    let candidateVersion = incrementVersion(currentPublished?.consent_version || "1.0")
    while (existingVersionSet.has(candidateVersion)) {
      candidateVersion = incrementVersion(candidateVersion)
    }
    const newVersion = candidateVersion
    const diffs = computeConfigurationDiff(currentPublished, draftConfig)

    await client.query("BEGIN")

    // 5. Insert immutable record in consent_versions
    const versionId = randomUUID()
    await client.query(
      `INSERT INTO consent_versions (
        id, domain, version, config, change_summary, published_at, previous_version
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      ON CONFLICT (domain, version) DO UPDATE SET
        config = EXCLUDED.config,
        change_summary = EXCLUDED.change_summary,
        published_at = NOW()`,
      [
        versionId,
        domain,
        newVersion,
        JSON.stringify(draftConfig),
        JSON.stringify(diffs),
        currentPublished?.consent_version || "1.0",
      ]
    )

    // 6. Atomically update production consent_configs
    const configId = currentPublished?.id || randomUUID()
    const categoryConfigsJson = draftConfig.category_configs
      ? JSON.stringify(draftConfig.category_configs)
      : (currentPublished?.category_configs ? JSON.stringify(currentPublished.category_configs) : null)

    const upsertRes = await client.query(
      `INSERT INTO consent_configs (
        id, domain, is_enabled, layout, theme, primary_color, border_radius,
        title, description, privacy_policy_url, show_close_button, accept_all_label, reject_all_label,
        preferences_label, preferences_title, preferences_description, save_preferences_label,
        always_active_label, no_cookies_to_display_label, cookie_column_label,
        duration_column_label, description_column_label,
        enable_necessary_category, enable_functional_category,
        enable_analytics_category, enable_performance_category, enable_advertisement_category,
        show_revisit_button, revisit_button_position, enable_consent_mode_v2, enable_iab_tcf, geo_targeting,
        target_countries, enable_gpc, consent_version, custom_css, law_template,
        enable_auto_language, default_language, supported_languages,
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
        $28, $29, $30, $31, $32,
        $33, $34, $35, $36, $37,
        $38, $39, $40,
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
        geo_targeting = EXCLUDED.geo_targeting,
        target_countries = COALESCE(EXCLUDED.target_countries, consent_configs.target_countries),
        enable_gpc = EXCLUDED.enable_gpc,
        consent_version = EXCLUDED.consent_version,
        custom_css = EXCLUDED.custom_css,
        law_template = EXCLUDED.law_template,
        enable_auto_language = EXCLUDED.enable_auto_language,
        default_language = EXCLUDED.default_language,
        supported_languages = EXCLUDED.supported_languages,
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
        configId,
        domain,
        draftConfig.is_enabled !== undefined ? draftConfig.is_enabled : true,
        draftConfig.layout || (currentPublished?.layout || "bottom_bar"),
        draftConfig.theme || (currentPublished?.theme || "light"),
        draftConfig.primary_color || (currentPublished?.primary_color || "#1868db"),
        draftConfig.border_radius || (currentPublished?.border_radius || "rounded-md"),
        draftConfig.title || (currentPublished?.title || "We value your privacy"),
        draftConfig.description || (currentPublished?.description || "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies."),
        draftConfig.privacy_policy_url || (currentPublished?.privacy_policy_url || "/privacy"),
        draftConfig.show_close_button !== undefined ? Boolean(draftConfig.show_close_button) : (currentPublished?.show_close_button ?? false),
        draftConfig.accept_all_label || (currentPublished?.accept_all_label || "Accept All"),
        draftConfig.reject_all_label || (currentPublished?.reject_all_label || "Reject All"),
        draftConfig.preferences_label || (currentPublished?.preferences_label || "Customise"),
        draftConfig.preferences_title || (currentPublished?.preferences_title || "Customise Consent Preferences"),
        draftConfig.preferences_description || (currentPublished?.preferences_description || "We respect your privacy preferences and allow you to select which cookies and tracking technologies are enabled."),
        draftConfig.save_preferences_label || (currentPublished?.save_preferences_label || "Save My Preferences"),
        draftConfig.always_active_label || (currentPublished?.always_active_label || "Always Active"),
        draftConfig.no_cookies_to_display_label || (currentPublished?.no_cookies_to_display_label || "No cookies to display"),
        draftConfig.cookie_column_label || (currentPublished?.cookie_column_label || "Cookie"),
        draftConfig.duration_column_label || (currentPublished?.duration_column_label || "Duration"),
        draftConfig.description_column_label || (currentPublished?.description_column_label || "Description"),
        draftConfig.enable_necessary_category !== undefined ? draftConfig.enable_necessary_category : (currentPublished?.enable_necessary_category ?? true),
        draftConfig.enable_functional_category !== undefined ? draftConfig.enable_functional_category : (currentPublished?.enable_functional_category ?? true),
        draftConfig.enable_analytics_category !== undefined ? draftConfig.enable_analytics_category : (currentPublished?.enable_analytics_category ?? true),
        draftConfig.enable_performance_category !== undefined ? draftConfig.enable_performance_category : (currentPublished?.enable_performance_category ?? true),
        draftConfig.enable_advertisement_category !== undefined ? draftConfig.enable_advertisement_category : (currentPublished?.enable_advertisement_category ?? true),
        draftConfig.show_revisit_button !== undefined ? draftConfig.show_revisit_button : (currentPublished?.show_revisit_button ?? true),
        draftConfig.revisit_button_position || (currentPublished?.revisit_button_position || "bottom_left"),
        draftConfig.enable_consent_mode_v2 !== undefined ? draftConfig.enable_consent_mode_v2 : (currentPublished?.enable_consent_mode_v2 ?? true),
        draftConfig.enable_iab_tcf !== undefined ? draftConfig.enable_iab_tcf : (currentPublished?.enable_iab_tcf ?? true),
        draftConfig.geo_targeting || (currentPublished?.geo_targeting || "all"),
        draftConfig.target_countries || (currentPublished?.target_countries || null),
        draftConfig.enable_gpc !== undefined ? draftConfig.enable_gpc : (currentPublished?.enable_gpc ?? true),
        newVersion,
        draftConfig.custom_css || (currentPublished?.custom_css || ""),
        draftConfig.law_template || (currentPublished?.law_template || "gdpr"),
        draftConfig.enable_auto_language !== undefined ? draftConfig.enable_auto_language : (currentPublished?.enable_auto_language ?? true),
        draftConfig.default_language || (currentPublished?.default_language || "en"),
        draftConfig.supported_languages || (currentPublished?.supported_languages || ["en", "de", "fr", "es", "pt", "it", "nl", "hi"]),
        draftConfig.show_cookie_list_on_banner !== undefined ? draftConfig.show_cookie_list_on_banner : (currentPublished?.show_cookie_list_on_banner ?? true),
        draftConfig.show_google_privacy_policy !== undefined ? draftConfig.show_google_privacy_policy : (currentPublished?.show_google_privacy_policy ?? false),
        categoryConfigsJson,
        draftConfig.necessary_title || (currentPublished?.necessary_title || null),
        draftConfig.necessary_description || (currentPublished?.necessary_description || null),
        draftConfig.functional_title || (currentPublished?.functional_title || null),
        draftConfig.functional_description || (currentPublished?.functional_description || null),
        draftConfig.analytics_title || (currentPublished?.analytics_title || null),
        draftConfig.analytics_description || (currentPublished?.analytics_description || null),
        draftConfig.performance_title || (currentPublished?.performance_title || null),
        draftConfig.performance_description || (currentPublished?.performance_description || null),
        draftConfig.advertisement_title || (currentPublished?.advertisement_title || null),
        draftConfig.advertisement_description || (currentPublished?.advertisement_description || null),
      ]
    )

    // 7. Clear draft
    await client.query(`DELETE FROM consent_drafts WHERE domain = $1`, [domain])

    await client.query("COMMIT")

    return NextResponse.json({
      ok: true,
      published_version: newVersion,
      change_summary: diffs,
      published_at: new Date().toISOString(),
      config: upsertRes.rows[0],
    }, { headers: CORS_HEADERS })
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {})
    console.error("POST /api/v1/consent/publish error:", err)
    return NextResponse.json({ detail: err.message || "Failed to publish consent configuration" }, { status: 500, headers: CORS_HEADERS })
  } finally {
    client.release()
  }
}
