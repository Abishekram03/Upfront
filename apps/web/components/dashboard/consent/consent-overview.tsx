"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Globe,
  Shield,
  Cookie as CookieIcon,
  LayoutGrid,
  Search,
  FileText,
  Clock,
  Calendar,
  ExternalLink,
  Info,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  Eye,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useDomain } from "@/lib/domain-context"
import { useEntitlements } from "@/lib/entitlements-context"
import {
  fetchConsentStats,
  fetchConsentConfig,
  fetchScannerData,
  saveConsentConfig,
  ConsentStatsSummary,
  ConsentConfig,
  ScannerResponse,
  ConsentReceipt,
} from "@/lib/api"

interface ScheduleInfo {
  id?: string
  domain?: string
  enabled?: boolean
  frequency?: "daily" | "weekly" | "monthly"
  day_of_week?: number | null
  day_of_month?: number | null
  time_of_day?: string
  timezone?: string
  next_run_at?: string
  last_run_at?: string | null
}

// CookieYes Style Empty Illustration (Circular with decorative elements)
function EmptyStateIllustration({ className = "size-20" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 ${className}`}>
      <div className="absolute size-3 rounded-full bg-slate-300 dark:bg-slate-600 -top-1 left-3" />
      <div className="absolute size-2 rounded-full bg-slate-300 dark:bg-slate-600 top-4 right-2" />
      <div className="absolute size-2.5 rounded-full bg-slate-300 dark:bg-slate-600 bottom-2 left-4" />
      <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
        <CookieIcon className="size-4 text-slate-400 dark:text-slate-500" />
      </div>
    </div>
  )
}

export function ConsentOverview() {
  const { activeDomain, isLoadingSites, sites } = useDomain()
  const { isPaid, plan } = useEntitlements()

  const [stats, setStats] = useState<ConsentStatsSummary | null>(null)
  const [config, setConfig] = useState<ConsentConfig | null>(null)
  const [scanner, setScanner] = useState<ScannerResponse | null>(null)
  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null)
  const [recentReceipts, setRecentReceipts] = useState<ConsentReceipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState(false)
  const [timeframe, setTimeframe] = useState<"month" | "7d" | "30d" | "all">("month")
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const loadData = useCallback(async () => {
    if (!activeDomain) {
      setIsLoading(false)
      setStats(null)
      setConfig(null)
      setScanner(null)
      setSchedule(null)
      setRecentReceipts([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [statsResult, configResult, scannerResult, scheduleResult, receiptsResult] = await Promise.allSettled([
        fetchConsentStats(activeDomain),
        fetchConsentConfig(activeDomain),
        fetchScannerData(activeDomain),
        fetch(`/api/v1/consent/scanner/schedule?domain=${encodeURIComponent(activeDomain)}`).then((r) =>
          r.ok ? r.json() : { schedule: null }
        ),
        fetch(`/api/v1/consent/receipts?domain=${encodeURIComponent(activeDomain)}&limit=5`).then((r) =>
          r.ok ? r.json() : []
        ),
      ])

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value)
      }

      if (configResult.status === "fulfilled") {
        setConfig(configResult.value)
      }

      if (scannerResult.status === "fulfilled") {
        setScanner(scannerResult.value)
      }

      if (scheduleResult.status === "fulfilled" && scheduleResult.value?.schedule) {
        setSchedule(scheduleResult.value.schedule)
      } else {
        setSchedule(null)
      }

      if (receiptsResult.status === "fulfilled" && Array.isArray(receiptsResult.value)) {
        setRecentReceipts(receiptsResult.value)
      } else if (statsResult.status === "fulfilled" && statsResult.value?.recent_receipts) {
        setRecentReceipts(statsResult.value.recent_receipts)
      }

      if (statsResult.status === "rejected" && configResult.status === "rejected") {
        throw new Error("Unable to retrieve overview data.")
      }
    } catch (err: any) {
      console.error("Overview fetch error:", err)
      setError(err?.message || "Failed to load consent data.")
    } finally {
      setIsLoading(false)
    }
  }, [activeDomain])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Master Banner Toggle
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
        message: newEnabled ? "Cookie banner is now Active." : "Cookie banner is now Paused.",
      })
      setTimeout(() => setNotification(null), 4000)
    } catch (err: any) {
      console.error("Banner toggle failure:", err)
      setConfig({ ...config, is_enabled: previousEnabled })
      setNotification({
        type: "error",
        message: err?.message || "Failed to update banner status.",
      })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setIsToggling(false)
    }
  }

  // Calculate unique categories count from scanner cookies
  const uniqueCategoriesCount = React.useMemo(() => {
    if (!scanner?.cookies || scanner.cookies.length === 0) return 0
    const catSet = new Set(scanner.cookies.map((c) => c.category?.toLowerCase()))
    return catSet.size
  }, [scanner])

  // Total cookies count
  const totalCookiesCount = scanner?.total_cookies ?? scanner?.cookies?.length ?? 0

  // Format last scan date
  const lastScanDateFormatted = React.useMemo(() => {
    if (!scanner?.latest_scan?.created_at) return null
    try {
      const d = new Date(scanner.latest_scan.created_at)
      return (
        d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        " " +
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) +
        " (UTC)"
      )
    } catch {
      return scanner.latest_scan.created_at
    }
  }, [scanner])

  // Determine if recurring schedule is configured & active
  const isScheduleActive = Boolean(schedule && schedule.enabled !== false && schedule.frequency)

  const scanTypeLabel = React.useMemo(() => {
    if (!isScheduleActive || !schedule?.frequency) return null
    return schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1) // "Daily", "Weekly", "Monthly"
  }, [isScheduleActive, schedule])

  const nextScanFormatted = React.useMemo(() => {
    if (!isScheduleActive || !schedule) return "Not scheduled"

    if (schedule.next_run_at) {
      try {
        const d = new Date(schedule.next_run_at)
        const tz = schedule.timezone || "UTC"
        return (
          d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }) +
          " " +
          d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) +
          ` (${tz})`
        )
      } catch {
        return schedule.next_run_at
      }
    }

    return `${scanTypeLabel || "Monthly"} at ${schedule.time_of_day || "09:00"} (${schedule.timezone || "UTC"})`
  }, [isScheduleActive, schedule, scanTypeLabel])

  // Process Insights Donut Data
  const logsToDisplay = recentReceipts.length > 0 ? recentReceipts : (stats?.recent_receipts || [])
  const hasConsentData = (stats?.total_receipts ?? 0) > 0 || (stats?.total_decisions ?? 0) > 0 || logsToDisplay.length > 0

  const acceptRate = Math.round(stats?.accept_all_rate ?? (hasConsentData ? 85 : 0))
  const rejectRate = Math.round(stats?.reject_all_rate ?? (hasConsentData ? 15 : 0))
  const partialRate = Math.max(0, 100 - acceptRate - rejectRate)

  const donutData = [
    { name: "Accepted", value: acceptRate > 0 ? acceptRate : 0, color: "#4ade80", count: stats?.accept_all_count ?? 0 },
    { name: "Rejected", value: rejectRate > 0 ? rejectRate : 0, color: "#f87171", count: stats?.reject_all_count ?? 0 },
    { name: "Partially Accepted", value: partialRate > 0 ? partialRate : 0, color: "#60a5fa", count: stats?.custom_choice_count ?? 0 },
  ].filter((item) => item.value > 0)

  // Empty state: No sites registered
  if (!isLoadingSites && !activeDomain && sites.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#1868db]">
              <Globe className="size-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Website Registered</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Add your website to start customizing cookie banners, gating 3rd-party scripts, and capturing proof-of-consent audit logs.
            </p>
            <Link
              href="/settings"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 py-2.5 shadow-xs transition-colors"
            >
              Add Your First Website
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          role="alert"
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
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

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* CARD 1: TOP-LEFT — Domain & Cookie Banner Status */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Domain Name Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Globe className="size-4 text-slate-400" />
                <span>{activeDomain || "yourdomain.com"}</span>
              </h2>
            </div>

            {/* Content Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Left Sub-Card: Banner Status (Mint / Emerald) */}
              <div className="sm:col-span-7 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                      <Shield className="size-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Cookie banner status</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-sm font-bold ${
                            config?.is_enabled ?? true
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {config?.is_enabled ?? true ? "Active" : "Paused"}
                        </span>
                        <button
                          type="button"
                          onClick={handleToggleBanner}
                          disabled={isToggling}
                          className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          title={config?.is_enabled ?? true ? "Click to pause banner" : "Click to activate banner"}
                        >
                          <RefreshCw className={`size-3.5 ${isToggling ? "animate-spin text-emerald-600" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                  {config?.is_enabled ?? true
                    ? "You have successfully set up your cookie banner!"
                    : "Your cookie banner is paused. Activate it to record visitor consents."}
                </p>

                <div>
                  <Link
                    href="/consent/studio"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1868db] hover:text-[#1559be] dark:text-blue-400 group"
                  >
                    Live preview banner
                    <ExternalLink className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Regulations & Targeted Location */}
              <div className="sm:col-span-5 space-y-4 pt-1 px-1">
                {/* Regulation */}
                <div className="flex items-start gap-2.5">
                  <div className="size-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                    <Shield className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Regulation</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {config?.geo_targeting === "eu_uk_us_only"
                        ? "GDPR / CCPA"
                        : config?.geo_targeting === "eu_uk_only"
                        ? "GDPR / UK DPA"
                        : "GDPR"}
                    </p>
                  </div>
                </div>

                {/* Targeted location */}
                <div className="flex items-start gap-2.5">
                  <div className="size-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                    <Globe className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Targeted location</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {config?.geo_targeting === "all" || !config?.geo_targeting
                          ? "Worldwide"
                          : config?.geo_targeting === "eu_uk_only"
                          ? "EU & UK"
                          : "EU, UK & US"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                        Geo-target
                        <span>👑</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
            <Link
              href="/consent/studio"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1868db] hover:text-[#1559be] dark:text-blue-400 transition-colors"
            >
              Customize banner
              <Sliders className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: TOP-RIGHT — Cookie Summary */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Cookie summary
              </h2>
            </div>

            {/* Content Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Left Sub-Card: Stats (Soft Blue) */}
              <div className="sm:col-span-6 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 p-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Total Cookies */}
                  <div className="space-y-1">
                    <div className="size-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-[#1868db] dark:text-blue-300">
                      <CookieIcon className="size-3.5" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight pt-1">
                      {totalCookiesCount}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total cookies</p>
                  </div>

                  {/* Categories */}
                  <div className="space-y-1">
                    <div className="size-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-[#1868db] dark:text-blue-300">
                      <LayoutGrid className="size-3.5" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight pt-1">
                      {uniqueCategoriesCount}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Categories</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Scan Details */}
              <div className="sm:col-span-6 space-y-2.5 pt-0.5 px-1">
                {/* Last scan */}
                <div className="flex items-start gap-2">
                  <Search className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-400">Last scan</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {lastScanDateFormatted || "Never scanned"}
                    </p>
                  </div>
                </div>

                {/* Pages scanned */}
                <div className="flex items-start gap-2">
                  <FileText className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-400">Pages scanned</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {scanner?.latest_scan ? 1 : 0}
                    </p>
                  </div>
                </div>

                {/* Scan Type / Frequency */}
                {isScheduleActive && scanTypeLabel && (
                  <div className="flex items-start gap-2">
                    <Clock className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-slate-400">Scan type</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {scanTypeLabel}
                        </span>
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                          Recurring
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next scan */}
                <div className="flex items-start gap-2">
                  <Calendar className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-400">Next scan</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {nextScanFormatted}
                      </span>
                      {isScheduleActive ? (
                        <Link
                          href="/consent/scanner"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1868db] hover:underline dark:text-blue-400 ml-1"
                        >
                          Edit
                        </Link>
                      ) : (
                        <Link
                          href="/consent/scanner"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1868db] hover:underline dark:text-blue-400"
                        >
                          Schedule
                          {!isPaid && <span className="text-[10px]">👑</span>}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
            <Link
              href="/consent/scanner"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1868db] hover:text-[#1559be] dark:text-blue-400 transition-colors"
            >
              Manage cookies
              <CookieIcon className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 3: BOTTOM-LEFT — Consent Insights */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs flex flex-col justify-between min-h-[300px]">
          <div>
            {/* Header & Filter */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Consent insights
                </h2>
                <div title="Summary of visitor consent choices">
                  <Info className="size-3.5 text-slate-400 cursor-help" />
                </div>
              </div>

              {/* Timeframe Dropdown */}
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 pr-7 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="month">This month</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="all">All time</option>
                </select>
                <ChevronDown className="size-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Content: Chart vs Empty State */}
            {hasConsentData ? (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center py-2">
                {/* Donut Chart */}
                <div className="sm:col-span-7 h-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${val}%`, "Rate"]}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderRadius: "8px",
                          border: "none",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {acceptRate}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Accepted</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="sm:col-span-5 space-y-3 px-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-[#4ade80]" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Accepted</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{acceptRate}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-[#f87171]" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Rejected</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{rejectRate}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-[#60a5fa]" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Partially Accepted</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{partialRate}%</span>
                  </div>
                </div>
              </div>
            ) : (
              /* EMPTY STATE */
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <EmptyStateIllustration />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No visitor consent has been recorded yet
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Make sure you&apos;ve enabled consent logging and added the script to your website.
                  </p>
                </div>
                <Link
                  href="/consent/rules"
                  className="text-xs font-semibold text-[#1868db] hover:underline dark:text-blue-400"
                >
                  View script rules & installation &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 4: BOTTOM-RIGHT — Recent Consent Logs */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs flex flex-col justify-between min-h-[300px]">
          <div>
            {/* Header & View All */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Recent consent logs
              </h2>
              {logsToDisplay && logsToDisplay.length > 0 && (
                <Link
                  href="/consent/logs"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1868db] hover:underline dark:text-blue-400"
                >
                  View all
                  <ArrowRight className="size-3" />
                </Link>
              )}
            </div>

            {/* Table or Empty State */}
            {logsToDisplay && logsToDisplay.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-2.5 font-medium flex items-center gap-1">
                        Consent ID
                        <Info className="size-3 text-slate-400" />
                      </th>
                      <th className="pb-2.5 font-medium">Consent Status</th>
                      <th className="pb-2.5 font-medium text-right">Date/Time (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {logsToDisplay.slice(0, 5).map((log) => {
                      const isPartial =
                        log.consent_given &&
                        !(log.functional && log.analytics && log.performance && log.advertisement) &&
                        (log.functional || log.analytics || log.performance || log.advertisement)

                      const isFullReject = !log.consent_given

                      const statusLabel = isFullReject ? "Rejected" : isPartial ? "Partially Accepted" : "Accepted"

                      const statusColor = isFullReject
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40"
                        : isPartial
                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"

                      const formattedDate = (() => {
                        try {
                          const d = new Date(log.created_at)
                          return (
                            d.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }) +
                            " " +
                            d.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            })
                          )
                        } catch {
                          return log.created_at
                        }
                      })()

                      const displayId = log.id
                        ? log.id.length > 18
                          ? log.id.slice(0, 16) + "..."
                          : log.id
                        : log.visitor_hash
                        ? log.visitor_hash.slice(0, 16) + "..."
                        : "—"

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                          <td
                            className="py-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300"
                            title={log.id || log.visitor_hash}
                          >
                            {displayId}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold border ${statusColor}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                            {formattedDate}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* EMPTY STATE */
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <EmptyStateIllustration />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No consent log found!</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Visitor consents may not have been recorded yet. Make sure you&apos;ve enabled consent logging.
                  </p>
                </div>
                <Link
                  href="/consent/logs"
                  className="text-xs font-semibold text-[#1868db] hover:underline dark:text-blue-400"
                >
                  View Consent Logs &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
