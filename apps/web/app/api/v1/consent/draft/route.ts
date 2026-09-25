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

export async function GET(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    // Check if a draft exists
    const draftRes = await pool.query(
      `SELECT * FROM consent_drafts WHERE domain = $1`,
      [domain]
    )

    // Also get current published config to know published version
    const publishedRes = await pool.query(
      `SELECT * FROM consent_configs WHERE domain = $1`,
      [domain]
    )
    const publishedConfig = publishedRes.rows[0] || null

    if (draftRes.rows.length > 0) {
      const row = draftRes.rows[0]
      return NextResponse.json({
        is_draft: true,
        base_version: row.base_version,
        published_version: publishedConfig?.consent_version || "1.0",
        updated_at: row.updated_at,
        config: row.draft_config,
      }, { headers: CORS_HEADERS })
    }

    // No draft exists; return published config
    return NextResponse.json({
      is_draft: false,
      base_version: publishedConfig?.consent_version || "1.0",
      published_version: publishedConfig?.consent_version || "1.0",
      updated_at: publishedConfig?.updated_at || null,
      config: publishedConfig,
    }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("GET /api/v1/consent/draft error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch consent draft" }, { status: 500, headers: CORS_HEADERS })
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

    const baseVersion = body.base_version || "1.0"
    const draftConfig = body.config || body
    const id = randomUUID()

    const upsertRes = await pool.query(
      `INSERT INTO consent_drafts (
        id, domain, base_version, draft_config, updated_at
      ) VALUES (
        $1, $2, $3, $4, NOW()
      )
      ON CONFLICT (domain) DO UPDATE SET
        base_version = EXCLUDED.base_version,
        draft_config = EXCLUDED.draft_config,
        updated_at = NOW()
      RETURNING *`,
      [id, domain, baseVersion, JSON.stringify(draftConfig)]
    )

    return NextResponse.json({
      ok: true,
      is_draft: true,
      base_version: baseVersion,
      updated_at: upsertRes.rows[0].updated_at,
      config: upsertRes.rows[0].draft_config,
    }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("POST /api/v1/consent/draft error:", err)
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

    await pool.query(`DELETE FROM consent_drafts WHERE domain = $1`, [domain])

    return NextResponse.json({ ok: true, message: "Draft discarded successfully" }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("DELETE /api/v1/consent/draft error:", err)
    return NextResponse.json({ detail: err.message || "Failed to discard draft" }, { status: 500, headers: CORS_HEADERS })
  }
}
