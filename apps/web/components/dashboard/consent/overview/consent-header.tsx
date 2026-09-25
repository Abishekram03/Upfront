"use client"

import Link from "next/link"
import { RefreshCw, CheckCircle2, XCircle, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConsentConfig } from "@/lib/api"

interface ConsentHeaderProps {
  activeDomain: string
  config: ConsentConfig | null
  isLoading: boolean
  isToggling: boolean
  onToggleBanner: () => void
  onRefresh: () => void
}

export function ConsentHeader({
  activeDomain,
  config,
  isLoading,
  isToggling,
  onToggleBanner,
  onRefresh,
}: ConsentHeaderProps) {
  const isEnabled = config?.is_enabled ?? false
  const version = config?.consent_version || "1.0"
  
  // Format last published time
  const getFormattedDate = (dateStr?: string | null) => {
    if (!dateStr) return "Just now"
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return "Recently"
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Recently"
    }
  }

  const publishedTime = getFormattedDate(config?.updated_at || config?.created_at)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Consent Overview</h1>
          
          {/* Status Badge */}
          {config ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-white shadow-2xs">
              <span
                className={cn(
                  "size-2 rounded-full",
                  isEnabled ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                )}
              />
              <span className={isEnabled ? "text-emerald-700 font-bold" : "text-amber-700 font-medium"}>
                {isEnabled ? "Live" : "Disabled"}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-mono text-[11px]">v{version}</span>
            </div>
          ) : null}
        </div>

        <p className="text-xs text-slate-500">
          Domain: <strong className="text-slate-800 font-mono">{activeDomain || "No domain selected"}</strong>
          {config && (
            <span className="ml-2 text-slate-400">
              • Last published: <span className="text-slate-600 font-medium">{publishedTime}</span>
            </span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading || isToggling}
          title="Reload consent data"
          className="inline-flex items-center text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-[4px] px-3 py-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5 mr-1.5 text-[#1868db]", isLoading && "animate-spin")} />
          Refresh
        </button>

        {config && (
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            aria-label="Toggle Consent Banner Status"
            onClick={onToggleBanner}
            disabled={isToggling || !activeDomain}
            className={cn(
              "inline-flex items-center text-xs font-bold rounded-[4px] px-3.5 py-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50",
              isEnabled
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            )}
          >
            {isToggling ? (
              <>
                <RefreshCw className="size-3.5 mr-1.5 animate-spin" /> Updating...
              </>
            ) : isEnabled ? (
              <>
                <CheckCircle2 className="size-3.5 mr-1.5 text-white" /> Banner Active
              </>
            ) : (
              <>
                <XCircle className="size-3.5 mr-1.5 text-slate-500" /> Banner Disabled
              </>
            )}
          </button>
        )}

        <Link
          href="/consent/studio"
          className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-3.5 py-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Palette className="size-3.5" />
          Banner Studio
        </Link>
      </div>
    </div>
  )
}
