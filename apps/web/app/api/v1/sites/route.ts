import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  let clean = input.trim().toLowerCase()
  clean = clean.replace(/^(https?:\/\/)/i, "")
  clean = clean.split("/")[0] || ""
  clean = clean.split(":")[0] || ""
  return clean.trim()
}

export async function GET(req: Request) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json([])
    }

    // Fetch sites owned by user or in workspaces user belongs to
    const res = await pool.query(
      `SELECT DISTINCT s.id, s.domain, s.name, s.timezone, s.public, s.installation_status, s.last_verified_at, s.created_at, s.workspace_id 
       FROM sites s 
       LEFT JOIN workspace_members wm ON s.workspace_id = wm.workspace_id 
       WHERE s.user_id = $1 OR wm.user_id = $1 
       ORDER BY s.created_at DESC`,
      [user.id]
    )

    return NextResponse.json(res.rows)
  } catch (err: any) {
    console.warn("GET /api/v1/sites fallback:", err?.message || err)
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized. Please log in." }, { status: 401 })
    }

    const body = await req.json()
    const cleanDomain = sanitizeDomain(body.domain)
    const siteName = (body.name || "").trim() || cleanDomain

    if (!cleanDomain) {
      return NextResponse.json({ detail: "A valid website domain name is required (e.g. example.com)" }, { status: 400 })
    }

    // Determine target workspace
    let workspaceId = body.workspace_id || null
    if (!workspaceId) {
      // Find workspace member of
      const wsRes = await pool.query(
        `SELECT w.id FROM workspaces w
         INNER JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = $1
         ORDER BY w.created_at ASC LIMIT 1`,
        [user.id]
      )
      if (wsRes.rows.length > 0) {
        workspaceId = wsRes.rows[0]?.id || null
      } else {
        // Check if owner of any workspace
        const ownerWsRes = await pool.query(
          `SELECT id FROM workspaces WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [user.id]
        )
        if (ownerWsRes.rows.length > 0) {
          workspaceId = ownerWsRes.rows[0]?.id
          await pool.query(
            `INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
             VALUES ($1, $2, $3, 'owner', NOW())
             ON CONFLICT (workspace_id, user_id) DO NOTHING`,
            [randomUUID(), workspaceId, user.id]
          )
        } else {
          // Auto create default workspace
          const newWsId = randomUUID()
          const userSlug = `ws-${user.id.slice(0, 8)}-${Date.now().toString(36)}`
          await pool.query(
            `INSERT INTO workspaces (id, name, slug, owner_id, onboarding_completed, onboarding_step, created_at, updated_at)
             VALUES ($1, $2, $3, $4, TRUE, 'install', NOW(), NOW())
             ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()`,
            [newWsId, `${user.name || "My"} Workspace`, userSlug, user.id]
          )
          await pool.query(
            `INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
             VALUES ($1, $2, $3, 'owner', NOW())
             ON CONFLICT (workspace_id, user_id) DO NOTHING`,
            [randomUUID(), newWsId, user.id]
          )
          workspaceId = newWsId
        }
      }
    }

    const timezone = body.timezone || "UTC"
    const existing = await pool.query(
      "SELECT id, domain, name, user_id, workspace_id, installation_status, created_at FROM sites WHERE domain = $1",
      [cleanDomain]
    )

    if (existing.rows.length > 0) {
      const site = existing.rows[0]
      if (site) {
        // If site exists and belongs to current user or has no owner, reassign and return it
        if (!site.user_id || site.user_id === user.id) {
          await pool.query(
            "UPDATE sites SET user_id = $1, workspace_id = COALESCE($2, workspace_id), name = COALESCE(name, $3) WHERE id = $4",
            [user.id, workspaceId, siteName, site.id]
          )
          return NextResponse.json({
            id: site.id,
            domain: cleanDomain,
            name: siteName,
            timezone,
            public: false,
            workspace_id: workspaceId || site.workspace_id,
            installation_status: site.installation_status || "not_started",
            created_at: site.created_at,
          })
        }

        return NextResponse.json({ detail: `Domain '${cleanDomain}' is already registered.` }, { status: 400 })
      }
    }

    const id = randomUUID()
    const insertRes = await pool.query(
      `INSERT INTO sites (id, domain, name, timezone, public, user_id, workspace_id, installation_status, created_at)
       VALUES ($1, $2, $3, $4, FALSE, $5, $6, 'not_started', NOW())
       RETURNING id, domain, name, timezone, public, user_id, workspace_id, installation_status, created_at`,
      [id, cleanDomain, siteName, timezone, user.id, workspaceId]
    )

    const newSite = insertRes.rows[0]

    // Initialize default consent configuration if not existing
    await pool.query(
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
        FALSE, 'en', ARRAY['en'], 'all',
        TRUE, '1.0', '', 'gdpr',
        NOW(), NOW()
      )
      ON CONFLICT (domain) DO NOTHING`,
      [randomUUID(), cleanDomain]
    ).catch((e) => console.error("Auto consent config initialization error:", e))

    // If workspace exists, update workspace onboarding state
    if (workspaceId) {
      await pool.query(
        `UPDATE workspaces
         SET first_site_id = COALESCE(first_site_id, $1),
             onboarding_step = CASE WHEN onboarding_step = 'welcome' OR onboarding_step = 'website' THEN 'install' ELSE onboarding_step END
         WHERE id = $2`,
        [id, workspaceId]
      )
    }

    return NextResponse.json(newSite || null)
  } catch (err: any) {
    console.error("POST /api/v1/sites error:", err)
    return NextResponse.json({ detail: err.message || "Failed to create site" }, { status: 500 })
  }
}
