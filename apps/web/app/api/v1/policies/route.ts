import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

function formatAgo(dateInput?: string | Date | number | null): string {
  if (!dateInput) return "Just now"
  try {
    let date: Date
    if (dateInput instanceof Date) {
      date = dateInput
    } else if (typeof dateInput === "number") {
      date = new Date(dateInput)
    } else {
      let str = String(dateInput).trim()
      if (!str) return "Just now"
      if (!str.endsWith("Z") && !/[+-]\d{2}(?::?\d{2})?$/.test(str)) {
        str = str.replace(" ", "T") + "Z"
      }
      date = new Date(str)
    }

    if (isNaN(date.getTime())) return "Recently"

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    if (diffMs < 60000) return "Just now"

    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays}d ago`
    const diffMonths = Math.floor(diffDays / 30)
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`
  } catch {
    return "Recently"
  }
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
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain) {
      return NextResponse.json({ detail: "Domain parameter is required" }, { status: 400 })
    }

    // Verify domain belongs to authenticated user or their workspace
    const siteRes = await pool.query(
      `SELECT s.id, s.domain, s.workspace_id, s.user_id 
       FROM sites s 
       LEFT JOIN workspace_members wm ON s.workspace_id = wm.workspace_id 
       WHERE s.domain = $1 AND (s.user_id = $2 OR wm.user_id = $2) 
       LIMIT 1`,
      [domain, user.id]
    )

    if (siteRes.rows.length === 0) {
      // The current user has no access to this domain — return empty list for strict account isolation
      return NextResponse.json([])
    }

    const site = siteRes.rows[0]

    const res = await pool.query(
      `SELECT * FROM generated_policies 
       WHERE domain = $1 
         AND (site_id = $2 OR workspace_id = $3 OR user_id = $4 OR (workspace_id IS NULL AND user_id IS NULL))
       ORDER BY created_at ASC`,
      [domain, site.id, site.workspace_id, user.id]
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
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const domain = sanitizeDomain(body.domain)
    const policyId = (body.policy_id || body.policyId || "").trim()

    if (!domain || !policyId) {
      return NextResponse.json({ detail: "Domain and policy_id are required" }, { status: 400 })
    }

    // Verify domain belongs to authenticated user or their workspace
    const siteRes = await pool.query(
      `SELECT s.id, s.domain, s.workspace_id, s.user_id 
       FROM sites s 
       LEFT JOIN workspace_members wm ON s.workspace_id = wm.workspace_id 
       WHERE s.domain = $1 AND (s.user_id = $2 OR wm.user_id = $2) 
       LIMIT 1`,
      [domain, user.id]
    )

    if (siteRes.rows.length === 0) {
      return NextResponse.json(
        { detail: "Forbidden: You do not have permission to manage policies for this domain." },
        { status: 403 }
      )
    }

    const site = siteRes.rows[0]
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
        id, domain, policy_id, status, version, custom_title, config, content_markdown, content_html, published_at, updated_at, user_id, workspace_id, site_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, NOW(), $11, $12, $13
      )
      ON CONFLICT (domain, policy_id) DO UPDATE SET
        status = EXCLUDED.status,
        version = EXCLUDED.version,
        custom_title = EXCLUDED.custom_title,
        config = EXCLUDED.config,
        content_markdown = EXCLUDED.content_markdown,
        content_html = EXCLUDED.content_html,
        published_at = CASE WHEN EXCLUDED.status = 'published' THEN NOW() ELSE generated_policies.published_at END,
        updated_at = NOW(),
        user_id = EXCLUDED.user_id,
        workspace_id = EXCLUDED.workspace_id,
        site_id = EXCLUDED.site_id
      RETURNING *`,
      [id, domain, policyId, status, version, customTitle, config, contentMarkdown, contentHtml, publishedAt, user.id, site.workspace_id, site.id]
    )

    const savedRecord = mapPolicyRow(res.rows[0])
    return NextResponse.json(savedRecord, { status: 200 })
  } catch (err: any) {
    console.error("POST /api/v1/policies error:", err)
    return NextResponse.json({ detail: err.message || "Failed to save policy" }, { status: 500 })
  }
}
