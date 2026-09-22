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

    const res = await pool.query(
      `SELECT 
        w.id, 
        w.name, 
        w.slug, 
        w.owner_id, 
        w.created_at, 
        w.updated_at,
        wm.role,
        (SELECT COUNT(id)::int FROM workspace_members WHERE workspace_id = w.id) as members_count,
        (SELECT COUNT(id)::int FROM sites WHERE workspace_id = w.id OR (w.owner_id = $1 AND workspace_id IS NULL AND user_id = $1)) as sites_count
      FROM workspaces w
      INNER JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY w.created_at ASC`,
      [user.id]
    )

    return NextResponse.json(res.rows || [])
  } catch (err: any) {
    console.error("GET /api/v1/workspaces error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch workspaces" }, { status: 500 })
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

    // 1. Create Workspace
    const wRes = await pool.query(
      `INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
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
