"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Code,
  Globe,
  ChevronDown,
  Plus,
  Menu,
  X,
  Check,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"
import { Site } from "@/lib/api"
import { ToolType, tools } from "./tool-switcher"
import { UserProfileMenu } from "./user-profile-menu"
import { useEntitlements } from "@/lib/entitlements-context"

interface TablerHeaderProps {
  activeTool: ToolType
  onSelectTool: (tool: ToolType) => void
  sites?: Site[]
  activeDomain?: string | null
  onChangeDomain?: (domain: string) => void
  onOpenSnippetModal?: () => void
  realtimeVisitors?: number | null
  isLoadingSites?: boolean
  isMobileOpen?: boolean
  onToggleMobile?: () => void
}

export function TablerHeader({
  activeTool,
  onSelectTool,
  sites = [],
  activeDomain = null,
  onChangeDomain,
  onOpenSnippetModal,
  realtimeVisitors = 0,
  isLoadingSites = false,
  isMobileOpen = false,
  onToggleMobile,
}: TablerHeaderProps) {
  const { plan, openUpgradeModal } = useEntitlements()
  const [domainDropdown, setDomainDropdown] = useState(false)
  const [appLauncherDropdown, setAppLauncherDropdown] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* LEFT: Mobile Toggle + Logo + Domain Picker */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={onToggleMobile}
              className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Image
                src="/UpFront-Logo-Blue-600.svg"
                alt="UpFront Logo"
                width={110}
                height={28}
                className="h-6 sm:h-7 w-auto object-contain"
                priority
              />
            </Link>

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

            {/* Domain Picker */}
            {isLoadingSites ? (
              <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse border border-slate-200 hidden sm:block" />
            ) : sites.length === 0 ? (
              <Link
                href="/settings"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Plus className="size-3 text-[#1868db]" />
                <span>Add Website</span>
              </Link>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDomainDropdown(!domainDropdown)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <Globe className="size-3.5 text-[#1868db]" />
                  <span className="truncate max-w-[130px] sm:max-w-[180px]">
                    {activeDomain || sites[0]?.domain || "Select Site"}
                  </span>
                  <ChevronDown className="size-3 text-slate-400" />
                </button>

                {domainDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDomainDropdown(false)}
                    />
                    <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Monitored Domains
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-0.5 pt-1">
                        {sites.map((s) => {
                          const isSelected = s.domain === activeDomain
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                onChangeDomain?.(s.domain)
                                setDomainDropdown(false)
                              }}
                              className={cn(
                                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition-colors",
                                isSelected
                                  ? "bg-blue-50 text-[#1868db] font-semibold"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              )}
                            >
                              <span className="truncate">{s.domain}</span>
                              {isSelected && <span className="size-1.5 rounded-full bg-[#1868db]" />}
                            </button>
                          )
                        })}
                      </div>
                      <div className="my-1 border-t border-slate-100" />
                      <Link
                        href="/settings"
                        onClick={() => setDomainDropdown(false)}
                        className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1868db] hover:bg-blue-50 transition-colors"
                      >
                        <Plus className="size-3.5" />
                        <span>Add New Website</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Realtime + Install CTA + App Launcher (app.svg) + Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Workspace Plan Tier Badge */}
            {plan === "business" ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                <Crown className="size-3.5 fill-amber-500 text-amber-600" />
                <span>Business</span>
              </span>
            ) : plan === "growth" ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                <Zap className="size-3.5 fill-blue-500 text-blue-600" />
                <span>Growth</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => openUpgradeModal("growth")}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
                title="Upgrade Workspace Plan"
              >
                <Sparkles className="size-3 text-blue-600" />
                <span>Free Plan &bull; <strong className="text-[#1868db]">Upgrade</strong></span>
              </button>
            )}

            {/* Realtime Active Indicator */}
            {activeDomain && (
              <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 font-medium">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span>
                  <strong className="text-slate-900">{realtimeVisitors}</strong> online
                </span>
              </div>
            )}

            {/* Install Script Modal CTA */}
            {onOpenSnippetModal && activeDomain && (
              <Button
                size="sm"
                onClick={onOpenSnippetModal}
                className="h-9 gap-1.5 bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold rounded-lg px-3 shadow-xs"
              >
                <Code className="size-3.5" />
                <span className="hidden sm:inline">Install Script</span>
              </Button>
            )}

            {/* App Launcher (app.svg) Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAppLauncherDropdown(!appLauncherDropdown)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg border transition-all shadow-2xs",
                  appLauncherDropdown
                    ? "border-[#1868db] bg-blue-50/70 text-[#1868db]"
                    : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600"
                )}
                title="Switch Product Suite"
                aria-label="App Switcher"
                aria-expanded={appLauncherDropdown}
              >
                <Image
                  src="/app.svg"
                  alt="App Launcher"
                  width={20}
                  height={20}
                  className="size-5 opacity-75 hover:opacity-100 transition-opacity invert-[30%]"
                />
              </button>

              {appLauncherDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAppLauncherDropdown(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in-0 zoom-in-95">
                    <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Product Suite
                      </span>
                      <span className="text-[10px] font-semibold text-[#1868db] bg-blue-50 px-1.5 py-0.5 rounded">
                        2 Apps
                      </span>
                    </div>
                    <div className="space-y-1">
                      {tools.map((t) => {
                        const Icon = t.icon
                        const isSelected = t.id === activeTool
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              onSelectTool(t.id)
                              setAppLauncherDropdown(false)
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-lg p-2 text-xs text-left transition-all",
                              isSelected
                                ? "bg-blue-50 text-[#1868db] font-semibold shadow-2xs"
                                : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-lg transition-colors",
                                  isSelected
                                    ? "bg-[#1868db] text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600"
                                )}
                              >
                                <Icon className="size-4" />
                              </div>
                              <div>
                                <div className="font-bold text-xs">{t.name}</div>
                                <div className="text-[10px] text-slate-400 font-normal line-clamp-1">
                                  {t.description}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="size-4 text-[#1868db] shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile */}
            <UserProfileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}

