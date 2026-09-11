import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    return session
  } catch (error) {
    console.error("[Better Auth] Failed to retrieve server session:", error)
    return null
  }
}

export async function getCurrentUser() {
  const session = await getServerSession()
  return session?.user || null
}
