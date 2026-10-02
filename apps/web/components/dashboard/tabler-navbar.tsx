"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  ShieldCheck,
  Settings,
  Palette,
  FileCode,
  FileCheck,
  FileText,
  Cookie,
  Sliders,
  Activity,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { ToolType } from "./tool-switcher"
import { useEntitlements } from "@/lib/entitlements-context"

interface NavItem {
  title: string
  href: string
  icon: any
  badge?: string
}

interface TablerNavbarProps {
  activeTool: ToolType
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function TablerNavbar({
  activeTool,
  isMobileOpen = false,
  onCloseMobile,
}: TablerNavbarProps) {
  const pathname = usePathname()
  const { usage, entitlements, plan } = useEntitlements()

  const analyticsNavItems: NavItem[] = [
    {
      title: "Analytics Overview",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Site Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  const consentNavItems: NavItem[] = [
    {
      title: "Overview",
      href: "/consent",
      icon: ShieldCheck,
    },
    {
      title: "Banner Studio",
      href: "/consent/studio",
      icon: Palette,
    },
    {
      title: "Cookie Manager",
      href: "/consent/scanner",
      icon: Cookie,
    },
    {
      title: "Legal Policies",
      href: "/consent/policy",
      icon: FileText,
    },
    {
      title: "Script Rules",
      href: "/consent/rules",
      icon: FileCode,
    },
    {
      title: "Consent Logs",
      href: "/consent/logs",
      icon: FileCheck,
    },
  ]

  const navItems = activeTool === "analytics" ? analyticsNavItems : consentNavItems

  const checkIsActive = (itemHref: string) => {
    if (pathname === itemHref) return true
    if (pathname === "/" && itemHref === "/analytics") return true
    if (
      itemHref !== "/consent" &&
      itemHref !== "/analytics" &&
      itemHref !== "/policy" &&
      pathname.startsWith(itemHref)
    )
      return true
    return false
  }

  const currentUsage = usage?.pageviewsThisMonth ?? 0
  const maxQuota = usage?.pageviewLimit ?? entitlements?.limits.monthlyPageviews ?? (plan === "business" ? 1000000 : plan === "growth" ? 250000 : 50000)
  const usagePercent = usage?.pageviewPercent ?? Math.min(100, Math.round((currentUsage / maxQuota) * 100))

  return (
    <div
      className={cn(
        "w-full border-b border-slate-200 bg-white transition-all",
        isMobileOpen ? "block" : "hidden md:block"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <nav className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 -mb-[1px] py-2 md:py-0 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = checkIsActive(item.href)

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2.5 text-xs font-semibold transition-all whitespace-nowrap border-b-2 rounded-t-[4px]",
                    isActive
                      ? "border-[#1868db] text-[#1868db] bg-blue-50/50"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50/70"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive ? "text-[#1868db]" : "text-slate-400 group-hover:text-slate-700"
                    )}
                  />
                  <span>{item.title}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.2 rounded-[4px] border",
                        isActive
                          ? "bg-[#1868db] text-white border-[#1868db]"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right end corner: Usage Indicator (Usage x / x) */}
          <div className="hidden sm:flex items-center gap-2 py-1.5 shrink-0">
            <Link
              href="/settings?tab=billing"
              className="group flex items-center gap-2.5 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-200 transition-all text-xs"
              title={`Workspace Traffic Usage: ${currentUsage.toLocaleString()} / ${maxQuota.toLocaleString()} monthly pageviews (${usagePercent}% used)`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#1868db] transition-colors">
                  Usage
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-700 group-hover:text-[#1868db] transition-colors">
                  {currentUsage.toLocaleString()} / {maxQuota.toLocaleString()}
                </span>
              </div>

              {/* Mini visual usage bar */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    usagePercent >= 90
                      ? "bg-rose-500"
                      : usagePercent >= 75
                      ? "bg-amber-500"
                      : "bg-[#1868db]"
                  )}
                  style={{ width: `${Math.min(100, Math.max(6, usagePercent))}%` }}
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
