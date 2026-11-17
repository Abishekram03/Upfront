import { NextResponse } from "next/server"
import { getWorkspaceEntitlements } from "@/lib/billing/entitlements"

/**
 * GET /api/v1/billing/entitlements
 * UpFront Open Source Edition: Always returns full unlimited capabilities.
 */
export async function GET() {
  const entitlements = await getWorkspaceEntitlements("ws_default")
  return NextResponse.json({
    entitlements,
    usage: {
      pageviewsThisMonth: 0,
      pageviewLimit: 1000000000,
      pageviewPercent: 0,
      sitesCount: 0,
      activeScansCount: 0,
    },
  })
}
