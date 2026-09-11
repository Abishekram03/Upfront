"use client"

import { useState, useEffect, useMemo } from "react"
import {
  FileCheck,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  Shield,
  CheckCircle2,
  XCircle,
  Globe,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useDomain } from "@/lib/domain-context"
import { fetchConsentReceipts, ConsentReceipt } from "@/lib/api"
import { cn } from "@workspace/ui/lib/utils"

export function ConsentLogs() {
  const { activeDomain, isLoadingSites } = useDomain()

  const [receipts, setReceipts] = useState<ConsentReceipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "accepted" | "rejected" | "custom">("all")
  const [page, setPage] = useState(1)
  const pageSize = 15

  const loadReceipts = async () => {
    if (!activeDomain) {
      setIsLoading(false)
      setReceipts([])
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchConsentReceipts(activeDomain, 1, 100)
      setReceipts(data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load consent logs")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReceipts()
  }, [activeDomain])

  // Filter & Search Logic
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Search match
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        r.id.toLowerCase().includes(query) ||
        r.visitor_hash.toLowerCase().includes(query) ||
        (r.country && r.country.toLowerCase().includes(query)) ||
        (r.user_agent_category && r.user_agent_category.toLowerCase().includes(query))

      if (!matchesSearch) return false

      const isAd = r.advertisement || r.marketing || false
      const allAccepted = r.consent_given && r.functional && r.analytics && r.performance && isAd
      const allRejected = !r.consent_given && !r.functional && !r.analytics && !r.performance && !isAd

      // Status filter
      if (filterType === "accepted") {
        return allAccepted
      }
      if (filterType === "rejected") {
        return allRejected
      }
      if (filterType === "custom") {
        return !allAccepted && !allRejected
      }

      return true
    })
  }, [receipts, searchQuery, filterType])

  // Pagination calculation
  const totalPages = Math.ceil(filteredReceipts.length / pageSize) || 1
  const paginatedReceipts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredReceipts.slice(start, start + pageSize)
  }, [filteredReceipts, page, pageSize])

  // Export CSV
  const handleExportCSV = () => {
    if (filteredReceipts.length === 0) return

    const headers = [
      "Receipt ID",
      "Timestamp (UTC)",
      "Domain",
      "Visitor Hash",
      "Country",
      "Decision",
      "Necessary",
      "Functional",
      "Analytics",
      "Performance",
      "Advertisement",
      "Device Category",
    ]

    const rows = filteredReceipts.map((r) => [
      r.id,
      new Date(r.created_at).toISOString(),
      r.domain,
      r.visitor_hash,
      r.country || "Unknown",
      r.consent_given ? (r.analytics && (r.advertisement || r.marketing) ? "Accepted All" : "Customised") : "Rejected All",
      r.necessary ? "Granted" : "Denied",
      r.functional ? "Granted" : "Denied",
      r.analytics ? "Granted" : "Denied",
      r.performance ? "Granted" : "Denied",
      (r.advertisement || r.marketing) ? "Granted" : "Denied",
      r.user_agent_category || "Desktop",
    ])

    const csvContent = [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `consent-audit-vault-${activeDomain}-${new Date().toISOString().split("T")[0] ?? "export"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Proof of Consent Vault</h1>
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
              <Shield className="size-3 text-[#1868db]" /> GDPR Article 7(1) Audit Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-proof cryptographic receipt log for visitors on <strong className="text-slate-800">{activeDomain || "your site"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadReceipts}
            disabled={isLoading}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-[4px] px-3 py-1.5 shadow-2xs transition-colors inline-flex items-center"
          >
            <RefreshCw className={cn("size-3.5 mr-1.5 text-[#1868db]", isLoading && "animate-spin")} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredReceipts.length === 0}
            className="text-xs bg-[#1868db] hover:bg-[#1559be] text-white font-bold rounded-[4px] px-3.5 py-1.5 shadow-xs transition-colors inline-flex items-center disabled:opacity-50"
          >
            <Download className="size-3.5 mr-1.5" />
            Export Audit CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-[4px] border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Visitor Hash, Receipt ID, Country, Device..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[4px] border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#1868db] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-[4px] border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterType("all")
                setPage(1)
              }}
              className={cn(
                "px-2.5 py-1 rounded-[4px] font-bold transition-all",
                filterType === "all" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              All ({receipts.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType("accepted")
                setPage(1)
              }}
              className={cn(
                "px-2.5 py-1 rounded-[4px] font-bold transition-all",
                filterType === "accepted" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Accepted All
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType("rejected")
                setPage(1)
              }}
              className={cn(
                "px-2.5 py-1 rounded-[4px] font-bold transition-all",
                filterType === "rejected" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Rejected All
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType("custom")
                setPage(1)
              }}
              className={cn(
                "px-2.5 py-1 rounded-[4px] font-bold transition-all",
                filterType === "custom" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Custom
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-[4px] border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Visitor / Hash</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">5 Categories Granted</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4 text-right">Receipt ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-3 w-28 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-3 w-20 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-3 w-12 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 w-16 bg-slate-100 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-3 w-16 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-3 w-16 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileCheck className="size-8 text-[#1868db]/40 stroke-1" />
                      <p className="text-sm font-bold text-slate-700">No consent receipts found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchQuery
                          ? "No receipts match your search query."
                          : "When visitors interact with your consent banner on your website, cryptographically signed receipts will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReceipts.map((receipt) => {
                  const isAd = receipt.advertisement || receipt.marketing || false
                  const isAcceptedAll = receipt.consent_given && receipt.functional && receipt.analytics && receipt.performance && isAd
                  const isRejectedAll = !receipt.consent_given && !receipt.functional && !receipt.analytics && !receipt.performance && !isAd

                  return (
                    <tr key={receipt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {formatTimestamp(receipt.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-[3px] text-[11px] border border-slate-200">
                          {receipt.visitor_hash ? `${receipt.visitor_hash.slice(0, 10)}...` : "anonymous"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Globe className="size-3 text-slate-400" />
                          {receipt.country || "Global"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isAcceptedAll ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" /> Accepted All
                          </span>
                        ) : isRejectedAll ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="size-3" /> Rejected All
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-blue-50 text-[#1868db] border border-blue-200">
                            <Sliders className="size-3" /> Custom
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-slate-100 text-slate-700">
                            Nec
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium",
                              receipt.functional
                                ? "bg-blue-50 text-[#1868db] border border-blue-200"
                                : "bg-slate-50 text-slate-400 border border-slate-200 line-through"
                            )}
                          >
                            Func
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium",
                              receipt.analytics
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-slate-50 text-slate-400 border border-slate-200 line-through"
                            )}
                          >
                            Ana
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium",
                              receipt.performance
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-slate-50 text-slate-400 border border-slate-200 line-through"
                            )}
                          >
                            Perf
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium",
                              isAd
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-50 text-slate-400 border border-slate-200 line-through"
                            )}
                          >
                            Ad
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {receipt.user_agent_category || "Desktop"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                        {receipt.id.slice(0, 8)}...
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="text-slate-500">
              Showing <strong>{(page - 1) * pageSize + 1}</strong> to{" "}
              <strong>{Math.min(page * pageSize, filteredReceipts.length)}</strong> of{" "}
              <strong>{filteredReceipts.length}</strong> receipts
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 rounded-[4px] border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-800">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 rounded-[4px] border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
