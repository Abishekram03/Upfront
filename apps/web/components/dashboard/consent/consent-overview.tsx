"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Globe, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react"
import { useDomain } from "@/lib/domain-context"
import {
  fetchConsentStats,
  fetchConsentConfig,
  fetchScannerData,
  saveConsentConfig,
  ConsentStatsSummary,
  ConsentConfig,
  ScannerResponse,
} from "@/lib/api"
import { ConsentHeader } from "./overview/consent-header"
import { ConsentNavigation } from "./overview/consent-navigation"
import { ConsentDecisionMetrics } from "./overview/consent-decision-metrics"
import { ConsentCategoryBreakdown } from "./overview/consent-category-breakdown"
import { ConsentHealth } from "./overview/consent-health"
import { InstallationCard } from "./overview/installation-card"
import { DeclarationEmbedCard } from "./overview/declaration-embed-card"

export function ConsentOverview() {
  const { activeDomain, isLoadingSites, sites } = useDomain()

  const [stats, setStats] = useState<ConsentStatsSummary | null>(null)
  const [config, setConfig] = useState<ConsentConfig | null>(null)
  const [scanner, setScanner] = useState<ScannerResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const loadData = useCallback(async () => {
    if (!activeDomain) {
      setIsLoading(false)
      setStats(null)
      setConfig(null)
      setScanner(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch stats, config, and scanner concurrently with resilient error handling
      const [statsResult, configResult, scannerResult] = await Promise.allSettled([
        fetchConsentStats(activeDomain),
        fetchConsentConfig(activeDomain),
        fetchScannerData(activeDomain),
      ])

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value)
      } else {
        console.error("Failed to load consent stats:", statsResult.reason)
      }

      if (configResult.status === "fulfilled") {
        setConfig(configResult.value)
      } else {
        console.error("Failed to load consent config:", configResult.reason)
      }

      if (scannerResult.status === "fulfilled") {
        setScanner(scannerResult.value)
      } else {
        // Non-critical, scanner can be null if no scan has been executed
        setScanner(null)
      }

      // If both core endpoints failed, raise an error state
      if (statsResult.status === "rejected" && configResult.status === "rejected") {
        throw new Error(
          statsResult.reason?.message || configResult.reason?.message || "Unable to retrieve consent overview data."
        )
      }
    } catch (err: any) {
      console.error("Consent Overview fetch failure:", err)
      setError(err?.message || "Unable to load consent metrics and settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [activeDomain])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Master Banner Toggle with Optimistic rollback and safety validation
  const handleToggleBanner = async () => {
    if (!config || !activeDomain || isToggling) return

    const previousEnabled = config.is_enabled
    const newEnabled = !previousEnabled

    setIsToggling(true)
    setNotification(null)

    try {
      const updated = await saveConsentConfig({
        ...config,
        is_enabled: newEnabled,
      })
      setConfig(updated)
      setNotification({
        type: "success",
        message: newEnabled ? "Consent banner is now Live on your website." : "Consent banner paused.",
      })
      setTimeout(() => setNotification(null), 4000)
    } catch (err: any) {
      console.error("Banner toggle failure:", err)
      // Rollback to previous state
      setConfig({ ...config, is_enabled: previousEnabled })
      setNotification({
        type: "error",
        message: err?.message || "Failed to update banner status. Previous state restored.",
      })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setIsToggling(false)
    }
  }

  // EMPTY STATE: NO SITES REGISTERED
  if (!isLoadingSites && !activeDomain && sites.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-[6px] bg-blue-50 text-[#1868db]">
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

  // ERROR STATE: FAILED DATA FETCH (with retry)
  if (error && !isLoading && !config && !stats) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-8 text-center shadow-xs">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertCircle className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-rose-900">Unable to Load Consent Data</h3>
            <p className="text-xs text-rose-700 leading-relaxed">
              {error}
            </p>
            <button
              type="button"
              onClick={loadData}
              className="mt-2 inline-flex items-center gap-1.5 rounded-[4px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Toast / Status Notification */}
      {notification && (
        <div
          role="alert"
          className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Header with Domain Context & Banner Master Switch */}
      <ConsentHeader
        activeDomain={activeDomain || ""}
        config={config}
        isLoading={isLoading}
        isToggling={isToggling}
        onToggleBanner={handleToggleBanner}
        onRefresh={loadData}
      />

      {/* 2. Consent Decision Metrics (Granular Accept All, Reject All, Custom Choice, Analytics Opt-In) */}
      <ConsentDecisionMetrics stats={stats} isLoading={isLoading} />

      {/* 3. Consent Categories Breakdown (Necessary 100% Always Active, Functional, Analytics, Performance, Advertisement) */}
      <ConsentCategoryBreakdown stats={stats} isLoading={isLoading} />

      {/* 4. Operational Website & CMP Health */}
      <ConsentHealth
        config={config}
        stats={stats}
        scanner={scanner}
        isLoading={isLoading}
      />

      {/* 5. Quick Navigation Cards */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions & Tools</h2>
        <ConsentNavigation />
      </div>

      {/* 6. Single-Tag SDK Installation */}
      <InstallationCard
        activeDomain={activeDomain || ""}
        stats={stats}
        isLoading={isLoading}
      />

      {/* 7. Live Cookie Declaration Embed */}
      <DeclarationEmbedCard />
    </div>
  )
}
