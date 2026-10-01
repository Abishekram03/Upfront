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
import { NotificationBell } from "./notification-bell"

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
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-md">
      {/* Left side: Mobile Toggle & Domain Switcher */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex size-8 items-center justify-center rounded-[4px] border border-neutral-200 text-neutral-600 hover:bg-neutral-100 md:hidden"
          >
            <Menu className="size-4" />
          </button>
        )}

        {/* Domain Switcher Pill / Skeleton / Empty */}
        {isLoadingSites ? (
          <div className="h-8 w-36 bg-neutral-100 rounded-[4px] animate-pulse border border-neutral-200" />
        ) : sites.length === 0 ? (
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <Plus className="size-3.5 text-[#1868db]" />
            <span>Add Website</span>
          </Link>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setDomainDropdown(!domainDropdown)}
              className="flex items-center gap-2 rounded-[4px] border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors shadow-2xs"
            >
              <Globe className="size-3.5 text-[#1868db]" />
              <span>{activeDomain || sites[0]?.domain || "Select Site"}</span>
              <ChevronDown className="size-3 text-neutral-400" />
            </button>

            {domainDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDomainDropdown(false)}
                />
                <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-[4px] border border-neutral-200 bg-white p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Your Monitored Sites
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
                              : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                          )}
                        >
                          <span className="truncate">{s.domain}</span>
                          {isSelected && (
                            <span className="size-1.5 rounded-full bg-[#1868db]" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <div className="my-1 border-t border-neutral-100" />
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

      {/* Right side Actions */}
      <div className="flex items-center gap-3">
        <NotificationBell />
      </div>
    </header>
  )
}
