"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ToolSwitcher, ToolType } from "./tool-switcher"
import { UserProfileMenu } from "./user-profile-menu"
import {
  BarChart3,
  ShieldCheck,
  Settings,
  Palette,
  Sliders,
  FileCode,
  FileCheck,
  FileText,
  ExternalLink,
  Cookie,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: any
  badge?: string
}

interface DashboardSidebarProps {
  activeTool: ToolType
  onSelectTool: (tool: ToolType) => void
  isCollapsed?: boolean
  setIsCollapsed?: (val: boolean) => void
}

export function DashboardSidebar({
  activeTool,
  onSelectTool,
  isCollapsed = false,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  const analyticsNavItems: NavItem[] = [
    {
      title: "Analytics",
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
      badge: "Live",
    },
    {
      title: "Cookie Scanner",
      href: "/consent/scanner",
      icon: Cookie,
      badge: "Audit",
    },
    {
      title: "Cookie Policy",
      href: "/consent/policy",
      icon: FileText,
    },
    {
      title: "Script Rules",
      href: "/consent/rules",
      icon: FileCode,
    },
    {
      title: "Audit Logs",
      href: "/consent/logs",
      icon: FileCheck,
    },
  ]

  const navItems = activeTool === "analytics" ? analyticsNavItems : consentNavItems

  const checkIsActive = (itemHref: string) => {
    if (pathname === itemHref) return true
    if (pathname === "/" && itemHref === "/analytics") return true
    return false
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col justify-between border-r border-neutral-200 bg-[#fafafa] transition-all duration-200 select-none",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top Section */}
      <div className="flex flex-col gap-4 p-4">
        {/* Logo — Ojuju Font, Weight 800 */}
        <div className="flex items-center justify-between px-1">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-[family-name:var(--font-ojuju)] text-3xl font-[800] tracking-tight text-neutral-900 group-hover:text-[#1868db] transition-colors">
              usrly
            </span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 bg-neutral-100 rounded-[4px] px-2 py-0.5 border border-neutral-200">
            v1.0
          </span>
        </div>

        {/* Tool Switcher */}
        <ToolSwitcher
          activeTool={activeTool}
          onSelectTool={onSelectTool}
          isCollapsed={isCollapsed}
        />

        {/* Navigation Group Header */}
        <div className="pt-2">
          {!isCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {activeTool === "analytics" ? "Web Analytics" : "Consent Management"}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = checkIsActive(item.href)

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-[#1868db] text-white shadow-xs"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={item.title}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive
                        ? "text-white"
                        : "text-neutral-400 group-hover:text-neutral-600"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.title}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className={cn(
                      "rounded-[3px] px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-neutral-200 p-4 space-y-3">
        {/* Syft Brand Attribution */}
        {!isCollapsed && (
          <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400">
            <span>By Syft Technologies</span>
            <span className="flex size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
          </div>
        )}

        {/* User Profile */}
        <UserProfileMenu isCollapsed={isCollapsed} />
      </div>
    </aside>
  )
}

