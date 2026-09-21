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
  Radar,
  Copy,
  Code2,
  Lock,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"
import { useDomain } from "@/lib/domain-context"
import { fetchConsentStats, fetchConsentConfig, saveConsentConfig, ConsentStatsSummary, ConsentConfig } from "@/lib/api"
import { CookieManager } from "./cookie-manager"
import { ScannerDashboard } from "./scanner-dashboard"
import { ConsentLedger } from "./consent-ledger"
import { PolicyGenerator } from "./policy-generator"

export function ConsentOverview() {
  const { activeDomain, isLoadingSites, sites } = useDomain()

  const [activeTab, setActiveTab] = useState<"overview" | "cookies" | "scanner" | "audit" | "policy" | "sdk">("overview")
  const [stats, setStats] = useState<ConsentStatsSummary | null>(null)
  const [config, setConfig] = useState<ConsentConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)

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

  const snippetCode = `<script src="${typeof window !== "undefined" ? window.location.origin : "https://usrly-five.vercel.app"}/consentos.js?domain=${activeDomain || "your-site.com"}" defer></script>`

  const copySnippet = () => {
    navigator.clipboard.writeText(snippetCode)
    setCopiedSnippet(true)
    setTimeout(() => setCopiedSnippet(false), 2000)
  }

  // EMPTY STATE: NO SITES
  if (!isLoadingSites && !activeDomain && sites.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex max-w-sm flex-col items-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-[4px] bg-slate-100 text-[#1868db]">
              <Globe className="size-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Website Registered</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add your website to start customizing cookie banners, gating 3rd-party scripts, and capturing proof-of-consent audit logs.
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Consent Management Platform</h1>
            <span className="rounded-[4px] bg-blue-50 px-2 py-0.5 text-xs font-bold text-[#1868db] border border-blue-200">
              ConsentOS Core v2.3
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Privacy-first cookie banner studio, script auto-blocking, and proof-of-consent logs for <strong className="text-slate-800">{activeDomain || "your site"}</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-[4px] px-3 py-1.5 shadow-2xs transition-colors cursor-pointer"
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
                "inline-flex items-center text-xs font-bold rounded-[4px] px-3.5 py-1.5 shadow-xs transition-all cursor-pointer",
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

          <Link
            href="/consent/studio"
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-3.5 py-1.5 shadow-xs transition-colors"
          >
            <Palette className="size-3.5" />
            Open Banner Studio
          </Link>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px scrollbar-none">
        {[
          { key: "overview", label: "Overview & Analytics", icon: SlidersHorizontal },
          { key: "cookies", label: "Cookie Manager", icon: Cookie },
          { key: "scanner", label: "Automated Scanner", icon: Radar },
          { key: "audit", label: "Proof-of-Consent Vault", icon: ShieldCheck },
          { key: "policy", label: "Policy Generator", icon: FileCode },
          { key: "sdk", label: "Installation & SDK", icon: Code2 },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer",
                isActive
                  ? "border-[#1868db] text-[#1868db] bg-blue-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon className={cn("size-3.5", isActive ? "text-[#1868db]" : "text-slate-400")} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: OVERVIEW & TELEMETRY */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/consent/studio"
              className="group block rounded-lg border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#1868db] hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-[4px] bg-blue-50 text-[#1868db] group-hover:scale-105 transition-transform">
                  <Palette className="size-4.5" />
                </div>
                <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1868db] transition-all" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Banner Studio</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Live visual editor for banner layouts, colors, and 6-field preference centre.
              </p>
            </Link>

            <button
              onClick={() => setActiveTab("cookies")}
              className="group block text-left rounded-lg border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#1868db] hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-[4px] bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                  <Cookie className="size-4.5" />
                </div>
                <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1868db] transition-all" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Cookie Manager</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Categorize cookies and configure script URL regex blocking rules.
              </p>
            </button>

            <button
              onClick={() => setActiveTab("scanner")}
              className="group block text-left rounded-lg border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#1868db] hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-[4px] bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
                  <Radar className="size-4.5" />
                </div>
                <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1868db] transition-all" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Automated Scanner</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Discover trackers & identify non-consented pre-consent data leaks.
              </p>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className="group block text-left rounded-lg border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#1868db] hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex size-9 items-center justify-center rounded-[4px] bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                  <FileCheck className="size-4.5" />
                </div>
                <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1868db] transition-all" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Proof Vault</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Cryptographically verifiable receipts for GDPR Article 7 audit compliance.
              </p>
            </button>
          </div>

          {/* KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Consent Receipts</div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {isLoading ? "..." : (stats?.total_receipts || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Logged proof-of-consents</div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acceptance Rate</div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">
                {isLoading ? "..." : `${stats?.acceptance_rate || 0}%`}
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-1">Visitors accepted cookies</div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejection Rate</div>
              <div className="text-2xl font-bold text-slate-700 mt-2">
                {isLoading ? "..." : `${stats?.rejection_rate || 0}%`}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Rejected non-essential</div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Analytics Opt-In</div>
              <div className="text-2xl font-bold text-[#1868db] mt-2">
                {isLoading ? "..." : `${stats?.analytics_accepted_pct || 0}%`}
              </div>
              <div className="text-[11px] text-[#1868db]/80 mt-1">Granted analytics consent</div>
            </div>
          </div>

          {/* 5-Category Breakdown */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Consent Decision Breakdown by Category</h3>
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
        </div>
      )}

      {/* TAB 2: COOKIE MANAGER */}
      {activeTab === "cookies" && <CookieManager />}

      {/* TAB 3: SCANNER CONSOLE */}
      {activeTab === "scanner" && <ScannerDashboard />}

      {/* TAB 4: AUDIT LEDGER */}
      {activeTab === "audit" && <ConsentLedger />}

      {/* TAB 5: POLICY GENERATOR */}
      {activeTab === "policy" && <PolicyGenerator />}

      {/* TAB 6: INSTALLATION & SDK */}
      {activeTab === "sdk" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Install ConsentOS on {activeDomain}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Paste this single script tag in the <code>&lt;head&gt;</code> of your website. It handles auto-blocking, Google Consent Mode v2, and Shadow DOM banner rendering automatically.
              </p>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                {snippetCode}
              </pre>
              <button
                onClick={copySnippet}
                className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSnippet ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copiedSnippet ? "Copied!" : "Copy Tag"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold block text-slate-900 mb-1">Google Consent Mode v2</span>
                <p className="text-slate-500 text-[11px]">
                  Automatically updates <code>ad_storage</code> and <code>analytics_storage</code> in the <code>window.dataLayer</code> when users grant or deny permissions.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold block text-slate-900 mb-1">Live Audit Table Element</span>
                <p className="text-slate-500 text-[11px]">
                  Insert <code>&lt;div class=&quot;consentos-audit-table&quot;&gt;&lt;/div&gt;</code> anywhere on your Privacy or Cookie Policy page to embed a live cookie table.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
