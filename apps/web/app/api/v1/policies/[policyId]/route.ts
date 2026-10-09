import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import {
  generatePrivacyPolicyMarkdown,
  generatePrivacyPolicyHtml,
  generateTermsOfServiceMarkdown,
  generateTermsOfServiceHtml,
} from "@/components/dashboard/policy/policy-generator-template"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

function mapPolicyRow(row: any) {
  const config = typeof row.config === "string" ? JSON.parse(row.config) : row.config || {}
  const cleanId = (row.policy_id || "").replace(/-(policy|declaration)$/i, "").toLowerCase()

  let contentHtml = row.content_html || ""
  let contentMarkdown = row.content_markdown || ""

  // Always use modern, clean legal generator for privacy & terms policies to avoid legacy bold / Termly footers
  if (cleanId === "privacy" || (!contentHtml && cleanId === "privacy") || contentHtml.includes("Termly") || contentMarkdown.includes("Termly")) {
    contentHtml = generatePrivacyPolicyHtml(config, row.domain)
    contentMarkdown = generatePrivacyPolicyMarkdown(config, row.domain)
  } else if (cleanId === "terms" || cleanId === "terms_of_service" || cleanId === "terms_of_use" || (!contentHtml && (cleanId.includes("terms")))) {
    contentHtml = generateTermsOfServiceHtml(config, row.domain)
    contentMarkdown = generateTermsOfServiceMarkdown(config, row.domain)
  }

  // Strip any stray third-party attribution footers
  contentHtml = contentHtml
    .replace(/<p[^>]*><em>\s*This (Privacy Policy|Terms of Service|Terms of Use) was created using.*?\s*<\/em><\/p>/gi, "")
    .replace(/This (Privacy Policy|Terms of Service|Terms of Use) was created using.*?(<\/p>|\n|$)/gi, "")
    .trim()

  contentMarkdown = contentMarkdown
    .replace(/\*This (Privacy Policy|Terms of Service|Terms of Use) was created using.*?\*/gi, "")
    .replace(/This (Privacy Policy|Terms of Service|Terms of Use) was created using.*(\n|$)/gi, "")
    .trim()

  return {
    id: row.id,
    domain: row.domain,
    policyId: row.policy_id,
    policy_id: row.policy_id,
    status: row.status,
    version: row.version,
    customTitle: row.custom_title,
    custom_title: row.custom_title,
    config,
    contentMarkdown,
    content_markdown: contentMarkdown,
    contentHtml,
    content_html: contentHtml,
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

    const cleanId = policyId.replace(/-(policy|declaration)$/i, "").toLowerCase()

    const user = await getCurrentUser().catch(() => null)
    let res: any
    if (user?.id) {
      const siteRes = await pool.query(
        `SELECT s.id FROM sites s 
         LEFT JOIN workspace_members wm ON s.workspace_id = wm.workspace_id 
         WHERE s.domain = $1 AND (s.user_id = $2 OR wm.user_id = $2) 
         LIMIT 1`,
        [domain, user.id]
      )
      if (siteRes.rows.length > 0) {
        res = await pool.query(
          `SELECT * FROM generated_policies WHERE domain = $1 AND (policy_id = $2 OR policy_id = $3)`,
          [domain, policyId, cleanId]
        )
      } else {
        res = await pool.query(
          `SELECT * FROM generated_policies WHERE domain = $1 AND (policy_id = $2 OR policy_id = $3) AND status = 'published'`,
          [domain, policyId, cleanId]
        )
      }
    } else {
      res = await pool.query(
        `SELECT * FROM generated_policies WHERE domain = $1 AND (policy_id = $2 OR policy_id = $3) AND status = 'published'`,
        [domain, policyId, cleanId]
      )
    }

    if (res.rows.length === 0) {
      if (cleanId === "privacy") {
        const defaultHtml = generatePrivacyPolicyHtml({ websiteUrl: `https://${domain}` }, domain)
        const defaultMd = generatePrivacyPolicyMarkdown({ websiteUrl: `https://${domain}` }, domain)
        return NextResponse.json({
          id: `default-privacy-${domain}`,
          domain,
          policyId: "privacy",
          status: "published",
          version: "v1.0",
          contentHtml: defaultHtml,
          content_html: defaultHtml,
          contentMarkdown: defaultMd,
          content_markdown: defaultMd,
          publishedAt: new Date().toISOString(),
        }, { headers: corsHeaders })
      } else if (cleanId === "terms" || cleanId === "terms_of_service" || cleanId === "terms_of_use") {
        const defaultHtml = generateTermsOfServiceHtml({ websiteUrl: `https://${domain}` }, domain)
        const defaultMd = generateTermsOfServiceMarkdown({ websiteUrl: `https://${domain}` }, domain)
        return NextResponse.json({
          id: `default-terms-${domain}`,
          domain,
          policyId: "terms",
          status: "published",
          version: "v1.0",
          contentHtml: defaultHtml,
          content_html: defaultHtml,
          contentMarkdown: defaultMd,
          content_markdown: defaultMd,
          publishedAt: new Date().toISOString(),
        }, { headers: corsHeaders })
      }
      return NextResponse.json({ detail: "Policy not found" }, { status: 404, headers: corsHeaders })
    }

    const mapped = mapPolicyRow(res.rows[0])
    return NextResponse.json(mapped, { headers: corsHeaders })
  } catch (err: any) {
    console.error("GET /api/v1/policies/[policyId] error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch policy" }, { status: 500, headers: corsHeaders })
  }
}

