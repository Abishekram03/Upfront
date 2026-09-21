import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const result: any = {
    status: "checking",
    database: "unknown",
    env: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasBetterAuthSecret: Boolean(process.env.BETTER_AUTH_SECRET),
      hasBetterAuthUrl: Boolean(process.env.BETTER_AUTH_URL),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "not set",
    },
    tables: {},
  }

  try {
    await ensureTables()
    const client = await pool.connect()
    try {
      const dbRes = await client.query("SELECT current_database(), current_user, inet_server_addr(), version()")
      result.database = "connected"
      result.dbInfo = dbRes.rows[0] || null

      // Check tables
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user', 'session', 'account', 'verification', 'twoFactor', 'sites', 'sessions', 'pageviews')
      `)
      result.tables = tableCheck.rows.map(r => r.table_name)
      result.status = "healthy"
      return NextResponse.json(result, { status: 200 })
    } finally {
      client.release()
    }
  } catch (err: any) {
    result.status = "error"
    result.database = "failed"
    result.error = {
      message: err.message,
      code: err.code,
      stack: err.stack,
    }
    return NextResponse.json(result, { status: 500 })
  }
}
