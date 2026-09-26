import { auth, initAuthDatabase } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    await initAuthDatabase()
    return await auth.handler(req)
  } catch (err: any) {
    console.error("[Auth GET Error]:", err)
    return NextResponse.json({ error: err.message || "Auth error", detail: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await initAuthDatabase()
    return await auth.handler(req)
  } catch (err: any) {
    console.error("[Auth POST Error]:", err)
    return NextResponse.json({ error: err.message || "Auth error", detail: String(err) }, { status: 500 })
  }
}
