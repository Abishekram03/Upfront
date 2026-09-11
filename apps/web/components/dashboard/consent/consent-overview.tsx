"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  Palette,
  FileCode,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Sliders,
  Globe,
  SlidersHorizontal,
  Cookie,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@workspace/ui/lib/utils"
import { useDomain } from "@/lib/domain-context"
import { fetchConsentStats, fetchConsentConfig, saveConsentConfig, ConsentStatsSummary, ConsentConfig } from "@/lib/api"

export function ConsentOverview() {
  const { activeDomain, isLoadingSites, sites } = useDomain()

  const [stats, setStats] = useState<ConsentStatsSummary | null>(null)
  const [config, setConfig] = useState<ConsentConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  const loadData = async () => {
    if (!activeDomain) {
      setIsLoading(false)
      setStats(null)
      setConfig(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const [statsData, configData] = await Promise.all([
        fetchConsentStats(activeDomain),
        fetchConsentConfig(activeDomain),
      ])
      setStats(statsData)
      setConfig(configData)
    } catch (err: any) {
      console.error("Failed to load consent overview:", err)
      setError(err?.message || "Failed to load consent data.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeDomain])

  const handleToggleBanner = async () => {
    if (!config || !activeDomain) return
    setIsToggling(true)
    try {
      const updated = await saveConsentConfig({
        ...config,
        is_enabled: !config.is_enabled,
      })
      setConfig(updated)
    } catch (err: any) {
      alert(err?.message || "Failed to update banner status.")
    } finally {
      setIsToggling(false)
    }
  }

  // 1. EMPTY STATE: NO SITES
  if (!isLoadingSites && !activeDomain && sites.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-[4px] border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex max-w-sm flex-col items-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-[4px] bg-slate-100 text-[#1868db]">
              <Globe className="size-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Website Registered</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add your website to start customizing cookie banners, gating 3rd-party scripts, and capturing GDPR audit logs.
            </p>
            <Link
              href="/settings"
              className="mt-2 inline-flex items-center gap-1.5 rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 py-2.5 shadow-xs transition-colors"
            >
              Add Your First Website
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Top Banner Status Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Consent Management</h1>
            <span className="rounded-[4px] bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-700 border border-neutral-200">
              CookieYes Standard
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Privacy-first cookie banner studio, script auto-blocking, and proof-of-consent logs for <strong className="text-neutral-800">{activeDomain || "your site"}</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-[4px] px-3 py-1.5 shadow-2xs transition-colors"
          >
            <RefreshCw className={cn("size-3.5 mr-1.5 text-[#1868db]", isLoading && "animate-spin")} />
            Refresh
          </button>

          {config && (
            <button
              type="button"
              onClick={handleToggleBanner}
              disabled={isToggling}
              className={cn(
                "inline-flex items-center text-xs font-bold rounded-[4px] px-3.5 py-1.5 shadow-xs transition-all",
                config.is_enabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              )}
            >
              {config.is_enabled ? (
                <>
                  <CheckCircle2 className="size-3.5 mr-1.5" /> Banner Active
                </>
              ) : (
                <>
                  <XCircle className="size-3.5 mr-1.5" /> Banner Disabled
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/consent/studio"
          className="group block rounded-[4px] border border-slate-200 bg-white p-5 shadow-2xs hover:border-[#1868db] hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-[4px] bg-blue-50 text-[#1868db] group-hover:scale-105 transition-transform">
              <Palette className="size-5" />
            </div>
            <ArrowRight className="size-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1868db] transition-all" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Banner Studio</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Customize layout, colors, and live 5-category preferences modal preview.
          </p>
        </Link>

        <Link
          href="/consent/policy"
          className="group block rounded-[4px] border border-slate-200 bg-white p-5 shadow-2xs hover:border-[#1868db] hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-[4px] bg-blue-50 text-[#1868db] group-hover:scale-105 transition-transform">
              <FileCode className="size-5" />
            </div>
            <ArrowRight className="size-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1868db] transition-all" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Cookie Policy</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Generate and embed compliant cookie declaration tables for your website.
          </p>
        </Link>

        <Link
          href="/consent/rules"
          className="group block rounded-[4px] border border-slate-200 bg-white p-5 shadow-2xs hover:border-[#1868db] hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-[4px] bg-blue-50 text-[#1868db] group-hover:scale-105 transition-transform">
              <Sliders className="size-5" />
            </div>
            <ArrowRight className="size-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1868db] transition-all" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Script Rules & GCM v2</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Auto-sync Google Consent Mode v2 signals and gate Meta Pixel, TikTok, and GA4 scripts.
          </p>
        </Link>

        <Link
          href="/consent/logs"
          className="group block rounded-[4px] border border-slate-200 bg-white p-5 shadow-2xs hover:border-[#1868db] hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-[4px] bg-blue-50 text-[#1868db] group-hover:scale-105 transition-transform">
              <FileCheck className="size-5" />
            </div>
            <ArrowRight className="size-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1868db] transition-all" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Proof-of-Consent Vault</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            GDPR Article 7(1) cryptographic receipt logs, search filters, and one-click CSV export.
          </p>
        </Link>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Consent Receipts</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {isLoading ? "..." : (stats?.total_receipts || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Logged proof-of-consents</div>
        </div>

        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acceptance Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {isLoading ? "..." : `${stats?.acceptance_rate || 0}%`}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Visitors accepted cookies</div>
        </div>

        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejection Rate</div>
          <div className="text-2xl font-bold text-slate-700 mt-2">
            {isLoading ? "..." : `${stats?.rejection_rate || 0}%`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Rejected non-essential</div>
        </div>

        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Analytics Opt-In</div>
          <div className="text-2xl font-bold text-[#1868db] mt-2">
            {isLoading ? "..." : `${stats?.analytics_accepted_pct || 0}%`}
          </div>
          <div className="text-[11px] text-[#1868db]/80 mt-1">Granted analytics consent</div>
        </div>
      </div>

      {/* 5-Category Breakdown Section */}
      <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Consent Category Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-[4px] border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="font-semibold">Necessary</span>
              <span className="text-[10px] font-bold text-emerald-600">100%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-full" />
            </div>
          </div>

          <div className="p-3 rounded-[4px] border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="font-semibold">Functional</span>
              <span className="text-[10px] font-bold text-[#1868db]">{stats?.functional_accepted_pct || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#1868db] h-full" style={{ width: `${stats?.functional_accepted_pct || 0}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-[4px] border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="font-semibold">Analytics</span>
              <span className="text-[10px] font-bold text-indigo-600">{stats?.analytics_accepted_pct || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full" style={{ width: `${stats?.analytics_accepted_pct || 0}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-[4px] border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="font-semibold">Performance</span>
              <span className="text-[10px] font-bold text-purple-600">{stats?.performance_accepted_pct || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full" style={{ width: `${stats?.performance_accepted_pct || 0}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-[4px] border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="font-semibold">Advertisement</span>
              <span className="text-[10px] font-bold text-rose-600">{stats?.advertisement_accepted_pct || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full" style={{ width: `${stats?.advertisement_accepted_pct || 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Receipts Table Preview */}
      <div className="rounded-[4px] border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Proof-of-Consent Receipts</h3>
            <p className="text-xs text-slate-500">Live cryptographic audit trail from visitors</p>
          </div>
          <Link
            href="/consent/logs"
            className="text-xs font-bold text-[#1868db] hover:text-[#1559be] inline-flex items-center gap-1"
          >
            View Full Vault <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Visitor / Hash</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Granted Categories</th>
                <th className="py-3 px-4 text-right">Receipt ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-3 w-28 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-3 w-20 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-3 w-12 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-16 bg-slate-100 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-3 w-16 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : !stats || stats.recent_receipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No consent receipts logged yet. When visitors interact with the banner on your website, receipts will appear here.
                  </td>
                </tr>
              ) : (
                stats.recent_receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {r.visitor_hash ? `${r.visitor_hash.slice(0, 8)}...` : "anon"}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {r.country || "Global"}
                    </td>
                    <td className="py-3 px-4">
                      {r.consent_given ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3" /> Accepted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="size-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] bg-slate-100 text-slate-700 font-medium">Nec</span>
                        {r.functional && <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] bg-blue-50 text-[#1868db] border border-blue-200 font-medium">Func</span>}
                        {r.analytics && <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">Ana</span>}
                        {r.performance && <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-medium">Perf</span>}
                        {r.advertisement && <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-medium">Ad</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">
                      {r.id.slice(0, 8)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

