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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const domain = sanitizeDomain(body.domain)

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    // Validation
    const companyName = (body.company_name || "").trim() || "Our Company"
    const websiteUrl = (body.website_url || "").trim() || `https://${domain}`
    const contactEmail = (body.contact_email || "").trim() || `privacy@${domain}`
    const effectiveDate = (body.effective_date || "").trim() || new Date().toISOString().slice(0, 10)
    const lawTemplate = body.law_template || "gdpr"
    const enableGpcClause = body.enable_gpc_clause !== undefined ? Boolean(body.enable_gpc_clause) : true
    const enableGcmClause = body.enable_gcm_clause !== undefined ? Boolean(body.enable_gcm_clause) : true

    // Check existing published policy to increment version
    const existingRes = await pool.query(
      `SELECT id, policy_version FROM cookie_policies WHERE domain = $1`,
      [domain]
    )
    const existing = existingRes.rows[0]
    const nextVersion = existing ? incrementVersion(existing.policy_version) : "1.0"

    const siteRes = await pool.query("SELECT id FROM sites WHERE domain = $1", [domain])
    const siteId = siteRes.rows[0]?.id || null

    const policyId = existing?.id || randomUUID()
    const upsertRes = await pool.query(
      `INSERT INTO cookie_policies (
        id, site_id, domain, company_name, website_url, contact_email,
        effective_date, law_template, enable_gpc_clause, enable_gcm_clause,
        is_published, policy_version, created_at, updated_at, published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11, NOW(), NOW(), NOW()
      )
      ON CONFLICT (domain) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        website_url = EXCLUDED.website_url,
        contact_email = EXCLUDED.contact_email,
        effective_date = EXCLUDED.effective_date,
        law_template = EXCLUDED.law_template,
        enable_gpc_clause = EXCLUDED.enable_gpc_clause,
        enable_gcm_clause = EXCLUDED.enable_gcm_clause,
        policy_version = EXCLUDED.policy_version,
        is_published = TRUE,
        updated_at = NOW(),
        published_at = NOW()
      RETURNING *`,
      [
        policyId,
        siteId,
        domain,
        companyName,
        websiteUrl,
        contactEmail,
        effectiveDate,
        lawTemplate,
        enableGpcClause,
        enableGcmClause,
        nextVersion,
      ]
    )

    // Clear working draft
    await pool.query("DELETE FROM cookie_policy_drafts WHERE domain = $1", [domain])

    return NextResponse.json({
      ok: true,
      published: true,
      domain: domain,
      policy: {
        company_name: upsertRes.rows[0].company_name,
        website_url: upsertRes.rows[0].website_url,
        contact_email: upsertRes.rows[0].contact_email,
        effective_date: upsertRes.rows[0].effective_date,
        law_template: upsertRes.rows[0].law_template,
        enable_gpc_clause: upsertRes.rows[0].enable_gpc_clause,
        enable_gcm_clause: upsertRes.rows[0].enable_gcm_clause,
        policy_version: upsertRes.rows[0].policy_version,
        published_at: upsertRes.rows[0].published_at,
      },
    }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("POST /api/v1/consent/policy/publish error:", err)
    return NextResponse.json({ detail: err.message || "Failed to publish cookie policy" }, { status: 500, headers: CORS_HEADERS })
  }
}
