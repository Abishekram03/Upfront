"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Cookie,
  CalendarCheck,
  Sparkles,
  Check,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Clock,
  Radio,
  PlayCircle,
} from "lucide-react"
import { useDomain } from "@/lib/domain-context"
import { cn } from "@/lib/utils"

export interface AppNotification {
  id: string
  type: "scan_completed" | "uncategorized_cookies" | "leak_alert" | "schedule_info"
  title: string
  description: string
  domain?: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
  actionLabel?: string
  priority?: "high" | "medium" | "low"
}

function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "Just now"
  try {
    const d = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString([], { month: "short", day: "numeric" })
  } catch {
    return "Recently"
  }
}

export function NotificationBell() {
  const { activeDomain } = useDomain()
  const domain = activeDomain || ""

  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "scans" | "alerts">("all")
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real scan history and cookie inventory from the database
  useEffect(() => {
    let isMounted = true
    if (!domain) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    async function loadRealNotificationData() {
      setIsLoading(true)
      try {
        const [scannerRes, scheduleRes] = await Promise.allSettled([
          fetch(`/api/v1/consent/scanner?domain=${encodeURIComponent(domain)}`),
          fetch(`/api/v1/consent/scanner/schedule?domain=${encodeURIComponent(domain)}`),
        ])

        const items: AppNotification[] = []

        let scanHistory: any[] = []
        let cookiesList: any[] = []
        let preConsentLeaks: any[] = []
        let scheduleInfo: any = null

        if (scannerRes.status === "fulfilled" && scannerRes.value.ok) {
          const sData = await scannerRes.value.json()
          scanHistory = sData.scan_history || (sData.latest_scan ? [sData.latest_scan] : [])
          cookiesList = sData.cookies || []
          preConsentLeaks = sData.pre_consent_leaks || []
        }

        if (scheduleRes.status === "fulfilled" && scheduleRes.value.ok) {
          const schedData = await scheduleRes.value.json()
          scheduleInfo = schedData.schedule
        }

        // 1. Real Scan History Events (most recent scans from database)
        if (scanHistory.length > 0) {
          scanHistory.slice(0, 3).forEach((scan, idx) => {
            const isScheduled = scan.trigger_source === "scheduled"
            const cookiesCount = scan.cookies_found ?? cookiesList.length
            const isCompleted = scan.status === "completed"
            const timestamp = formatRelativeTime(scan.completed_at || scan.created_at)

            items.push({
              id: `scan-${scan.id || idx}`,
              type: "scan_completed",
              title: isCompleted
                ? isScheduled
                  ? "Scheduled scan completed"
                  : "Manual audit scan completed"
                : `Scan ${scan.status || "in progress"}`,
              description: isCompleted
                ? `Audit scan finished for ${domain}. ${cookiesCount} active cookie${cookiesCount === 1 ? "" : "s"} discovered across ${scan.pages_scanned || 1} page${(scan.pages_scanned || 1) === 1 ? "" : "s"}.`
                : `Scan initiated for ${domain}. Discovering trackers and cookies...`,
              domain,
              timestamp,
              isRead: idx > 0, // Latest scan is unread
              actionUrl: "/consent/cookies",
              actionLabel: "View Cookie List",
              priority: "medium",
            })
          })
        }

        // 2. Real Uncategorized Cookies Finding (from database)
        const uncategorized = cookiesList.filter(
          (c: any) =>
            !c.category ||
            c.category.toLowerCase() === "uncategorized" ||
            c.category === "unknown"
        )

        if (uncategorized.length > 0) {
          const sampleNames = uncategorized.slice(0, 3).map((c: any) => c.name).join(", ")
          const extra = uncategorized.length > 3 ? ` and ${uncategorized.length - 3} more` : ""

          items.push({
            id: `uncat-${domain}-${uncategorized.length}`,
            type: "uncategorized_cookies",
            title: `${uncategorized.length} Uncategorized cookie${uncategorized.length > 1 ? "s" : ""} found`,
            description: `Trackers (${sampleNames}${extra}) need classification to ensure your CMP banner and cookie policy disclosures are accurate.`,
            domain,
            timestamp: "Action Required",
            isRead: false,
            actionUrl: "/consent/cookies",
            actionLabel: "Categorize Cookies",
            priority: "high",
          })
        }

        // 3. Real Pre-Consent Tracking Leaks (from database findings)
        if (preConsentLeaks.length > 0) {
          items.push({
            id: `leak-${domain}-${preConsentLeaks.length}`,
            type: "leak_alert",
            title: `${preConsentLeaks.length} Pre-consent leak${preConsentLeaks.length > 1 ? "s" : ""} detected`,
            description: `Scripts or third parties set cookies before explicit user consent on ${domain}. Review findings to prevent GDPR/ePrivacy violations.`,
            domain,
            timestamp: "High Priority",
            isRead: false,
            actionUrl: "/consent/cookies",
            actionLabel: "Inspect Leaks",
            priority: "high",
          })
        }

        // 4. Real Recurring Schedule Configuration Status
        if (scheduleInfo && scheduleInfo.enabled) {
          const nextRunFormatted = scheduleInfo.next_run_at
            ? new Date(scheduleInfo.next_run_at).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })
            : "Upcoming"
          const time = scheduleInfo.time_of_day || "09:00"
          const freq = (scheduleInfo.frequency || "daily").toUpperCase()

          items.push({
            id: `sched-${domain}`,
            type: "schedule_info",
            title: `${freq} Scheduled Scan Active`,
            description: `Automated scans are active for ${domain}. Next run set for ${nextRunFormatted} at ${time} (${scheduleInfo.timezone || "UTC"}).`,
            domain,
            timestamp: "Active",
            isRead: true,
            actionUrl: "/consent/cookies",
            actionLabel: "Manage Schedule",
            priority: "low",
          })
        }

        if (isMounted) {
          setNotifications(items)
        }
      } catch (err) {
        console.warn("Could not load real notification data:", err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadRealNotificationData()

    return () => {
      isMounted = false
    }
  }, [domain])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length
  }, [notifications])

  const filteredNotifications = useMemo(() => {
    if (filter === "scans") {
      return notifications.filter((n) => n.type === "scan_completed" || n.type === "schedule_info")
    }
    if (filter === "alerts") {
      return notifications.filter(
        (n) => n.type === "uncategorized_cookies" || n.type === "leak_alert"
      )
    }
    return notifications
  }, [notifications, filter])

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="relative">
      {/* Notification Bell Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex size-9 items-center justify-center rounded-lg border transition-all relative shadow-2xs cursor-pointer",
          isOpen
            ? "border-[#1868db] bg-blue-50/70 text-[#1868db]"
            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600"
        )}
        title="Notifications"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#1868db] text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 overflow-hidden flex flex-col max-h-[520px]">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                {unreadCount > 0 ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-[#1868db]">
                    {unreadCount} new
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">
                    Live database logs
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-[#1868db] hover:text-blue-700 cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-3.5 py-2 border-b border-slate-100 flex items-center gap-1.5 bg-white">
              {[
                { id: "all", label: "All" },
                { id: "scans", label: "Scans" },
                { id: "alerts", label: "Alerts" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id as any)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer",
                    filter === tab.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-8 text-center space-y-2">
                  <div className="size-5 border-2 border-[#1868db] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Loading scan logs...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <div className="size-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                    <Cookie className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">No scan notifications yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                    No automated or manual scans recorded for <strong className="text-slate-700">{domain || "this site"}</strong> yet.
                  </p>
                  <Link
                    href="/consent/cookies"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#1868db] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <PlayCircle className="size-3.5" />
                    <span>Run First Scan</span>
                  </Link>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  return (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "p-3.5 transition-colors flex items-start gap-3 cursor-pointer group",
                        !n.isRead ? "bg-blue-50/30 hover:bg-blue-50/60" : "hover:bg-slate-50/80 bg-white"
                      )}
                    >
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0">
                        {n.type === "scan_completed" && (
                          <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
                            <CalendarCheck className="size-4" />
                          </div>
                        )}
                        {n.type === "uncategorized_cookies" && (
                          <div className="size-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-2xs">
                            <AlertTriangle className="size-4" />
                          </div>
                        )}
                        {n.type === "leak_alert" && (
                          <div className="size-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-2xs">
                            <AlertTriangle className="size-4" />
                          </div>
                        )}
                        {n.type === "schedule_info" && (
                          <div className="size-8 rounded-lg bg-blue-50 text-[#1868db] border border-blue-200 flex items-center justify-center shadow-2xs">
                            <Clock className="size-4" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {n.title}
                          </h5>
                          <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                            <Clock className="size-2.5" />
                            {n.timestamp}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {n.description}
                        </p>

                        {/* Action CTA */}
                        {n.actionUrl && (
                          <div className="pt-1.5 flex items-center justify-between">
                            <Link
                              href={n.actionUrl}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1868db] hover:underline"
                            >
                              <span>{n.actionLabel || "View"}</span>
                              <ChevronRight className="size-3" />
                            </Link>

                            {!n.isRead && (
                              <span className="size-1.5 rounded-full bg-[#1868db]" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <Link
                href="/consent/cookies"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-semibold text-slate-600 hover:text-[#1868db] transition-colors"
              >
                View all scan records & cookie inventory &rarr;
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
