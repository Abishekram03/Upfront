import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { randomUUID } from "node:crypto"

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

export async function GET() {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    // Self-heal: Mark workspaces that already have sites, paid tiers, or subscriptions as onboarding_completed = TRUE
    await pool.query(
      `UPDATE workspaces 
       SET onboarding_completed = TRUE, onboarding_step = 'completed'
       WHERE (onboarding_completed IS NULL OR onboarding_completed = FALSE)
         AND (
           EXISTS (SELECT 1 FROM sites WHERE sites.workspace_id = workspaces.id OR (sites.user_id = workspaces.owner_id))
           OR plan_tier != 'free'
           OR EXISTS (SELECT 1 FROM subscriptions WHERE subscriptions.workspace_id = workspaces.id)
         )`
    )

    const res = await pool.query(
      `SELECT 
        w.id, 
        w.name, 
        w.slug, 
        w.owner_id, 
        (
          w.onboarding_completed = TRUE
          OR w.plan_tier != 'free'
          OR EXISTS(SELECT 1 FROM sites WHERE workspace_id = w.id OR (w.owner_id = $1 AND user_id = $1))
          OR EXISTS(SELECT 1 FROM subscriptions WHERE workspace_id = w.id)
        ) as onboarding_completed,
        COALESCE(w.onboarding_step, 'completed') as onboarding_step,
        w.first_site_id,
        COALESCE(w.plan_tier, 'free') as plan_tier,
        w.created_at, 
        w.updated_at,
        wm.role,
        (SELECT COUNT(id)::int FROM workspace_members WHERE workspace_id = w.id) as members_count,
        (SELECT COUNT(id)::int FROM sites WHERE workspace_id = w.id OR (w.owner_id = $1 AND workspace_id IS NULL AND user_id = $1)) as sites_count
      FROM workspaces w
      INNER JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY 
        (CASE WHEN w.plan_tier != 'free' THEN 0 ELSE 1 END) ASC,
        (SELECT COUNT(id) FROM sites WHERE workspace_id = w.id) DESC,
        w.created_at ASC`,
      [user.id]
    )

    if (!res.rows || res.rows.length === 0) {
      await pool.query(
        `INSERT INTO workspaces (id, name, slug, owner_id, onboarding_completed, onboarding_step, plan_tier, created_at, updated_at)
         VALUES ('ws_default', 'My Workspace', 'my-workspace', $1, TRUE, 'completed', 'open_source', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [user.id]
      )
      await pool.query(
        `INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
         VALUES ('wm_default', 'ws_default', $1, 'owner', NOW())
         ON CONFLICT (workspace_id, user_id) DO NOTHING`,
        [user.id]
      )
      const refetched = await pool.query(
        `SELECT 
          w.id, w.name, w.slug, w.owner_id, 
          TRUE as onboarding_completed,
          'completed' as onboarding_step,
          w.first_site_id,
          'open_source' as plan_tier,
          w.created_at, w.updated_at,
          'owner' as role,
          1 as members_count,
          0 as sites_count
         FROM workspaces w WHERE w.id = 'ws_default'`
      )
      return NextResponse.json(refetched.rows)
    }

    return NextResponse.json(res.rows || [])
  } catch (err: any) {
    console.warn("GET /api/v1/workspaces fallback:", err?.message || err)
    return NextResponse.json([
      {
        id: "ws_default",
        name: "My Workspace",
        slug: "my-workspace",
        owner_id: "usr_local_admin",
        role: "owner",
        plan_tier: "open_source",
        onboarding_completed: true,
        onboarding_step: "completed",
        first_site_id: null,
        members_count: 1,
        sites_count: 0,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ])
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
    const name = (body.name || "").trim()

    if (!name) {
      return NextResponse.json({ detail: "Workspace name is required" }, { status: 400 })
    }

    let baseSlug = slugify(body.slug || name)
    if (!baseSlug) baseSlug = "workspace"

    // Ensure unique slug
    let slug = baseSlug
    let suffix = 1
    while (true) {
      const existing = await pool.query("SELECT id FROM workspaces WHERE slug = $1", [slug])
      if (existing.rows.length === 0) break
      slug = `${baseSlug}-${suffix++}`
    }

    const workspaceId = randomUUID()
    const memberId = randomUUID()

    // 1. Create Workspace with onboarding defaults
    const wRes = await pool.query(
      `INSERT INTO workspaces (id, name, slug, owner_id, onboarding_completed, onboarding_step, created_at, updated_at)
       VALUES ($1, $2, $3, $4, FALSE, 'welcome', NOW(), NOW())
       RETURNING id, name, slug, owner_id, onboarding_completed, onboarding_step, first_site_id, created_at, updated_at`,
      [workspaceId, name, slug, user.id]
    )

    // 2. Add owner to workspace_members
    await pool.query(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
       VALUES ($1, $2, $3, 'owner', NOW())`,
      [memberId, workspaceId, user.id]
    )

    // 3. Link any unassociated sites owned by this user to their new workspace
    await pool.query(
      `UPDATE sites SET workspace_id = $1 WHERE user_id = $2 AND workspace_id IS NULL`,
      [workspaceId, user.id]
    )

    const workspace = wRes.rows[0] || null
    return NextResponse.json(
      {
        ...workspace,
        role: "owner",
        members_count: 1,
        sites_count: 0,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error("POST /api/v1/workspaces error:", err)
    return NextResponse.json({ detail: err.message || "Failed to create workspace" }, { status: 500 })
  }
}
