import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    const isDraftRequested = searchParams.get("draft") === "true"

    if (!domain) {
      return NextResponse.json({ detail: "Domain parameter is required" }, { status: 400, headers: CORS_HEADERS })
    }

    // 1. If draft requested (dashboard context), check cookie_policy_drafts
    if (isDraftRequested) {
      const draftRes = await pool.query(
        `SELECT * FROM cookie_policy_drafts WHERE domain = $1`,
        [domain]
      )

      const publishedRes = await pool.query(
        `SELECT * FROM cookie_policies WHERE domain = $1`,
        [domain]
      )
      const published = publishedRes.rows[0] || null

      if (draftRes.rows.length > 0) {
        const row = draftRes.rows[0]
        return NextResponse.json({
          is_draft: true,
          base_version: row.base_version || "1.0",
          published_version: published?.policy_version || "1.0",
          updated_at: row.updated_at,
          policy: row.draft_config,
        }, { headers: CORS_HEADERS })
      }

      // If no draft exists, return current published or initial defaults
      if (published) {
        return NextResponse.json({
          is_draft: false,
          base_version: published.policy_version || "1.0",
          published_version: published.policy_version || "1.0",
          updated_at: published.updated_at,
          policy: {
            company_name: published.company_name,
            website_url: published.website_url,
            contact_email: published.contact_email,
            effective_date: published.effective_date,
            law_template: published.law_template,
            enable_gpc_clause: published.enable_gpc_clause,
            enable_gcm_clause: published.enable_gcm_clause,
            policy_version: published.policy_version,
            published_at: published.published_at,
          },
        }, { headers: CORS_HEADERS })
      }

      // Default baseline
      return NextResponse.json({
        is_draft: false,
        base_version: "1.0",
        published_version: "1.0",
        updated_at: null,
        policy: {
          company_name: "Our Company",
          website_url: `https://${domain}`,
          contact_email: `privacy@${domain}`,
          effective_date: new Date().toISOString().slice(0, 10),
          law_template: "gdpr",
          enable_gpc_clause: true,
          enable_gcm_clause: true,
          policy_version: "1.0",
        },
      }, { headers: CORS_HEADERS })
    }

    // 2. Public runtime access: ONLY return published policy and public cookie inventory
    const policyRes = await pool.query(
      `SELECT * FROM cookie_policies WHERE domain = $1`,
      [domain]
    )

    // Inherit active law_template from consent_configs if available
    const cmpConfigRes = await pool.query(
      `SELECT law_template, enable_gpc, enable_consent_mode_v2 FROM consent_configs WHERE domain = $1`,
      [domain]
    )
    const cmpConfig = cmpConfigRes.rows[0] || null

    let policyData = policyRes.rows[0]
    if (!policyData) {
      // Auto-provision initial published policy baseline for the domain
      const id = randomUUID()
      const siteRes = await pool.query("SELECT id FROM sites WHERE domain = $1", [domain])
      const siteId = siteRes.rows[0]?.id || null
      const lawTemplate = cmpConfig?.law_template || "gdpr"

      const insertRes = await pool.query(
        `INSERT INTO cookie_policies (
          id, site_id, domain, company_name, website_url, contact_email,
          effective_date, law_template, enable_gpc_clause, enable_gcm_clause,
          is_published, policy_version, created_at, updated_at, published_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, '1.0', NOW(), NOW(), NOW()
        )
        ON CONFLICT (domain) DO UPDATE SET updated_at = NOW()
        RETURNING *`,
        [
          id,
          siteId,
          domain,
          "Our Company",
          `https://${domain}`,
          `privacy@${domain}`,
          new Date().toISOString().slice(0, 10),
          lawTemplate,
          cmpConfig?.enable_gpc !== false,
          cmpConfig?.enable_consent_mode_v2 !== false,
        ]
      )
      policyData = insertRes.rows[0]
    }

    // 3. Fetch public cookie inventory from discovered_cookies
    const cookiesRes = await pool.query(
      `SELECT id, name, category, service_name, duration, description
       FROM discovered_cookies
       WHERE domain = $1
       ORDER BY category ASC, name ASC`,
      [domain]
    )

    return NextResponse.json({
      ok: true,
      domain: domain,
      policy: {
        company_name: policyData.company_name,
        website_url: policyData.website_url,
        contact_email: policyData.contact_email,
        effective_date: policyData.effective_date,
        law_template: policyData.law_template || cmpConfig?.law_template || "gdpr",
        enable_gpc_clause: Boolean(policyData.enable_gpc_clause),
        enable_gcm_clause: Boolean(policyData.enable_gcm_clause),
        policy_version: policyData.policy_version || "1.0",
        published_at: policyData.published_at,
      },
      cookies: cookiesRes.rows || [],
    }, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    })
  } catch (err: any) {
    console.error("GET /api/v1/consent/policy error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch cookie policy" }, { status: 500, headers: CORS_HEADERS })
  }
}
