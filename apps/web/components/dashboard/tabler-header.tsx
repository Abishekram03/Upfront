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
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"
import { Site, createSite } from "@/lib/api"
import { ToolType, tools } from "./tool-switcher"
import { UserProfileMenu } from "./user-profile-menu"
import { NotificationBell } from "./notification-bell"
import { useWorkspace } from "@/lib/workspace-context"
import { useDomain } from "@/lib/domain-context"

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
  const { activeWorkspace } = useWorkspace()
  const { refreshSites } = useDomain()
  const [domainDropdown, setDomainDropdown] = useState(false)
  const [appLauncherDropdown, setAppLauncherDropdown] = useState(false)

  // Add Website Modal State
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false)
  const [newDomain, setNewDomain] = useState("")
  const [newTimezone, setNewTimezone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC"
  )
  const [isCreatingSite, setIsCreatingSite] = useState(false)
  const [addSiteError, setAddSiteError] = useState<string | null>(null)

  const handleAddSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let clean = newDomain.trim().toLowerCase()
    clean = clean.replace(/^(https?:\/\/)/i, "")
    clean = clean.split("/")[0] || ""
    clean = clean.split(":")[0] || ""
    clean = clean.trim()

    if (!clean) {
      setAddSiteError("Please enter a valid domain name (e.g. yourwebsite.com)")
      return
    }

    try {
      setIsCreatingSite(true)
      setAddSiteError(null)
      const created = await createSite(clean, newTimezone, activeWorkspace?.id)
      await refreshSites()
      onChangeDomain?.(created.domain)
      setIsAddSiteOpen(false)
      setNewDomain("")
      setDomainDropdown(false)
      onOpenSnippetModal?.()
    } catch (err: any) {
      setAddSiteError(err.message || "Failed to add website. Please try again.")
    } finally {
      setIsCreatingSite(false)
    }
  }

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
              <button
                type="button"
                onClick={() => setIsAddSiteOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Plus className="size-3 text-[#1868db]" />
                <span>Add Website</span>
              </button>
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
                      <button
                        type="button"
                        onClick={() => {
                          setDomainDropdown(false)
                          setIsAddSiteOpen(true)
                        }}
                        className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1868db] hover:bg-blue-50 transition-colors cursor-pointer text-left"
                      >
                        <Plus className="size-3.5" />
                        <span>Add New Website</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Notifications + App Launcher (app.svg) + Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Notification Bell Dropdown */}
            <NotificationBell />

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

      {/* Add Website Modal Dialog */}
      {isAddSiteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div
            className="fixed inset-0"
            onClick={() => !isCreatingSite && setIsAddSiteOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#1868db]">
                  <Globe className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Website</h3>
                  <p className="text-xs text-slate-500">Track analytics, manage consent, and run cookie scans.</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isCreatingSite}
                onClick={() => setIsAddSiteOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddSiteSubmit} className="space-y-4 pt-4">
              {addSiteError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{addSiteError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Domain or Subdomain</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400 select-none">https://</span>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="example.com"
                    className="w-full pl-18 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Do not include paths or protocols (e.g. mycompany.com or app.mycompany.com).</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Reporting Timezone</label>
                <select
                  value={newTimezone}
                  onChange={(e) => setNewTimezone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Europe/London">London (GMT / BST)</option>
                  <option value="Europe/Paris">Paris / Berlin (CET / CEST)</option>
                  <option value="America/New_York">New York (Eastern Time)</option>
                  <option value="America/Chicago">Chicago (Central Time)</option>
                  <option value="America/Los_Angeles">Los Angeles (Pacific Time)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Singapore">Singapore / Hong Kong (SGT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCreatingSite}
                  onClick={() => setIsAddSiteOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreatingSite || !newDomain.trim()}
                  className="text-xs bg-[#1868db] hover:bg-[#1557b0] text-white flex items-center gap-1.5 cursor-pointer font-bold shadow-xs"
                >
                  {isCreatingSite ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Adding Site...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      <span>Add Website</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}

