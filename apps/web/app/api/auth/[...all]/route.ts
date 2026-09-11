import { auth, initAuthDatabase } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { NextResponse } from "next/server"

const authHandlers = toNextJsHandler(auth)

export async function GET(req: Request) {
  try {
    await initAuthDatabase()
    return await authHandlers.GET(req)
  } catch (err: any) {
    console.error("[Auth GET Error]:", err)
    return NextResponse.json({ error: err.message || "Auth error", detail: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await initAuthDatabase()
    return await authHandlers.POST(req)
  } catch (err: any) {
    console.error("[Auth POST Error]:", err)
    return NextResponse.json({ error: err.message || "Auth error", detail: String(err) }, { status: 500 })
  }
}
