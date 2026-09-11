import { auth, initAuthDatabase } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const authHandlers = toNextJsHandler(auth)

export async function GET(req: Request) {
  await initAuthDatabase()
  return authHandlers.GET(req)
}

export async function POST(req: Request) {
  await initAuthDatabase()
  return authHandlers.POST(req)
}
