import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "No commercial subscription to cancel in the open source edition.",
  })
}
