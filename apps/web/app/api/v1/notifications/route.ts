import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { sanitizeDomain } from "@/lib/scanner/ssrf-protection"
import { randomUUID } from "node:crypto"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: Request) {
  try {
    await ensureTables()
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))
    const user = await getCurrentUser()
    const userId = user?.id || "anonymous"

    if (!domain) {
      return NextResponse.json({ readIds: [], clearedIds: [] }, { headers: CORS_HEADERS })
    }

    const res = await pool.query(
      `SELECT notification_id, is_read, is_cleared 
       FROM user_notification_states 
       WHERE (user_id = $1 OR user_id = 'global') AND domain = $2`,
      [userId, domain]
    )

    const readIds: string[] = []
    const clearedIds: string[] = []

    for (const row of res.rows) {
      if (row.is_cleared) {
        clearedIds.push(row.notification_id)
      } else if (row.is_read) {
        readIds.push(row.notification_id)
      }
    }

    return NextResponse.json({ readIds, clearedIds }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("GET /api/v1/notifications error:", err)
    return NextResponse.json({ readIds: [], clearedIds: [] }, { status: 200, headers: CORS_HEADERS })
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const user = await getCurrentUser()
    const userId = user?.id || "anonymous"
    const body = await req.json().catch(() => ({}))

    const domain = sanitizeDomain(body.domain)
    const action: "mark_read" | "clear" | "mark_all_read" | "clear_all" = body.action || "mark_read"
    const notificationIds: string[] = Array.isArray(body.notification_ids)
      ? body.notification_ids
      : body.notification_id
      ? [body.notification_id]
      : []

    if (!domain || notificationIds.length === 0) {
      return NextResponse.json({ ok: true, message: "No notifications to update" }, { headers: CORS_HEADERS })
    }

    const client = await pool.connect()
    let hasError = false
    try {
      await client.query("BEGIN")

      for (const notifId of notificationIds) {
        if (!notifId) continue
        const id = randomUUID()

        if (action === "clear" || action === "clear_all") {
          await client.query(
            `INSERT INTO user_notification_states (
               id, user_id, domain, notification_id, is_read, is_cleared, cleared_at, updated_at
             ) VALUES ($1, $2, $3, $4, TRUE, TRUE, NOW(), NOW())
             ON CONFLICT (user_id, domain, notification_id)
             DO UPDATE SET 
               is_read = TRUE,
               is_cleared = TRUE,
               cleared_at = NOW(),
               updated_at = NOW()`,
            [id, userId, domain, notifId]
          )
        } else {
          // mark_read
          await client.query(
            `INSERT INTO user_notification_states (
               id, user_id, domain, notification_id, is_read, is_cleared, read_at, updated_at
             ) VALUES ($1, $2, $3, $4, TRUE, FALSE, NOW(), NOW())
             ON CONFLICT (user_id, domain, notification_id)
             DO UPDATE SET 
               is_read = TRUE,
               read_at = NOW(),
               updated_at = NOW()`,
            [id, userId, domain, notifId]
          )
        }
      }

      await client.query("COMMIT")
    } catch (err) {
      hasError = true
      await client.query("ROLLBACK").catch(() => {})
      throw err
    } finally {
      client.release(hasError)
    }

    return NextResponse.json({ ok: true, updated: notificationIds.length }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("POST /api/v1/notifications error:", err)
    return NextResponse.json({ detail: err.message || "Failed to update notification state" }, { status: 500, headers: CORS_HEADERS })
  }
}
