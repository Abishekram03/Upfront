"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Code,
  Globe,
  ChevronDown,
  Plus,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"
import { Site } from "@/lib/api"

interface DashboardTopbarProps {
  onToggleSidebar?: () => void
  sites?: Site[]
  activeDomain?: string | null
  onChangeDomain?: (domain: string) => void
  onOpenSnippetModal?: () => void
  realtimeVisitors?: number | null
  isLoadingSites?: boolean
}

export function DashboardTopbar({
  onToggleSidebar,
  sites = [],
  activeDomain = null,
  onChangeDomain,
  onOpenSnippetModal,
  realtimeVisitors = 0,
  isLoadingSites = false,
}: DashboardTopbarProps) {
  const [domainDropdown, setDomainDropdown] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#e0ebf8] bg-white/95 px-4 backdrop-blur-md">
      {/* Left side: Mobile Toggle & Domain Switcher */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex size-8 items-center justify-center rounded-[4px] border border-[#e0ebf8] text-slate-600 hover:bg-[#eef5fc] md:hidden"
          >
            <Menu className="size-4" />
          </button>
        )}

        {/* Domain Switcher Pill / Skeleton / Empty */}
        {isLoadingSites ? (
          <div className="h-8 w-36 bg-[#eef5fc] rounded-[4px] animate-pulse border border-[#e0ebf8]" />
        ) : sites.length === 0 ? (
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-dashed border-[#1868db]/40 bg-[#eef5fc]/60 px-3 py-1.5 text-xs font-semibold text-[#1868db] hover:bg-[#eef5fc] transition-colors"
          >
            <Plus className="size-3.5 text-[#1868db]" />
            <span>Add Website</span>
          </Link>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setDomainDropdown(!domainDropdown)}
              className="flex items-center gap-2 rounded-[4px] border border-[#cbe0f8] bg-[#eef5fc] px-3 py-1.5 text-xs font-semibold text-[#1868db] hover:bg-[#e2eefb] transition-colors shadow-2xs"
            >
              <Globe className="size-3.5 text-[#1868db]" />
              <span>{activeDomain || sites[0]?.domain || "Select Site"}</span>
              <ChevronDown className="size-3 text-[#1868db]/70" />
            </button>

            {domainDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDomainDropdown(false)}
                />
                <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-[6px] border border-[#e0ebf8] bg-white p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Your Websites
                  </div>
                  {sites.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onChangeDomain?.(s.domain)
                        setDomainDropdown(false)
                      }}
                      className={cn(
                        "w-full flex items-center justify-between rounded-[4px] px-2.5 py-1.5 text-xs text-left transition-colors",
                        activeDomain === s.domain
                          ? "bg-[#eef5fc] text-[#1868db] font-bold"
                          : "text-slate-600 hover:bg-[#f8fbff] hover:text-[#1868db]"
                      )}
                    >
                      <span className="truncate">{s.domain}</span>
                      {activeDomain === s.domain && (
                        <span className="size-2 rounded-full bg-[#1868db] shrink-0" />
                      )}
                    </button>
                  ))}

                  <div className="my-1 border-t border-[#e0ebf8]" />

                  <Link
                    href="/settings"
                    onClick={() => setDomainDropdown(false)}
                    className="flex w-full items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-[#eef5fc] hover:text-[#1868db] transition-colors"
                  >
                    <Plus className="size-3 text-[#1868db]" />
                    <span>Manage Sites</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right side: Live Pulse, Snippet Modal trigger */}
      <div className="flex items-center gap-3">
        {/* Live Visitor Indicator */}
        {activeDomain && (
          <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-800">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>
              <strong className="font-bold text-emerald-900">{realtimeVisitors ?? 0}</strong> online now
            </span>
          </div>
        )}

        {/* Embed Snippet Button */}
        {activeDomain && onOpenSnippetModal && (
          <button
            type="button"
            onClick={onOpenSnippetModal}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#1868db] hover:bg-[#1559be] text-white px-3.5 py-1.5 rounded-[4px] shadow-xs transition-colors"
          >
            <Code className="size-3.5 text-white" />
            <span className="hidden sm:inline">Install Script</span>
          </button>
        )}
      </div>
    </header>
  )
}
