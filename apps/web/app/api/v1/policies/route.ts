import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

function formatAgo(dateStr?: string | null): string {
  if (!dateStr) return "Just now"
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`
}

function mapPolicyRow(row: any) {
  const publishedAgo = row.published_at
    ? formatAgo(row.published_at)
    : row.updated_at
    ? `Saved ${formatAgo(row.updated_at)}`
    : "Draft"

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
    publishedAgo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain) {
      return NextResponse.json({ detail: "Domain parameter is required" }, { status: 400 })
    }

    const res = await pool.query(
      `SELECT * FROM generated_policies WHERE domain = $1 ORDER BY created_at ASC`,
      [domain]
    )

    const formatted = (res.rows || []).map(mapPolicyRow)
    return NextResponse.json(formatted)
  } catch (err: any) {
    console.error("GET /api/v1/policies error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch policies" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const body = await req.json()
    const domain = sanitizeDomain(body.domain)
    const policyId = (body.policy_id || body.policyId || "").trim()

    if (!domain || !policyId) {
      return NextResponse.json({ detail: "Domain and policy_id are required" }, { status: 400 })
    }

    const status = body.status === "published" ? "published" : "draft"
    const customTitle = body.custom_title || body.customTitle || null
    const config = typeof body.config === "object" ? JSON.stringify(body.config) : (body.config || "{}")
    const contentMarkdown = body.content_markdown || body.contentMarkdown || null
    const contentHtml = body.content_html || body.contentHtml || null
    const version = body.version || (status === "published" ? "1.0" : "0.1")
    const publishedAt = status === "published" ? new Date() : null
    const id = randomUUID()

    const res = await pool.query(
      `INSERT INTO generated_policies (
        id, domain, policy_id, status, version, custom_title, config, content_markdown, content_html, published_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, NOW()
      )
      ON CONFLICT (domain, policy_id) DO UPDATE SET
        status = EXCLUDED.status,
        version = EXCLUDED.version,
        custom_title = EXCLUDED.custom_title,
        config = EXCLUDED.config,
        content_markdown = EXCLUDED.content_markdown,
        content_html = EXCLUDED.content_html,
        published_at = CASE WHEN EXCLUDED.status = 'published' THEN NOW() ELSE generated_policies.published_at END,
        updated_at = NOW()
      RETURNING *`,
      [id, domain, policyId, status, version, customTitle, config, contentMarkdown, contentHtml, publishedAt]
    )

    const savedRecord = mapPolicyRow(res.rows[0])
    return NextResponse.json(savedRecord, { status: 200 })
  } catch (err: any) {
    console.error("POST /api/v1/policies error:", err)
    return NextResponse.json({ detail: err.message || "Failed to save policy" }, { status: 500 })
  }
}
