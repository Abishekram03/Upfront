"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import {
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Maximize2,
  AlertCircle,
  RefreshCw,
  Plus,
  X,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DetailsModal, DetailItem } from "./details-modal"
import { WorldMap } from "./world-map"
import { SourceFavicon } from "./source-favicon"
import { cn } from "@workspace/ui/lib/utils"
import { fetchStats, StatsResponse, StatsFilters, API_BASE } from "@/lib/api"
import { useDomain } from "@/lib/domain-context"

type MetricKey = "visitors" | "pageviews" | "bounceRate" | "duration"

export function AnalyticsView({ domain: propDomain }: { domain?: string }) {
  const { activeDomain: contextDomain, sites, isLoadingSites, setRealtimeVisitors } = useDomain()
  const activeDomain = propDomain || contextDomain

  const [period, setPeriod] = useState<string>("30d")
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("pageviews")
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // Dimensional Filters state
  const [filters, setFilters] = useState<StatsFilters>({})

  // Data states
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Breakdown Tabs State
  const [sourcesTab, setSourcesTab] = useState<"all">("all")
  const [pagesTab, setPagesTab] = useState<"top">("top")
  const [locationsTab, setLocationsTab] = useState<"map" | "countries">("map")
  const [devicesTab, setDevicesTab] = useState<"size" | "browser" | "os">("size")

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalSubtitle, setModalSubtitle] = useState("")
  const [modalItems, setModalItems] = useState<DetailItem[]>([])
  const [modalFilterKey, setModalFilterKey] = useState<keyof StatsFilters | null>(null)

  const toggleFilter = (key: keyof StatsFilters, value: string) => {
    setFilters((prev) => {
      if (prev[key] === value) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: value }
    })
  }

  const removeFilter = (key: keyof StatsFilters) => {
    setFilters((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const clearAllFilters = () => {
    setFilters({})
  }

  const loadData = async () => {
    if (!activeDomain) {
      setIsLoading(false)
      setStats(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchStats(activeDomain, period, filters)
      setStats(data)
      setRealtimeVisitors(data.realtime_visitors || 0)
    } catch (err: any) {
      console.error("Failed to load stats:", err)
      setError(err?.message || "Failed to load analytics data from server.")
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeDomain, period, filters])

  // Metric definitions mapped from real API stats
  const metricsConfig = useMemo(() => {
    if (!stats) return []
    const m = stats.metrics
    return [
      {
        key: "visitors" as const,
        label: "UNIQUE VISITORS",
        value: m.visitors,
        previousValue: m.previous_visitors,
        changePct: m.visitors_change_pct,
        color: "#6366f1", // Indigo
        format: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString()),
      },
      {
        key: "pageviews" as const,
        label: "TOTAL PAGEVIEWS",
        value: m.pageviews,
        previousValue: m.previous_pageviews,
        changePct: m.pageviews_change_pct,
        color: "#4f46e5", // Deep indigo / purple
        format: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString()),
      },
      {
        key: "bounceRate" as const,
        label: "BOUNCE RATE",
        value: m.bounce_rate,
        previousValue: m.previous_bounce_rate,
        changePct: m.bounce_rate_change_pct,
        color: "#8b5cf6", // Violet
        isNegative: true,
        format: (v: number) => `${v}%`,
      },
      {
        key: "duration" as const,
        label: "VISIT DURATION",
        value: m.visit_duration,
        previousValue: m.previous_visit_duration,
        changePct: m.duration_change_pct,
        color: "#06b6d4", // Cyan
        format: (v: number) => {
          const mins = Math.floor(v / 60)
          const secs = v % 60
          return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`
        },
      },
    ]
  }, [stats])

  const currentMetric = metricsConfig.find((m) => m.key === selectedMetric) ?? metricsConfig[1] ?? metricsConfig[0]

  // Time series computation for SVG line chart
  const timeSeriesData = stats?.time_series || []
  const svgWidth = 800
  const svgHeight = 260
  const paddingX = 40
  const paddingY = 30

  const values = useMemo(() => {
    return timeSeriesData.map((d) => {
      if (selectedMetric === "visitors") return d.visitors
      if (selectedMetric === "pageviews") return d.pageviews
      if (selectedMetric === "bounceRate") return d.bounce_rate
      return d.duration
    })
  }, [timeSeriesData, selectedMetric])

  const minVal = values.length > 0 ? Math.min(...values) * 0.85 : 0
  const maxVal = values.length > 0 ? Math.max(...values) * 1.15 || 1 : 1

  const points = useMemo(() => {
    if (timeSeriesData.length === 0) return []
    return timeSeriesData.map((d, i) => {
      const x = paddingX + (i / Math.max(1, timeSeriesData.length - 1)) * (svgWidth - paddingX * 2)
      const val =
        selectedMetric === "visitors"
          ? d.visitors
          : selectedMetric === "pageviews"
          ? d.pageviews
          : selectedMetric === "bounceRate"
          ? d.bounce_rate
          : d.duration
      const y = svgHeight - paddingY - ((val - minVal) / Math.max(0.0001, maxVal - minVal)) * (svgHeight - paddingY * 2)
      return { x, y, data: d, val }
    })
  }, [timeSeriesData, selectedMetric, minVal, maxVal])

  // Smooth Bezier Curve Path
  const linePath = useMemo(() => {
    if (points.length === 0) return ""
    return points.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x},${pt.y}`
      const prev = arr[i - 1]
      if (!prev) return acc
      const cp1x = prev.x + (pt.x - prev.x) / 2
      const cp1y = prev.y
      const cp2x = prev.x + (pt.x - prev.x) / 2
      const cp2y = pt.y
      return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`
    }, "")
  }, [points])

  const areaPath = useMemo(() => {
    if (points.length === 0 || !linePath) return ""
    const first = points[0]
    const last = points[points.length - 1]
    if (!first || !last) return ""
    return `${linePath} L ${last.x},${svgHeight - paddingY} L ${first.x},${svgHeight - paddingY} Z`
  }, [linePath, points, svgHeight, paddingY])

  // Handle Chart Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartContainerRef.current || timeSeriesData.length === 0) return
    const rect = chartContainerRef.current.getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, (relativeX - 40) / Math.max(1, rect.width - 80)))
    const index = Math.round(percent * (timeSeriesData.length - 1))
    setHoverIndex(index)
  }

  const activeHoverPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null

  // Breakdown datasets from API
  const sourcesData: DetailItem[] = useMemo(() => {
    return (stats?.top_sources || []).map((s) => ({
      id: s.id,
      label: s.label,
      value: s.value >= 1000 ? `${(s.value / 1000).toFixed(1)}k` : s.value.toLocaleString(),
      percentage: s.percentage,
      icon: s.icon,
      sublabel: s.sublabel || undefined,
    }))
  }, [stats])

  const pagesData: DetailItem[] = useMemo(() => {
    return (stats?.top_pages || []).map((p) => ({
      id: p.id,
      label: p.label,
      value: p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}k` : p.value.toLocaleString(),
      percentage: p.percentage,
      link: p.link || undefined,
    }))
  }, [stats])

  const countriesData: DetailItem[] = useMemo(() => {
    return (stats?.locations || []).map((c) => ({
      id: c.id,
      label: c.label,
      value: c.value >= 1000 ? `${(c.value / 1000).toFixed(1)}k` : c.value.toLocaleString(),
      percentage: c.percentage,
      icon: c.icon || "🌐",
    }))
  }, [stats])

  const screenSizesData: DetailItem[] = useMemo(() => {
    return (stats?.devices.screen_sizes || []).map((d) => ({
      id: d.id,
      label: d.label,
      value: d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value.toLocaleString(),
      percentage: d.percentage,
      icon: d.label.toLowerCase().includes("mobile")
        ? Smartphone
        : d.label.toLowerCase().includes("tablet")
        ? Tablet
        : d.label.toLowerCase().includes("laptop")
        ? Laptop
        : Monitor,
    }))
  }, [stats])

  const browsersData: DetailItem[] = useMemo(() => {
    return (stats?.devices.browsers || []).map((b) => ({
      id: b.id,
      label: b.label,
      value: b.value >= 1000 ? `${(b.value / 1000).toFixed(1)}k` : b.value.toLocaleString(),
      percentage: b.percentage,
      icon: Globe,
    }))
  }, [stats])

  const osData: DetailItem[] = useMemo(() => {
    return (stats?.devices.os || []).map((o) => ({
      id: o.id,
      label: o.label,
      value: o.value >= 1000 ? `${(o.value / 1000).toFixed(1)}k` : o.value.toLocaleString(),
      percentage: o.percentage,
      icon: Monitor,
    }))
  }, [stats])

  const activeDeviceItems =
    devicesTab === "size" ? screenSizesData : devicesTab === "browser" ? browsersData : osData

  const openDetailsModal = (
    title: string,
    subtitle: string,
    items: DetailItem[],
    filterKey?: keyof StatsFilters
  ) => {
    setModalTitle(title)
    setModalSubtitle(subtitle)
    setModalItems(items)
    setModalFilterKey(filterKey || null)
    setModalOpen(true)
  }

  // 1. EMPTY STATE: NO WEBSITES ADDED
  if (!isLoadingSites && !activeDomain && sites.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex max-w-sm flex-col items-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-[#1868db]">
              <Globe className="size-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Website Registered</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add your website to start collecting privacy-friendly, cookieless web analytics and tracking realtime visitors.
            </p>
            <Link
              href="/settings"
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 py-2.5 shadow-xs transition-colors"
            >
              <Plus className="size-3.5" /> Add Your First Website
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. ERROR STATE
  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-10 text-center shadow-xs">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertCircle className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-rose-900">Unable to load analytics</h3>
            <p className="text-xs text-rose-600">{error}</p>
            <Button
              variant="outline"
              onClick={loadData}
              className="mt-2 bg-white text-xs text-rose-700 border-rose-200 hover:bg-rose-50 gap-1.5"
            >
              <RefreshCw className="size-3.5" /> Retry Connection
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 3. SKELETON LOADING STATE
  if (isLoading || isLoadingSites) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        {/* Top Control Bar Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 bg-neutral-200 rounded" />
          <div className="h-8 w-44 bg-neutral-200 rounded-lg" />
        </div>

        {/* Chart Card Skeleton */}
        <Card className="w-full border-neutral-200/90 bg-white shadow-xs">
          <CardHeader className="p-0 border-b border-neutral-200/80">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200/80">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-neutral-200 rounded" />
                    <div className="h-4 w-10 bg-neutral-100 rounded" />
                  </div>
                  <div className="h-7 w-24 bg-neutral-200 rounded" />
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 w-full bg-neutral-50 rounded-xl border border-dashed border-neutral-200 flex items-center justify-center">
              <div className="h-32 w-full max-w-lg bg-neutral-100/60 rounded-xl" />
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Skeletons */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="h-4 w-28 bg-neutral-200 rounded" />
                <div className="h-5 w-20 bg-neutral-100 rounded" />
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-7 bg-neutral-100 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 4. MAIN ANALYTICS DASHBOARD (Always renders full dashboard, metrics, charts, and period controls)
  return (
    <div className="space-y-6">
      {/* Period Filter Selector + Active Filter Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 shrink-0">
            <span>Dashboard for</span>
            <span className="text-[#1868db] underline decoration-blue-300 underline-offset-4 font-semibold">{activeDomain}</span>
          </h2>

          {/* Active Filter Badges */}
          {Object.keys(filters).length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 ml-0 sm:ml-2">
              {Object.entries(filters).map(([key, val]) => {
                if (!val) return null
                const filterKey = key as keyof StatsFilters
                const labelMap: Record<keyof StatsFilters, string> = {
                  source: "Source",
                  page: "Page",
                  country: "Country",
                  browser: "Browser",
                  device: "Device",
                  os: "OS",
                }
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/90 pl-2.5 pr-1.5 py-0.5 text-xs font-semibold text-[#1868db] shadow-2xs animate-in fade-in-0"
                  >
                    <span className="text-slate-500 font-medium text-[11px]">{labelMap[filterKey]}:</span>
                    <span className="font-bold">{val}</span>
                    <button
                      type="button"
                      onClick={() => removeFilter(filterKey)}
                      className="rounded-full p-0.5 hover:bg-blue-200/80 text-blue-600 hover:text-blue-900 transition-colors cursor-pointer"
                      title={`Remove ${labelMap[filterKey]} filter`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )
              })}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition-colors underline px-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-[4px] p-1 shadow-xs self-start md:self-auto">
          {[
            { key: "24h", label: "24 Hours" },
            { key: "7d", label: "7 Days" },
            { key: "30d", label: "30 Days" },
            { key: "12m", label: "12 Months" },
          ].map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-[4px] transition-colors",
                period === p.key
                  ? "bg-[#1868db] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* TOP INTERACTIVE CARD: 4 CLICKABLE METRICS HEADER + GRAPH */}
      <Card className="w-full overflow-hidden border-neutral-200/90 bg-white shadow-xs">
        <CardHeader className="p-0 border-b border-neutral-200/80">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200/80">
            {metricsConfig.map((metric) => {
              const change = metric.changePct
              const isPositive = metric.isNegative ? change < 0 : change > 0
              const isSelected = selectedMetric === metric.key

              return (
                <button
                  key={metric.key}
                  type="button"
                  onClick={() => setSelectedMetric(metric.key)}
                  className={cn(
                    "cursor-pointer flex flex-col justify-between text-left p-4 sm:p-5 transition-all relative select-none",
                    isSelected
                      ? "bg-neutral-50/90 text-neutral-900"
                      : "bg-white text-neutral-700 hover:bg-neutral-50/50"
                  )}
                >
                  {/* Top active indicator line */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-0.75 bg-[#1868db] rounded-t" />
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-[11px] font-bold tracking-wider uppercase",
                        isSelected ? "text-[#1868db] underline underline-offset-4 decoration-2" : "text-slate-500"
                      )}
                    >
                      {metric.label}
                    </span>

                    {change !== 0 && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.2 rounded-md",
                          isPositive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                        )}
                      >
                        {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                        {Math.abs(change).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 font-mono">
                      {metric.format(metric.value)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div
            ref={chartContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
            className="relative h-72 sm:h-80 w-full select-none cursor-crosshair"
          >
            {points.length > 0 ? (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Dot Grid Pattern */}
                  <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="#e5e5e5" fillOpacity="1" />
                  </pattern>

                  {/* Drop shadow filter for active metric line */}
                  <filter id="lineShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor={currentMetric?.color || "#6366f1"} floodOpacity="0.35" />
                  </filter>

                  {/* Soft gradient fill for area */}
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={currentMetric?.color || "#6366f1"} stopOpacity="0.12" />
                    <stop offset="100%" stopColor={currentMetric?.color || "#6366f1"} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Background Dot Grid */}
                <rect x={paddingX} y={10} width={svgWidth - paddingX * 2} height={svgHeight - paddingY - 10} fill="url(#dotGrid)" />

                {/* Area fill */}
                {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

                {/* Smooth Monotone Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={currentMetric?.color || "#6366f1"}
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#lineShadow)"
                  />
                )}

                {/* Horizontal guideline ticks */}
                {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = svgHeight - paddingY - ratio * (svgHeight - paddingY * 2)
                  const val = minVal + ratio * (maxVal - minVal)
                  return (
                    <g key={idx}>
                      <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#f5f5f5" strokeDasharray="3 3" />
                      <text x={paddingX - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#a3a3a3" fontFamily="sans-serif">
                        {currentMetric?.format(val)}
                      </text>
                    </g>
                  )
                })}

                {/* X-axis date labels */}
                {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 6)) === 0 || i === points.length - 1).map((pt, i) => (
                  <text
                    key={i}
                    x={pt.x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#737373"
                    fontFamily="sans-serif"
                  >
                    {pt.data.label.includes(", ") ? (pt.data.label.split(", ")[1] ?? pt.data.label) : pt.data.label}
                  </text>
                ))}

                {/* Active Hover Crosshair Line & Glowing Point */}
                {activeHoverPoint && (
                  <g>
                    <line
                      x1={activeHoverPoint.x}
                      y1={10}
                      x2={activeHoverPoint.x}
                      y2={svgHeight - paddingY}
                      stroke="#a3a3a3"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <circle
                      cx={activeHoverPoint.x}
                      cy={activeHoverPoint.y}
                      r="6"
                      fill={currentMetric?.color || "#6366f1"}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                  </g>
                )}
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                No timeseries records for this period
              </div>
            )}

            {/* Floating Custom Tooltip */}
            {activeHoverPoint && currentMetric && (
              <div
                style={{
                  left: `${(activeHoverPoint.x / svgWidth) * 100}%`,
                  top: `${Math.max(10, (activeHoverPoint.y / svgHeight) * 100 - 35)}%`,
                  transform: "translate(-50%, -100%)",
                }}
                className="absolute pointer-events-none z-20 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-white shadow-xl min-w-[130px] animate-in fade-in-0 zoom-in-95"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: currentMetric.color }} />
                  <span>{currentMetric.label}</span>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between gap-3">
                  <span className="text-[11px] text-neutral-300">{activeHoverPoint.data.label}</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {currentMetric.format(activeHoverPoint.val)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MIDDLE ROW: TOP SOURCES & TOP PAGES CARDS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Sources Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Top Sources</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSourcesTab("all")}
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded transition-colors",
                    sourcesTab === "all" ? "text-indigo-600 bg-indigo-50" : "text-neutral-500 hover:text-neutral-800"
                  )}
                >
                  All
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-neutral-400 pt-3 pb-1 px-1">
              <span>Source</span>
              <span>Visitors</span>
            </div>

            {sourcesData.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No referrers recorded yet
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                {sourcesData.slice(0, 7).map((item) => {
                  const isFiltered = filters.source === item.label
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFilter("source", item.label)}
                      onDoubleClick={() => toggleFilter("source", item.label)}
                      title="Click or double-click to filter by this referrer source"
                      className={cn(
                        "group relative flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-medium overflow-hidden transition-all cursor-pointer select-none",
                        isFiltered
                          ? "ring-1.5 ring-[#1868db] bg-blue-50/80 font-bold"
                          : "hover:bg-neutral-50"
                      )}
                    >
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className={cn(
                          "absolute inset-y-0 left-0 rounded -z-10 transition-all",
                          isFiltered ? "bg-blue-100/70" : "bg-neutral-100/80 group-hover:bg-neutral-200/60"
                        )}
                      />

                      <div className="flex items-center gap-2 z-10 truncate">
                        <SourceFavicon label={item.label} />
                        <span className="text-neutral-900 font-semibold truncate">{item.label}</span>
                      </div>

                      <span className="text-neutral-800 font-bold font-mono z-10 shrink-0">
                        {item.value}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {sourcesData.length > 0 && (
            <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-center">
              <button
                type="button"
                onClick={() => openDetailsModal("Top Traffic Sources", "Referrers and campaign origins", sourcesData, "source")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-indigo-600 transition-colors"
              >
                <Maximize2 className="size-3" /> Details
              </button>
            </div>
          )}
        </div>

        {/* Top Pages Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Top Pages</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPagesTab("top")}
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded transition-colors",
                    pagesTab === "top" ? "text-indigo-600 bg-indigo-50" : "text-neutral-500 hover:text-neutral-800"
                  )}
                >
                  Top Pages
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-neutral-400 pt-3 pb-1 px-1">
              <span>Page</span>
              <span>Visitors</span>
            </div>

            {pagesData.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No pageviews recorded yet
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                {pagesData.slice(0, 7).map((item) => {
                  const isFiltered = filters.page === item.label
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFilter("page", item.label)}
                      onDoubleClick={() => toggleFilter("page", item.label)}
                      title="Click or double-click to filter by this page"
                      className={cn(
                        "group relative flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-medium overflow-hidden transition-all cursor-pointer select-none",
                        isFiltered
                          ? "ring-1.5 ring-[#1868db] bg-blue-50/80 font-bold"
                          : "hover:bg-neutral-50"
                      )}
                    >
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className={cn(
                          "absolute inset-y-0 left-0 rounded -z-10 transition-all",
                          isFiltered ? "bg-blue-100/70" : "bg-amber-50/80 group-hover:bg-amber-100/70"
                        )}
                      />

                      <div className="flex items-center gap-1.5 z-10 truncate max-w-[80%]">
                        <span className="text-neutral-900 font-mono text-[11px] truncate">
                          {item.label}
                        </span>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-neutral-400 hover:text-neutral-700 inline-flex shrink-0"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>

                      <span className="text-neutral-800 font-bold font-mono z-10 shrink-0">
                        {item.value}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {pagesData.length > 0 && (
            <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-center">
              <button
                type="button"
                onClick={() => openDetailsModal("Top Pages & Screens", "Visited paths and entry points", pagesData, "page")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-indigo-600 transition-colors"
              >
                <Maximize2 className="size-3" /> Details
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: LOCATIONS (WORLD MAP) & DEVICES CARDS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Locations Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Locations</h3>
              <div className="flex items-center gap-1">
                {(["map", "countries"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setLocationsTab(tab)}
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded capitalize transition-colors",
                      locationsTab === tab ? "text-indigo-600 bg-indigo-50" : "text-neutral-500 hover:text-neutral-800"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {locationsTab === "map" ? (
              <div className="pt-2">
                <WorldMap
                  locations={stats?.locations || []}
                  onSelectCountry={(country) => toggleFilter("country", country)}
                />
              </div>
            ) : countriesData.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No location data recorded yet
              </div>
            ) : (
              <div className="space-y-1.5 pt-2">
                {countriesData.map((item) => {
                  const isFiltered = filters.country === item.label
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFilter("country", item.label)}
                      onDoubleClick={() => toggleFilter("country", item.label)}
                      title="Click or double-click to filter by this country"
                      className={cn(
                        "flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer select-none",
                        isFiltered
                          ? "ring-1.5 ring-[#1868db] bg-blue-50/80 font-bold"
                          : "hover:bg-neutral-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span className="text-neutral-900">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-neutral-800 font-bold">{item.value}</span>
                        <span className="text-[11px] text-neutral-400 w-8 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {countriesData.length > 0 && (
            <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-center">
              <button
                type="button"
                onClick={() => openDetailsModal("Visitor Locations", "Geographic breakdown by countries", countriesData, "country")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-indigo-600 transition-colors"
              >
                <Maximize2 className="size-3" /> Details
              </button>
            </div>
          )}
        </div>

        {/* Devices Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Devices</h3>
              <div className="flex items-center gap-1">
                {(["size", "browser", "os"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDevicesTab(tab)}
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded capitalize transition-colors",
                      devicesTab === tab ? "text-indigo-600 bg-indigo-50" : "text-neutral-500 hover:text-neutral-800"
                    )}
                  >
                    {tab === "size" ? "Size" : tab === "browser" ? "Browser" : "OS"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-neutral-400 pt-3 pb-1 px-1">
              <span>{devicesTab === "size" ? "Screen size" : devicesTab === "browser" ? "Browser" : "Operating System"}</span>
              <span>Visitors</span>
            </div>

            {activeDeviceItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No device data recorded yet
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {activeDeviceItems.map((item) => {
                  const currentFilterKey: keyof StatsFilters =
                    devicesTab === "size" ? "device" : devicesTab === "browser" ? "browser" : "os"
                  const isFiltered = filters[currentFilterKey] === item.label
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFilter(currentFilterKey, item.label)}
                      onDoubleClick={() => toggleFilter(currentFilterKey, item.label)}
                      title={`Click or double-click to filter by ${item.label}`}
                      className={cn(
                        "group relative flex items-center justify-between py-2 px-2.5 rounded-lg text-xs font-medium overflow-hidden transition-all cursor-pointer select-none",
                        isFiltered
                          ? "ring-1.5 ring-[#1868db] bg-blue-50/80 font-bold"
                          : "hover:bg-neutral-50"
                      )}
                    >
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className={cn(
                          "absolute inset-y-0 left-0 rounded -z-10 transition-all",
                          isFiltered ? "bg-blue-100/70" : "bg-emerald-50 group-hover:bg-emerald-100/70"
                        )}
                      />

                      <div className="flex items-center gap-2 z-10">
                        {Icon && typeof Icon !== "string" && <Icon className="size-4 text-neutral-600 shrink-0" />}
                        <span className="text-neutral-900 font-semibold">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-2 z-10 font-mono">
                        <span className="text-neutral-900 font-bold">{item.value}</span>
                        <span className="text-[11px] text-neutral-500 font-sans">({item.percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {activeDeviceItems.length > 0 && (
            <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const currentFilterKey: keyof StatsFilters =
                    devicesTab === "size" ? "device" : devicesTab === "browser" ? "browser" : "os"
                  openDetailsModal("Device Breakdowns", "Screen sizes, browsers, and operating systems", activeDeviceItems, currentFilterKey)
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-indigo-600 transition-colors"
              >
                <Maximize2 className="size-3" /> Details
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DETAILS POPUP MODAL */}
      <DetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        subtitle={modalSubtitle}
        columns={[
          { label: "Item", key: "label" },
          { label: "Visitors", key: "value", align: "right" },
        ]}
        items={modalItems}
        onSelectItem={(item) => {
          if (modalFilterKey) {
            toggleFilter(modalFilterKey, item.label)
          }
          setModalOpen(false)
        }}
      />
    </div>
  )
}



