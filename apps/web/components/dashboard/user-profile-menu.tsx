"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import {
  Shield,
  User,
  Globe,
  Star,
  ExternalLink,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface UserProfileMenuProps {
  isCollapsed?: boolean
}

export function UserProfileMenu({ isCollapsed = false }: UserProfileMenuProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const userName = session?.user?.name || "Admin"
  const userEmail = session?.user?.email || "admin@upfront.local"
  const initials = typeof userName === "string"
    ? userName
        .split(" ")
        .map((n: string) => n[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "A"

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
          <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95">
            {/* Header info */}
            <div className="px-2.5 py-2 border-b border-slate-100">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                  Apache 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                Open Source Edition
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
                Profile & System
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
                href="/settings?tab=sites"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Globe className="size-3.5 text-slate-400" />
                Sites & Domains
              </Link>
            </div>

            <div className="my-1 border-t border-slate-100" />

            {/* GitHub Link */}
            <a
              href="https://github.com/Abishekram03/usrly"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <Star className="size-3.5 fill-amber-400 text-amber-500" />
                Star on GitHub
              </span>
              <ExternalLink className="size-3 text-slate-400" />
            </a>
          </div>
        </>
      )}
    </div>
  )
}
