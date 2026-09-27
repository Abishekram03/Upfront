import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { randomUUID } from "node:crypto"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace("https://", "").replace("http://", "").split("/")[0]
  return (first || "").trim().toLowerCase()
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
    console.error("GET /api/v1/sites error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch sites" }, { status: 500 })
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
      return NextResponse.json({ detail: "Domain is required" }, { status: 400 })
    }

    // Determine target workspace
    let workspaceId = body.workspace_id || null
    if (!workspaceId) {
      // Find default or first workspace for this user
      const wsRes = await pool.query(
        `SELECT w.id FROM workspaces w
         INNER JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = $1
         ORDER BY w.created_at ASC LIMIT 1`,
        [user.id]
      )
      if (wsRes.rows.length > 0) {
        workspaceId = wsRes.rows[0]?.id || null
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
        // If site exists in this workspace, return it idempotently
        if (site.workspace_id === workspaceId) {
          return NextResponse.json(site)
        }
        // If site exists but has no user_id (legacy), assign it to this user & workspace
        if (!site.user_id) {
          await pool.query(
            "UPDATE sites SET user_id = $1, workspace_id = COALESCE($2, workspace_id), name = COALESCE(name, $3) WHERE id = $4",
            [user.id, workspaceId, siteName, site.id]
          )
          return NextResponse.json({ id: site.id, domain: cleanDomain, name: siteName, timezone, public: false, workspace_id: workspaceId, installation_status: site.installation_status || "not_started" })
        }
        if (site.user_id !== user.id) {
          return NextResponse.json({ detail: "Domain is already registered by another account." }, { status: 400 })
        }
        return NextResponse.json(site)
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

    // If workspace exists and has no first_site_id, update workspace onboarding state
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
