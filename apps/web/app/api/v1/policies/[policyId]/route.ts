import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

function mapPolicyRow(row: any) {
  return {
    id: row.id,
    domain: row.domain,
    policyId: row.policy_id,
    policy_id: row.policy_id,
    status: row.status,
    version: row.version,
    customTitle: row.custom_title,
    custom_title: row.custom_title,
    config: typeof row.config === "string" ? JSON.parse(row.config) : row.config || {},
    contentMarkdown: row.content_markdown,
    content_markdown: row.content_markdown,
    contentHtml: row.content_html,
    content_html: row.content_html,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    published_at: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ policyId: string }> }
) {
  try {
    await ensureTables()
    const { policyId } = await params
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain || !policyId) {
      return NextResponse.json({ detail: "Domain and policyId are required" }, { status: 400, headers: corsHeaders })
    }

    const res = await pool.query(
      `SELECT * FROM generated_policies WHERE domain = $1 AND policy_id = $2`,
      [domain, policyId]
    )

    if (res.rows.length === 0) {
      return NextResponse.json({ detail: "Policy not found" }, { status: 404, headers: corsHeaders })
    }

    const mapped = mapPolicyRow(res.rows[0])
    return NextResponse.json(mapped, { headers: corsHeaders })
  } catch (err: any) {
    console.error("GET /api/v1/policies/[policyId] error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch policy" }, { status: 500, headers: corsHeaders })
  }
}
