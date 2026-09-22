import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { randomUUID } from "node:crypto"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params

    const res = await pool.query(
      `SELECT 
        wm.id, 
        wm.workspace_id, 
        wm.user_id, 
        wm.role, 
        wm.created_at,
        u.name,
        u.email,
        u.image
      FROM workspace_members wm
      INNER JOIN "user" u ON wm.user_id = u.id
      WHERE wm.workspace_id = $1
      ORDER BY 
        CASE wm.role 
          WHEN 'owner' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'member' THEN 3 
          ELSE 4 
        END ASC, 
        wm.created_at ASC`,
      [workspaceId]
    )

    return NextResponse.json(res.rows || [])
  } catch (err: any) {
    console.error("GET /api/v1/workspaces/[workspaceId]/members error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params
    const body = await req.json()
    const email = (body.email || "").trim().toLowerCase()
    const role = body.role || "member"

    if (!email) {
      return NextResponse.json({ detail: "Email is required" }, { status: 400 })
    }

    // Check inviter role
    const currentMember = await pool.query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, user.id]
    )
    if (currentMember.rows.length === 0 || (currentMember.rows[0]?.role !== "owner" && currentMember.rows[0]?.role !== "admin")) {
      return NextResponse.json({ detail: "Only Owners and Admins can invite members." }, { status: 403 })
    }

    // Look for user by email
    const targetUserRes = await pool.query('SELECT id, name, email FROM "user" WHERE email = $1', [email])
    if (targetUserRes.rows.length === 0) {
      return NextResponse.json(
        { detail: `User with email "${email}" not found. Please ask them to sign up first.` },
        { status: 404 }
      )
    }

    const targetUser = targetUserRes.rows[0]
    if (!targetUser) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 })
    }

    // Check if already in workspace
    const existingMember = await pool.query(
      "SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, targetUser.id]
    )
    if (existingMember.rows.length > 0) {
      return NextResponse.json({ detail: "User is already a member of this workspace." }, { status: 400 })
    }

    const memberId = randomUUID()
    await pool.query(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [memberId, workspaceId, targetUser.id, role]
    )

    return NextResponse.json({
      id: memberId,
      workspace_id: workspaceId,
      user_id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role,
      created_at: new Date().toISOString(),
    }, { status: 201 })
  } catch (err: any) {
    console.error("POST /api/v1/workspaces/[workspaceId]/members error:", err)
    return NextResponse.json({ detail: err.message || "Failed to invite member" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params
    const { searchParams } = new URL(req.url)
    const memberUserId = searchParams.get("userId")

    if (!memberUserId) {
      return NextResponse.json({ detail: "User ID is required" }, { status: 400 })
    }

    // Check caller permission
    const callerMember = await pool.query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, user.id]
    )
    if (callerMember.rows.length === 0) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const callerRole = callerMember.rows[0]?.role

    // Target member
    const targetMember = await pool.query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, memberUserId]
    )
    if (targetMember.rows.length === 0) {
      return NextResponse.json({ detail: "Member not found" }, { status: 404 })
    }

    if (targetMember.rows[0]?.role === "owner") {
      return NextResponse.json({ detail: "Cannot remove the workspace owner." }, { status: 400 })
    }

    // Only owner/admin or self can remove
    if (callerRole !== "owner" && callerRole !== "admin" && user.id !== memberUserId) {
      return NextResponse.json({ detail: "Forbidden. Insufficient permissions." }, { status: 403 })
    }

    await pool.query(
      "DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, memberUserId]
    )

    return NextResponse.json({ ok: true, message: "Member removed from workspace" })
  } catch (err: any) {
    console.error("DELETE /api/v1/workspaces/[workspaceId]/members error:", err)
    return NextResponse.json({ detail: err.message || "Failed to remove member" }, { status: 500 })
  }
}
