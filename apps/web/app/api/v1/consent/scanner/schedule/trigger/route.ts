import { NextResponse } from "next/server"
import { ScheduleService } from "@/lib/scanner/scheduler"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

/**
 * Trigger endpoint to process due schedules.
 * Can be called by external cron or Vercel cron.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const cronSecret = process.env.CRON_SECRET || ""

    // Optional secret verification if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !req.headers.get("x-vercel-cron")) {
      // Check query param secret fallback
      const { searchParams } = new URL(req.url)
      if (searchParams.get("secret") !== cronSecret) {
        return NextResponse.json({ detail: "Unauthorized cron trigger request" }, { status: 401, headers: CORS_HEADERS })
      }
    }

    const { searchParams } = new URL(req.url)
    const executeInline = searchParams.get("inline") !== "false"
    const maxJobs = parseInt(searchParams.get("limit") || "10", 10)

    const result = await ScheduleService.processDueSchedules({
      maxJobs,
      executeInline,
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("POST /api/v1/consent/scanner/schedule/trigger error:", err)
    return NextResponse.json({ detail: err.message || "Failed to process due schedules" }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function GET(req: Request) {
  // Support GET invocation from Vercel Crons
  return POST(req)
}
