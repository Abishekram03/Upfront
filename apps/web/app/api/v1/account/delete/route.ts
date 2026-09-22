import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

export async function POST(req: Request) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const confirmation = (body.confirmation || "").trim()

    if (confirmation !== "DELETE" && confirmation !== user.email) {
      return NextResponse.json(
        { detail: "Please type 'DELETE' or your email address to confirm account deletion." },
        { status: 400 }
      )
    }

    // 1. Fetch all sites owned by user
    const userSites = await pool.query("SELECT id, domain FROM sites WHERE user_id = $1", [user.id])
    for (const site of userSites.rows) {
      await pool.query("DELETE FROM pageviews WHERE site_id = $1", [site.id])
      await pool.query("DELETE FROM sessions WHERE site_id = $1", [site.id])
      await pool.query("DELETE FROM consent_receipts WHERE domain = $1", [site.domain])
      await pool.query("DELETE FROM consent_configs WHERE domain = $1", [site.domain])
      await pool.query("DELETE FROM discovered_cookies WHERE domain = $1", [site.domain])
      await pool.query("DELETE FROM sites WHERE id = $1", [site.id])
    }

    // 2. Fetch all workspaces owned by user
    const userWorkspaces = await pool.query("SELECT id FROM workspaces WHERE owner_id = $1", [user.id])
    for (const ws of userWorkspaces.rows) {
      // Delete any remaining sites in this workspace
      const wsSites = await pool.query("SELECT id, domain FROM sites WHERE workspace_id = $1", [ws.id])
      for (const site of wsSites.rows) {
        await pool.query("DELETE FROM pageviews WHERE site_id = $1", [site.id])
        await pool.query("DELETE FROM sessions WHERE site_id = $1", [site.id])
        await pool.query("DELETE FROM consent_receipts WHERE domain = $1", [site.domain])
        await pool.query("DELETE FROM consent_configs WHERE domain = $1", [site.domain])
        await pool.query("DELETE FROM discovered_cookies WHERE domain = $1", [site.domain])
        await pool.query("DELETE FROM sites WHERE id = $1", [site.id])
      }
      await pool.query("DELETE FROM workspace_members WHERE workspace_id = $1", [ws.id])
      await pool.query("DELETE FROM workspaces WHERE id = $1", [ws.id])
    }

    // 3. Remove user from any other workspaces they were a member of
    await pool.query("DELETE FROM workspace_members WHERE user_id = $1", [user.id])

    // 4. Delete Auth records
    await pool.query('DELETE FROM "twoFactor" WHERE "userId" = $1', [user.id])
    await pool.query('DELETE FROM "session" WHERE "userId" = $1', [user.id])
    await pool.query('DELETE FROM "account" WHERE "userId" = $1', [user.id])
    await pool.query('DELETE FROM "user" WHERE "id" = $1', [user.id])

    return NextResponse.json({ ok: true, message: "Account deleted permanently" })
  } catch (err: any) {
    console.error("POST /api/v1/account/delete error:", err)
    return NextResponse.json({ detail: err.message || "Failed to delete account" }, { status: 500 })
  }
}
