"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import {
  LogOut,
  Shield,
  ShieldCheck,
  User,
  ChevronsUpDown,
  Laptop,
  Check,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface UserProfileMenuProps {
  isCollapsed?: boolean
}

export function UserProfileMenu({ isCollapsed = false }: UserProfileMenuProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const userName = session?.user?.name || "Account"
  const userEmail = session?.user?.email || "Signed in"
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U"

  const handleSignOut = async () => {
    setLoggingOut(true)
    try {
      await authClient.signOut()
      router.push("/login")
    } catch (e) {
      console.error("Sign out failed:", e)
      router.push("/login")
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white p-2 text-left transition-all hover:bg-neutral-50 hover:border-neutral-300 shadow-xs",
          isCollapsed ? "justify-center p-2" : "justify-between"
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-neutral-900 truncate">
                {userName}
              </span>
              <span className="text-[10px] text-neutral-500 truncate">
                {userEmail}
              </span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <ChevronsUpDown className="size-3.5 shrink-0 text-neutral-400" />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 z-50 mb-1.5 w-full min-w-[240px] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95">
            {/* Header info */}
            <div className="px-2.5 py-2 border-b border-neutral-100">
              <p className="text-xs font-semibold text-neutral-900 truncate">{userName}</p>
              <p className="text-[11px] text-neutral-500 truncate">{userEmail}</p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200/60">
                <ShieldCheck className="size-3" />
                MFA Protected
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-0.5 pt-1.5">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              >
                <User className="size-3.5 text-neutral-500" />
                Account & Security
              </Link>
              <Link
                href="/settings#two-factor"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              >
                <Shield className="size-3.5 text-neutral-500" />
                Two-Factor (2FA) Setup
              </Link>
            </div>

            <div className="my-1 border-t border-neutral-100" />

            {/* Sign Out Button */}
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="size-3.5 text-rose-500" />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
