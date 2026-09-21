"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Cookie,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Sparkles,
  Info,
  Clock,
  ShieldAlert,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  fetchScannerData,
  triggerCookieScan,
  updateDiscoveredCookie,
  DiscoveredCookie,
  ScanRun,
  PreConsentLeak,
} from "@/lib/api"
import { useDomain } from "@/lib/domain-context"
import { cn } from "@workspace/ui/lib/utils"

const CATEGORIES = [
  { key: "all", label: "All Cookies" },
  { key: "necessary", label: "Necessary", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { key: "functional", label: "Functional", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { key: "analytics", label: "Analytics", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  { key: "performance", label: "Performance", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { key: "advertisement", label: "Advertisement", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
]

export function CookieScannerView() {
  const { activeDomain, isLoadingSites, sites } = useDomain()

  const [cookies, setCookies] = useState<DiscoveredCookie[]>([])
  const [latestScan, setLatestScan] = useState<ScanRun | null>(null)
  const [leaks, setLeaks] = useState<PreConsentLeak[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [updatingCookieId, setUpdatingCookieId] = useState<string | null>(null)
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null)

  const loadScannerData = async () => {
    if (!activeDomain) {
      setIsLoading(false)
      setCookies([])
      setLatestScan(null)
      setLeaks([])
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchScannerData(activeDomain)
      setCookies(data?.cookies || [])
      setLatestScan(data?.latest_scan || null)
      setLeaks(data?.pre_consent_leaks || [])
    } catch (err: any) {
      console.error("Failed to load scanner data:", err)
      setError(err?.message || "Failed to load cookie scanner data.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadScannerData()
  }, [activeDomain])

  const handleRunScan = async () => {
    if (!activeDomain || isScanning) return
    setIsScanning(true)
    setError(null)
    setScanSuccessMessage(null)

    try {
      const result = await triggerCookieScan(activeDomain)
      setCookies(result.cookies || [])
      setLatestScan(result.latest_scan || null)
      setLeaks(result.pre_consent_leaks || [])
      setScanSuccessMessage(
        `Audit scan completed: ${result.cookies.length} cookies identified, ${result.pre_consent_leaks.length} pre-consent leaks flagged.`
      )
      setTimeout(() => setScanSuccessMessage(null), 6000)
    } catch (err: any) {
      console.error("Scan run error:", err)
      setError(err?.message || "Failed to complete audit scan.")
    } finally {
      setIsScanning(false)
    }
  }

  const handleCategoryChange = async (cookieId: string, newCategory: string) => {
    setUpdatingCookieId(cookieId)
    try {
      await updateDiscoveredCookie(cookieId, newCategory)
      setCookies((prev) =>
        prev.map((c) => (c.id === cookieId ? { ...c, category: newCategory as any } : c))
      )
    } catch (err: any) {
      alert(err?.message || "Failed to update category override")
    } finally {
      setUpdatingCookieId(null)
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
              Register a website to automatically scan cookies, track pre-consent leaks, and manage categories.
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

  const filteredCookies = cookies.filter((c) => {
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.service_name && c.service_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const countByCategory = (cat: string) => {
    if (cat === "all") return cookies.length
    return cookies.filter((c) => c.category === cat).length
  }

  const criticalLeaks = leaks.filter((l) => l.severity === "critical")

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Cookie Scanner & Tracker Inventory
            </h1>
            <Badge variant="outline" className="text-[11px] font-semibold bg-blue-50 text-[#1868db] border-blue-200">
              ConsentOS Engine
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Automatically crawl domain assets, classify tracking scripts, and detect pre-consent data leaks for{" "}
            <span className="font-semibold text-slate-800">{activeDomain || "your domain"}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRunScan}
            disabled={isScanning || !activeDomain}
            className="rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 py-2 h-9 shadow-xs transition-all flex items-center gap-2"
          >
            <RefreshCw className={cn("size-3.5", isScanning && "animate-spin")} />
            {isScanning ? "Scanning Domain..." : "Run Audit Scan"}
          </Button>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {scanSuccessMessage && (
        <div className="flex items-center gap-3 rounded-[4px] border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <p className="font-medium">{scanSuccessMessage}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-[4px] border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800">
          <AlertTriangle className="size-4 shrink-0 text-rose-600" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[4px] border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Cookies</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? "â€”" : cookies.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Discovered on {activeDomain}</p>
            </div>
            <div className="size-10 rounded-[4px] bg-slate-100 flex items-center justify-center text-slate-700">
              <Cookie className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[4px] border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Pre-Consent Leaks</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">
                {isLoading ? (
                  "â€”"
                ) : leaks.length === 0 ? (
                  <span className="text-emerald-600 flex items-center gap-1.5 text-lg font-bold">
                    <CheckCircle2 className="size-5 text-emerald-500" /> 0 Leaks
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1.5 text-lg font-bold">
                    <ShieldAlert className="size-5 text-rose-500" /> {leaks.length} Flagged
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {leaks.length === 0 ? "Compliant gating active" : "Unblocked trackers detected"}
              </p>
            </div>
            <div
              className={cn(
                "size-10 rounded-[4px] flex items-center justify-center",
                leaks.length === 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}
            >
              <ShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[4px] border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Script Signatures</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? "â€”" : latestScan?.scripts_found || 12}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Known vendor signatures</p>
            </div>
            <div className="size-10 rounded-[4px] bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[4px] border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Last Audit Run</p>
              <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">
                {isLoading ? (
                  "â€”"
                ) : latestScan?.created_at ? (
                  new Date(latestScan.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                ) : (
                  "Ready to scan"
                )}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Status: <span className="font-semibold text-emerald-600">{latestScan?.status || "Active"}</span>
              </p>
            </div>
            <div className="size-10 rounded-[4px] bg-slate-100 flex items-center justify-center text-slate-700">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PRE-CONSENT LEAKS PANEL (IF ANY) */}
      {leaks.length > 0 && (
        <Card className="rounded-[4px] border-amber-200 bg-amber-50/40 shadow-xs">
          <CardHeader className="p-4 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Pre-Consent Tracking Leaks Detected ({leaks.length})
              </h3>
            </div>
            <p className="text-xs text-amber-700 mt-0.5">
              These scripts or network requests fired before the visitor made a consent choice. Use script-blocking to gate them.
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {leaks.map((leak, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 p-2.5 rounded-[4px] bg-white border border-amber-200/80 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{leak.type}</span>
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300">
                      {leak.severity || "warning"}
                    </Badge>
                  </div>
                  <p className="text-slate-600 mt-0.5">{leak.description}</p>
                  {leak.url && <p className="text-[11px] font-mono text-slate-400 mt-1 truncate max-w-xl">{leak.url}</p>}
                </div>
                <Link
                  href="/consent/scripts"
                  className="shrink-0 text-xs font-semibold text-[#1868db] hover:underline flex items-center gap-1"
                >
                  Configure Gate <ExternalLink className="size-3" />
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* COOKIE TABLE SECTION */}
      <Card className="rounded-[4px] border-slate-200 shadow-xs bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search cookies, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs rounded-[4px] border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {CATEGORIES.map((cat) => {
                const count = countByCategory(cat.key)
                const isSelected = selectedCategory === cat.key
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-[4px] transition-all whitespace-nowrap flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-[#1868db] text-white border-[#1868db] shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1 py-0.2 rounded-full",
                        isSelected ? "bg-white/25 text-white" : "bg-slate-200/80 text-slate-600"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* COOKIES TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10.5px]">
                <th className="py-2.5 px-4">Cookie Identifier</th>
                <th className="py-2.5 px-4">Vendor / Service</th>
                <th className="py-2.5 px-4">Category Override</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Purpose / Description</th>
                <th className="py-2.5 px-4 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="size-5 animate-spin mx-auto text-slate-400 mb-2" />
                    Loading cookie inventory...
                  </td>
                </tr>
              ) : filteredCookies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Cookie className="size-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-600">No cookies found matching criteria</p>
                      <p className="text-[11px] text-slate-400">Run an audit scan or clear your search filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCookies.map((cookie) => (
                  <tr key={cookie.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {cookie.name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{cookie.service_name || "Custom / Host"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={cookie.category}
                        disabled={updatingCookieId === cookie.id}
                        onChange={(e) => handleCategoryChange(cookie.id, e.target.value)}
                        className={cn(
                          "h-7 text-xs font-semibold rounded-[4px] border px-2 py-0.5 bg-white shadow-xs focus:outline-none focus:ring-1 focus:ring-[#1868db] cursor-pointer",
                          cookie.category === "necessary" && "border-emerald-300 text-emerald-700 bg-emerald-50/50",
                          cookie.category === "functional" && "border-blue-300 text-blue-700 bg-blue-50/50",
                          cookie.category === "analytics" && "border-indigo-300 text-indigo-700 bg-indigo-50/50",
                          cookie.category === "performance" && "border-amber-300 text-amber-700 bg-amber-50/50",
                          cookie.category === "advertisement" && "border-purple-300 text-purple-700 bg-purple-50/50"
                        )}
                      >
                        <option value="necessary">Necessary</option>
                        <option value="functional">Functional</option>
                        <option value="analytics">Analytics</option>
                        <option value="performance">Performance</option>
                        <option value="advertisement">Advertisement</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {cookie.duration || "Session"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm leading-relaxed">
                      {cookie.description || "General site cookie"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold uppercase tracking-wider",
                          cookie.confidence === "high"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {cookie.confidence || "high"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

