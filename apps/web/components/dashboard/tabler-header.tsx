"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Code,
  Globe,
  ChevronDown,
  Plus,
  Menu,
  X,
  BarChart3,
  ShieldCheck,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"
import { Site } from "@/lib/api"
import { ToolType, tools } from "./tool-switcher"
import { UserProfileMenu } from "./user-profile-menu"

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
  const [domainDropdown, setDomainDropdown] = useState(false)
  const [toolDropdown, setToolDropdown] = useState(false)

  const currentTool = tools.find((t) => t.id === activeTool) ?? tools[0] ?? {
    id: "analytics" as const,
    name: "Web Analytics",
    shortName: "Analytics",
    icon: BarChart3,
    description: "Cookieless Traffic & Events",
    badge: "Active",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  }
  const ToolIcon = currentTool.icon

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* LEFT: Logo + Tool Switcher + Domain Picker */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={onToggleMobile}
              className="flex size-9 items-center justify-center rounded-[4px] border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-[family-name:var(--font-ojuju)] text-2xl font-[800] tracking-tight text-slate-900 group-hover:text-[#1868db] transition-colors">
                usrly
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 rounded-[4px] px-1.5 py-0.5 border border-slate-200">
                v1.0
              </span>
            </Link>

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

            {/* Tool Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setToolDropdown(!toolDropdown)}
                className="flex items-center gap-2 rounded-[4px] border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                <div className="flex size-5 items-center justify-center rounded-[3px] bg-[#1868db] text-white">
                  <ToolIcon className="size-3" />
                </div>
                <span className="hidden md:inline">{currentTool.name}</span>
                <span className="md:hidden">{currentTool.shortName}</span>
                <ChevronsUpDown className="size-3 text-slate-400" />
              </button>

              {toolDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setToolDropdown(false)}
                  />
                  <div className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-[4px] border border-slate-200 bg-white p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Platform Tool
                    </div>
                    <div className="space-y-1 pt-1">
                      {tools.map((t) => {
                        const Icon = t.icon
                        const isSelected = t.id === activeTool
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              onSelectTool(t.id)
                              setToolDropdown(false)
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-[4px] p-2 text-xs text-left transition-all",
                              isSelected
                                ? "bg-blue-50 text-[#1868db]"
                                : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "flex size-6 items-center justify-center rounded-[3px]",
                                  isSelected
                                    ? "bg-[#1868db] text-white"
                                    : "bg-slate-100 text-slate-600"
                                )}
                              >
                                <Icon className="size-3.5" />
                              </div>
                              <div>
                                <div className="font-bold">{t.name}</div>
                                <div className="text-[10px] text-slate-400">{t.description}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="size-3.5 text-[#1868db]" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Domain Picker */}
            {isLoadingSites ? (
              <div className="h-8 w-32 bg-slate-100 rounded-[4px] animate-pulse border border-slate-200 hidden sm:block" />
            ) : sites.length === 0 ? (
              <Link
                href="/settings"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Plus className="size-3 text-[#1868db]" />
                <span>Add Website</span>
              </Link>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDomainDropdown(!domainDropdown)}
                  className="flex items-center gap-2 rounded-[4px] border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <Globe className="size-3.5 text-[#1868db]" />
                  <span className="truncate max-w-[120px] sm:max-w-[160px]">
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
                    <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-[4px] border border-slate-200 bg-white p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                                "flex w-full items-center justify-between rounded-[4px] px-2.5 py-1.5 text-xs text-left transition-colors",
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
                        className="flex w-full items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-xs font-medium text-[#1868db] hover:bg-blue-50 transition-colors"
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

          {/* RIGHT: Realtime + Install CTA + Profile Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Realtime Active Indicator */}
            {activeDomain && (
              <div className="hidden lg:flex items-center gap-2 rounded-[4px] border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 font-medium">
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
                className="h-8 gap-1.5 bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold rounded-[4px] px-3 shadow-xs"
              >
                <Code className="size-3.5" />
                <span className="hidden sm:inline">Install Script</span>
              </Button>
            )}

            {/* User Profile */}
            <div className="w-36 sm:w-44">
              <UserProfileMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
