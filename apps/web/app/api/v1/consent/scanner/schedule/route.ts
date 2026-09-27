import { NextResponse } from "next/server"
import { ScheduleService } from "@/lib/scanner/scheduler"
import { sanitizeDomain } from "@/lib/scanner/ssrf-protection"
import { isValidTimezone, isValidTimeOfDay, calculateNextRun } from "@/lib/scanner/schedule-calculator"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain) {
      return NextResponse.json({ detail: "Domain parameter is required" }, { status: 400, headers: CORS_HEADERS })
    }

    const schedule = await ScheduleService.getScheduleByDomain(domain)
    return NextResponse.json({ schedule }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("GET /api/v1/consent/scanner/schedule error:", err)
    return NextResponse.json({ detail: err.message || "Failed to fetch schedule" }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const domain = sanitizeDomain(body.domain)

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    const frequency = body.frequency
    if (frequency !== "daily" && frequency !== "weekly" && frequency !== "monthly") {
      return NextResponse.json({ detail: "Frequency must be 'daily', 'weekly', or 'monthly'" }, { status: 400, headers: CORS_HEADERS })
    }

    const timezone = (body.timezone || "UTC").trim()
    if (!isValidTimezone(timezone)) {
      return NextResponse.json({ detail: `Invalid IANA timezone identifier: '${timezone}'` }, { status: 400, headers: CORS_HEADERS })
    }

    const timeOfDay = (body.timeOfDay || body.time_of_day || "09:00").trim()
    if (!isValidTimeOfDay(timeOfDay)) {
      return NextResponse.json({ detail: `Invalid time format '${timeOfDay}'. Expected 'HH:mm'.` }, { status: 400, headers: CORS_HEADERS })
    }

    if (frequency === "weekly") {
      const dayOfWeek = body.dayOfWeek !== undefined ? Number(body.dayOfWeek) : Number(body.day_of_week)
      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        return NextResponse.json({ detail: "Weekly schedule requires dayOfWeek (1=Monday to 7=Sunday)" }, { status: 400, headers: CORS_HEADERS })
      }
    }

    if (frequency === "monthly") {
      const dayOfMonth = body.dayOfMonth !== undefined ? Number(body.dayOfMonth) : Number(body.day_of_month)
      if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
        return NextResponse.json({ detail: "Monthly schedule requires dayOfMonth (1 to 31)" }, { status: 400, headers: CORS_HEADERS })
      }
    }

    const schedule = await ScheduleService.upsertSchedule({
      domain,
      workspaceId: body.workspaceId || body.workspace_id,
      siteId: body.siteId || body.site_id,
      enabled: body.enabled !== false,
      frequency,
      timeOfDay,
      timezone,
      dayOfWeek: body.dayOfWeek ?? body.day_of_week,
      dayOfMonth: body.dayOfMonth ?? body.day_of_month,
    })

    return NextResponse.json({ success: true, schedule }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("POST /api/v1/consent/scanner/schedule error:", err)
    return NextResponse.json({ detail: err.message || "Failed to save schedule" }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const domain = sanitizeDomain(body.domain)

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    if (typeof body.enabled === "boolean") {
      const updated = await ScheduleService.setScheduleEnabled(domain, body.enabled)
      return NextResponse.json({ success: true, schedule: updated }, { headers: CORS_HEADERS })
    }

    // Full upsert if other fields provided
    const existing = await ScheduleService.getScheduleByDomain(domain)
    if (!existing) {
      return NextResponse.json({ detail: "Schedule not found" }, { status: 404, headers: CORS_HEADERS })
    }

    const updated = await ScheduleService.upsertSchedule({
      domain,
      workspaceId: body.workspaceId || body.workspace_id || existing.workspace_id,
      siteId: body.siteId || body.site_id || existing.site_id,
      enabled: body.enabled !== undefined ? body.enabled : existing.enabled,
      frequency: body.frequency || existing.frequency,
      timeOfDay: body.timeOfDay || body.time_of_day || existing.time_of_day,
      timezone: body.timezone || existing.timezone,
      dayOfWeek: body.dayOfWeek ?? body.day_of_week ?? existing.day_of_week,
      dayOfMonth: body.dayOfMonth ?? body.day_of_month ?? existing.day_of_month,
    })

    return NextResponse.json({ success: true, schedule: updated }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("PATCH /api/v1/consent/scanner/schedule error:", err)
    return NextResponse.json({ detail: err.message || "Failed to update schedule" }, { status: 500, headers: CORS_HEADERS })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = sanitizeDomain(searchParams.get("domain"))

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required" }, { status: 400, headers: CORS_HEADERS })
    }

    const deleted = await ScheduleService.deleteSchedule(domain)
    return NextResponse.json({ success: true, deleted }, { headers: CORS_HEADERS })
  } catch (err: any) {
    console.error("DELETE /api/v1/consent/scanner/schedule error:", err)
    return NextResponse.json({ detail: err.message || "Failed to delete schedule" }, { status: 500, headers: CORS_HEADERS })
  }
}
