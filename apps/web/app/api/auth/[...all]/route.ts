import { NextResponse } from "next/server"
import { DEFAULT_USER } from "@/lib/auth-server"

export async function GET() {
  return NextResponse.json({
    user: DEFAULT_USER,
    session: {
      id: "sess_local",
      userId: DEFAULT_USER.id,
    },
  })
}

export async function POST() {
  return NextResponse.json({
    user: DEFAULT_USER,
    session: {
      id: "sess_local",
      userId: DEFAULT_USER.id,
    },
  })
}
