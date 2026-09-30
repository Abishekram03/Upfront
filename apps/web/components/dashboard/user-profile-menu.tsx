"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useEntitlements } from "@/lib/entitlements-context"
import {
  LogOut,
  Shield,
  ShieldCheck,
  User,
  ChevronsUpDown,
  Crown,
  Zap,
  Sparkles,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface UserProfileMenuProps {
  isCollapsed?: boolean
}

export function UserProfileMenu({ isCollapsed = false }: UserProfileMenuProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { plan, openUpgradeModal } = useEntitlements()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const userName = session?.user?.name || "Account"
  const userEmail = session?.user?.email || "Signed in"
  const initials = typeof session?.user?.name === "string"
    ? (session.user.name as string)
        .split(" ")
        .map((n: string) => n[0] ?? "")
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex size-8 items-center justify-center rounded-full bg-[#1868db] text-white text-xs font-bold shadow-2xs hover:opacity-90 ring-2 ring-transparent hover:ring-[#1868db]/30 transition-all cursor-pointer focus:outline-hidden",
          open && "ring-[#1868db]/50 opacity-95"
        )}
        aria-expanded={open}
        aria-label="User account menu"
        title={userName}
      >
        {initials}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Opens downward, aligned to the right edge */}
          <div className="absolute top-full right-0 z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95">
            {/* Header info */}
            <div className="px-2.5 py-2 border-b border-slate-100">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                {plan === "business" ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    <Crown className="size-2.5 fill-amber-500 text-amber-600" /> Business
                  </span>
                ) : plan === "growth" ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    <Zap className="size-2.5 fill-blue-500 text-blue-600" /> Growth
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      openUpgradeModal("growth")
                    }}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-blue-600 cursor-pointer"
                  >
                    <Sparkles className="size-2.5" /> Free (Upgrade)
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                <ShieldCheck className="size-3" />
                MFA Protected
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-0.5 pt-1.5">
              <Link
                href="/settings?tab=profile"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <User className="size-3.5 text-slate-400" />
                Profile & Security
              </Link>
              <Link
                href="/settings?tab=workspace"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Shield className="size-3.5 text-slate-400" />
                Workspace & Team
              </Link>
              <Link
                href="/settings?tab=billing"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <ChevronsUpDown className="size-3.5 text-slate-400" />
                Billing & Subscription
              </Link>
            </div>

            <div className="my-1 border-t border-slate-100" />

            {/* Sign Out Button */}
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
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

