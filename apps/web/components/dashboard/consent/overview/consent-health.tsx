"use client"

import Link from "next/link"
import { CheckCircle2, AlertTriangle, XCircle, Activity, Radar, ArrowRight, HelpCircle } from "lucide-react"
import { ConsentConfig, ConsentStatsSummary, ScannerResponse } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ConsentHealthProps {
  config: ConsentConfig | null
  stats: ConsentStatsSummary | null
  scanner: ScannerResponse | null
  isLoading: boolean
}

export function ConsentHealth({ config, stats, scanner, isLoading }: ConsentHealthProps) {
  const isConnected = stats?.is_connected ?? (stats?.total_receipts ? stats.total_receipts > 0 : false)
  const isBannerLive = config?.is_enabled ?? false
  const totalDecisions = stats?.total_decisions ?? stats?.total_receipts ?? 0
  
  const totalCookies = scanner?.cookies?.length ?? scanner?.total_cookies ?? 0
  const leaksCount = scanner?.pre_consent_leaks?.length ?? 0
  const latestScan = scanner?.latest_scan

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-3 animate-pulse">
        <div className="h-4 w-36 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded border border-slate-200" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Activity className="size-4 text-[#1868db]" />
          <h2 className="text-sm font-bold text-slate-900">Website & CMP Health</h2>
          <div className="relative group cursor-pointer inline-flex items-center">
            <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
            <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-72 p-2.5 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
              Real-time operational health checks verifying tag connectivity, banner runtime state, and scanner privacy leak findings.
            </div>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          System Operational
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Check 1: Tag Integration Status */}
        <div className="p-3.5 rounded-[6px] border border-slate-200 bg-slate-50/70 flex items-start gap-3">
          <div className="mt-0.5">
            {isConnected ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-4 text-amber-500" />
            )}
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Script Integration</span>
              <span className={cn("text-[10px] font-bold px-1.5 py-0.2 rounded", isConnected ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                {isConnected ? "Connected" : "Pending Activity"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isConnected
                ? "CMP script is actively communicating and recording visitor events."
                : "Awaiting first visitor session after installing the script tag."}
            </p>
          </div>
        </div>

        {/* Check 2: Banner Runtime Status */}
        <div className="p-3.5 rounded-[6px] border border-slate-200 bg-slate-50/70 flex items-start gap-3">
          <div className="mt-0.5">
            {isBannerLive ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <XCircle className="size-4 text-slate-400" />
            )}
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Banner Runtime</span>
              <span className={cn("text-[10px] font-bold px-1.5 py-0.2 rounded", isBannerLive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700")}>
                {isBannerLive ? "Live" : "Disabled"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isBannerLive
                ? `Published configuration v${config?.consent_version || "1.0"} active on site.`
                : "Consent banner is currently paused in the master toggle."}
            </p>
          </div>
        </div>

        {/* Check 3: Scanner & Privacy Leaks */}
        <div className="p-3.5 rounded-[6px] border border-slate-200 bg-slate-50/70 flex items-start gap-3">
          <div className="mt-0.5">
            {leaksCount > 0 ? (
              <AlertTriangle className="size-4 text-rose-500" />
            ) : totalCookies > 0 ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <Radar className="size-4 text-slate-400" />
            )}
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Tracker Health</span>
              <Link href="/consent/scanner" className="text-[10px] text-[#1868db] hover:underline flex items-center gap-0.5 font-semibold">
                Scanner <ArrowRight className="size-2.5" />
              </Link>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {leaksCount > 0 ? (
                <span className="text-rose-600 font-semibold">{leaksCount} pre-consent leaks detected.</span>
              ) : totalCookies > 0 ? (
                <span>{totalCookies} cookies classified in inventory.</span>
              ) : (
                <span>No scan completed yet. Run audit scan in Scanner.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
