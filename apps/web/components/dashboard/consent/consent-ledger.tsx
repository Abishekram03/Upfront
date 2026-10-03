"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useDomain } from "@/lib/domain-context"
import {
  FileText,
  Search,
  Download,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Printer,
  X,
  RefreshCw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"

interface ConsentReceipt {
  id: string
  site_id?: string
  domain: string
  visitor_hash: string
  country?: string
  consent_given: boolean
  necessary: boolean
  functional: boolean
  analytics: boolean
  performance: boolean
  advertisement: boolean
  marketing?: boolean
  user_agent_category?: string
  consent_version?: string
  created_at: string
}

export function ConsentLedger() {
  const { activeDomain } = useDomain()
  const [receipts, setReceipts] = useState<ConsentReceipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "accepted" | "rejected" | "custom">("all")
  const [selectedReceipt, setSelectedReceipt] = useState<ConsentReceipt | null>(null)

  // Pagination states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [totalRecords, setTotalRecords] = useState(0)

  const fetchReceipts = useCallback(async () => {
    if (!activeDomain) {
      setIsLoading(false)
      setReceipts([])
      setTotalRecords(0)
      return
    }

    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        domain: activeDomain,
        page: page.toString(),
        limit: pageSize.toString(),
      })

      if (searchQuery.trim()) {
        queryParams.set("search", searchQuery.trim())
      }

      const res = await fetch(`/api/v1/consent/receipts?${queryParams.toString()}`)
      if (res.ok) {
        const data: ConsentReceipt[] = await res.json()
        setReceipts(data || [])

        // Extract total count from response header if available
        const totalHeader = res.headers.get("x-total-count")
        if (totalHeader) {
          const parsed = parseInt(totalHeader, 10)
          if (!isNaN(parsed)) {
            setTotalRecords(parsed)
          }
        } else {
          setTotalRecords(data.length)
        }
      }
    } catch (err) {
      console.error("Failed to load consent records:", err)
    } finally {
      setIsLoading(false)
    }
  }, [activeDomain, page, pageSize, searchQuery])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  // Filter in-memory for category status tabs
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const isAd = r.advertisement || r.marketing || false
      const isAcceptedAll = r.consent_given && r.functional && r.analytics && r.performance && isAd
      const isRejectedAll = !r.consent_given && !r.functional && !r.analytics && !r.performance && !isAd

      if (filterType === "accepted") return isAcceptedAll || r.consent_given
      if (filterType === "rejected") return isRejectedAll
      if (filterType === "custom") return !isAcceptedAll && !isRejectedAll && r.consent_given
      return true
    })
  }, [receipts, filterType])

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))

  const exportCSV = () => {
    if (filteredReceipts.length === 0) return
    const headers =
      "Consent ID,Domain,Visitor Hash,Country,Consent Given,Necessary,Functional,Analytics,Performance,Advertisement,Device,Version,Timestamp\n"
    const rows = filteredReceipts
      .map((r) =>
        [
          r.id,
          r.domain,
          r.visitor_hash,
          r.country || "Global",
          r.consent_given ? "YES" : "NO",
          r.necessary ? "1" : "0",
          r.functional ? "1" : "0",
          r.analytics ? "1" : "0",
          r.performance ? "1" : "0",
          r.advertisement || r.marketing ? "1" : "0",
          r.user_agent_category || "Desktop",
          r.consent_version || "1.0",
          r.created_at,
        ].join(",")
      )
      .join("\n")

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `consent-audit-trail-${activeDomain}-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Consent Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident audit log of visitor consent choices, regulatory versions, and category preferences for{" "}
            <strong className="text-slate-700">{activeDomain || "your domain"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchReceipts()}
            disabled={isLoading}
            variant="outline"
            className="rounded-[4px] text-xs font-semibold px-3 py-1.5 h-8.5 flex items-center gap-1.5 cursor-pointer bg-white text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={cn("size-3.5 text-[#1868db]", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={exportCSV}
            disabled={filteredReceipts.length === 0}
            className="rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-3.5 py-1.5 h-8.5 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-[4px] border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search by Consent ID, Visitor Hash, or Country..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[4px] border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#1868db] focus:bg-white transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-[4px] border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={cn(
              "px-2.5 py-1 rounded-[4px] font-bold transition-all cursor-pointer",
              filterType === "all" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType("accepted")}
            className={cn(
              "px-2.5 py-1 rounded-[4px] font-bold transition-all cursor-pointer",
              filterType === "accepted" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Accepted All
          </button>
          <button
            type="button"
            onClick={() => setFilterType("rejected")}
            className={cn(
              "px-2.5 py-1 rounded-[4px] font-bold transition-all cursor-pointer",
              filterType === "rejected" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Rejected All
          </button>
          <button
            type="button"
            onClick={() => setFilterType("custom")}
            className={cn(
              "px-2.5 py-1 rounded-[4px] font-bold transition-all cursor-pointer",
              filterType === "custom" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Partially Accepted
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="size-5 animate-spin mx-auto text-[#1868db] mb-2" />
            Loading audit receipts...
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="size-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700">No consent receipts logged yet</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
              {searchQuery
                ? "No consent receipts match your search query."
                : "Consent events from visitors interacting with your banner will appear here with tamper-evident records."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Consent ID & Hash</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Accepted Categories</th>
                  <th className="py-2.5 px-4">Country & Device</th>
                  <th className="py-2.5 px-4">Version</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4 text-right">Proof Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map((r) => {
                  const isAd = r.advertisement || r.marketing || false
                  const isAcceptedAll = r.consent_given && r.functional && r.analytics && r.performance && isAd
                  const isRejectedAll = !r.consent_given && !r.functional && !r.analytics && !r.performance && !isAd

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-[11px] truncate max-w-[140px]">
                          {r.id.slice(0, 13)}...
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          {r.visitor_hash.slice(0, 16)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isAcceptedAll ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" /> Accepted All
                          </span>
                        ) : isRejectedAll ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <XCircle className="size-3" /> Rejected All
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-blue-50 text-[#1868db] border border-blue-200">
                            <Sliders className="size-3" /> Partially Accepted
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                            NEC
                          </span>
                          {r.functional && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              FUNC
                            </span>
                          )}
                          {r.analytics && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              ANA
                            </span>
                          )}
                          {r.performance && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              PERF
                            </span>
                          )}
                          {isAd && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              ADV
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Globe className="size-3 text-slate-400" />
                          <span>{r.country || "Global"}</span>
                          <span className="text-slate-300">•</span>
                          {r.user_agent_category === "Mobile" ? (
                            <Smartphone className="size-3 text-slate-400" />
                          ) : (
                            <Monitor className="size-3 text-slate-400" />
                          )}
                          <span className="text-[10px] text-slate-500">{r.user_agent_category || "Desktop"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        v{r.consent_version || "1.0"}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReceipt(r)}
                          className="h-7 text-[11px] font-bold rounded-[4px] cursor-pointer"
                        >
                          View Receipt
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Records summary and page size selector */}
          <div className="flex items-center gap-3 text-slate-600">
            <span>
              Showing{" "}
              <strong>
                {totalRecords === 0 ? 0 : (page - 1) * pageSize + 1} -{" "}
                {Math.min(page * pageSize, totalRecords)}
              </strong>{" "}
              of <strong>{totalRecords}</strong> records
            </span>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-slate-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10))
                  setPage(1)
                }}
                className="bg-white border border-slate-200 rounded-[3px] px-2 py-0.5 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:border-[#1868db]"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page === 1 || isLoading}
              className="p-1.5 rounded-[4px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="px-2.5 py-1 rounded-[4px] border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="size-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-3 py-1 font-bold text-slate-800 bg-white border border-slate-200 rounded-[4px]">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="px-2.5 py-1 rounded-[4px] border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-[4px] border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Proof-of-Consent Certificate Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#1868db]" />
                <h3 className="text-sm font-bold text-slate-900">Proof-of-Consent Audit Record</h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-900 text-[11px]">
                This record captures a timestamped audit trail of affirmative consent signals designed to support GDPR Article 7 record-keeping requirements.
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Consent Identifier</span>
                  <span className="font-mono text-[11px] font-bold text-slate-900 break-all">{selectedReceipt.id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Domain Name</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.domain}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Pseudonymous Visitor Hash</span>
                  <span className="font-mono text-[10.5px] text-slate-700 break-all">{selectedReceipt.visitor_hash}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Regulatory Version</span>
                  <span className="font-bold text-slate-900">Consent Policy v{selectedReceipt.consent_version || "1.0"}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-3 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Category Decisions</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
                    <span>Necessary Cookies:</span>
                    <strong className="text-emerald-600">Granted (Always)</strong>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
                    <span>Functional Cookies:</span>
                    <strong>{selectedReceipt.functional ? "Granted" : "Blocked"}</strong>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
                    <span>Analytics Tracking:</span>
                    <strong>{selectedReceipt.analytics ? "Granted" : "Blocked"}</strong>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
                    <span>Performance Tracking:</span>
                    <strong>{selectedReceipt.performance ? "Granted" : "Blocked"}</strong>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded col-span-2">
                    <span>Advertisement & Retargeting:</span>
                    <strong>{selectedReceipt.advertisement || selectedReceipt.marketing ? "Granted" : "Blocked"}</strong>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-right">
                Logged at: {new Date(selectedReceipt.created_at).toUTCString()}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReceipt(null)}
                  className="text-xs font-bold rounded-[4px] h-8"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold rounded-[4px] h-8 flex items-center gap-1.5"
                >
                  <Printer className="size-3.5" />
                  Print Proof
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
