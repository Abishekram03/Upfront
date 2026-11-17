import { NextResponse } from "next/server"

/**
 * GET /api/v1/billing/subscription
 * Open Source Edition: Active open-source subscription state.
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    plan: "open_source",
    isPaid: true,
    userEmail: "admin@upfront.local",
    plans: {},
    addons: {},
  })
}
