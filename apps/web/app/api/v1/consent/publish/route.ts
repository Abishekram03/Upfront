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

    // 4. Calculate diff & new version
    const newVersion = incrementVersion(currentPublished?.consent_version || "1.0")
    const diffs = computeConfigurationDiff(currentPublished, draftConfig)

    await client.query("BEGIN")

    // 5. Insert immutable record in consent_versions
    const versionId = randomUUID()
    await client.query(
      `INSERT INTO consent_versions (
        id, domain, version, config, change_summary, published_at, previous_version
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
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
    const upsertRes = await client.query(
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
        draftConfig.is_enabled !== undefined ? draftConfig.is_enabled : true,
        draftConfig.layout || "bottom_bar",
        draftConfig.theme || "light",
        draftConfig.primary_color || "#1868db",
        draftConfig.border_radius || "rounded-md",
        draftConfig.title || "We value your privacy",
        draftConfig.description || "We use cookies to enhance your browsing experience...",
        draftConfig.privacy_policy_url || "/privacy",
        draftConfig.accept_all_label || "Accept All",
        draftConfig.reject_all_label || "Reject All",
        draftConfig.preferences_label || "Customise",
        draftConfig.preferences_title || "Customise Consent Preferences",
        draftConfig.preferences_description || "We respect your privacy preferences...",
        draftConfig.save_preferences_label || "Save My Preferences",
        draftConfig.always_active_label || "Always Active",
        draftConfig.no_cookies_to_display_label || "No cookies to display",
        draftConfig.cookie_column_label || "Cookie",
        draftConfig.duration_column_label || "Duration",
        draftConfig.description_column_label || "Description",
        draftConfig.enable_necessary_category !== undefined ? draftConfig.enable_necessary_category : true,
        draftConfig.enable_functional_category !== undefined ? draftConfig.enable_functional_category : true,
        draftConfig.enable_analytics_category !== undefined ? draftConfig.enable_analytics_category : true,
        draftConfig.enable_performance_category !== undefined ? draftConfig.enable_performance_category : true,
        draftConfig.enable_advertisement_category !== undefined ? draftConfig.enable_advertisement_category : true,
        draftConfig.show_revisit_button !== undefined ? draftConfig.show_revisit_button : true,
        draftConfig.revisit_button_position || "bottom_left",
        draftConfig.enable_consent_mode_v2 !== undefined ? draftConfig.enable_consent_mode_v2 : true,
        draftConfig.geo_targeting || "all",
        draftConfig.enable_gpc !== undefined ? draftConfig.enable_gpc : true,
        newVersion,
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
