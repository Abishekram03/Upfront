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
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

    const draftConfig = {
      company_name: body.company_name || "Our Company",
      website_url: body.website_url || `https://${domain}`,
      contact_email: body.contact_email || `privacy@${domain}`,
      effective_date: body.effective_date || new Date().toISOString().slice(0, 10),
      law_template: body.law_template || "gdpr",
      enable_gpc_clause: body.enable_gpc_clause !== undefined ? Boolean(body.enable_gpc_clause) : true,
      enable_gcm_clause: body.enable_gcm_clause !== undefined ? Boolean(body.enable_gcm_clause) : true,
      custom_clauses: Array.isArray(body.custom_clauses) ? body.custom_clauses : [],
    }

    const siteRes = await pool.query("SELECT id FROM sites WHERE domain = $1", [domain])
    const siteId = siteRes.rows[0]?.id || null

    const pubRes = await pool.query("SELECT policy_version FROM cookie_policies WHERE domain = $1", [domain])
    const baseVersion = pubRes.rows[0]?.policy_version || "1.0"

    const id = randomUUID()
    const upsertRes = await pool.query(
      `INSERT INTO cookie_policy_drafts (id, domain, site_id, base_version, draft_config, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (domain) DO UPDATE SET
         draft_config = EXCLUDED.draft_config,
         base_version = EXCLUDED.base_version,
         updated_at = NOW()
       RETURNING *`,
      [id, domain, siteId, baseVersion, JSON.stringify(draftConfig)]
    )

    return NextResponse.json({
      ok: true,
      is_draft: true,
      domain: domain,
      base_version: baseVersion,
      updated_at: upsertRes.rows[0]?.updated_at,
      policy: draftConfig,
    }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("POST /api/v1/consent/policy/draft error:", err)
    return NextResponse.json({ detail: err.message || "Failed to save draft" }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    await pool.query("DELETE FROM cookie_policy_drafts WHERE domain = $1", [domain])

    return NextResponse.json({ ok: true, detail: "Draft discarded" }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("DELETE /api/v1/consent/policy/draft error:", err)
    return NextResponse.json({ detail: err.message || "Failed to discard draft" }, { status: 500, headers: CORS_HEADERS })
  }
}
