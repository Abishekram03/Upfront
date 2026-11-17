import { NextResponse } from "next/server"

/**
 * GET /api/v1/billing/invoices
 * In open source edition, there are no commercial invoices.
 */
export async function GET() {
  return NextResponse.json({
    invoices: [],
    hasPaddleCustomer: false,
    paddleCustomerId: null,
  })
}
