"use client"

import React, { useState, useEffect } from "react"
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
  ExternalLink,
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
  user_agent_category?: string
  consent_version?: string
  created_at: string
}

export function ConsentLedger() {
  const { activeDomain } = useDomain()
  const [receipts, setReceipts] = useState<ConsentReceipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReceipt, setSelectedReceipt] = useState<ConsentReceipt | null>(null)

  useEffect(() => {
    if (!activeDomain) {
      setIsLoading(false)
      return
    }
    fetchReceipts()
  }, [activeDomain])

  const fetchReceipts = async () => {
    if (!activeDomain) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/v1/consent/receipts?domain=${encodeURIComponent(activeDomain)}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setReceipts(data || [])
      }
    } catch (err) {
      console.error("Failed to load consent records:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const exportCSV = () => {
    if (receipts.length === 0) return
    const headers = "Consent ID,Domain,Visitor Hash,Country,Consent Given,Necessary,Functional,Analytics,Performance,Advertisement,Device,Version,Timestamp\n"
    const rows = receipts
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
          r.advertisement ? "1" : "0",
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
    link.setAttribute("download", `consent-audit-trail-${activeDomain}-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredReceipts = receipts.filter(
    (r) =>
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.visitor_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.country && r.country.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#1868db]" />
            <h2 className="text-base font-bold text-slate-900">GDPR Proof-of-Consent Audit Trail</h2>
            <span className="text-xs px-2 py-0.5 rounded-[4px] bg-blue-50 text-[#1868db] font-bold border border-blue-200">
              Cryptographically Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of visitor consent events, regulatory versions, and category preferences for{" "}
            <strong className="text-slate-700">{activeDomain || "your domain"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={exportCSV}
            disabled={receipts.length === 0}
            variant="outline"
            className="rounded-[4px] text-xs font-bold px-3.5 py-1.5 h-8.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative">
        <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Consent ID, Visitor Hash, or Country..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-[4px] text-xs focus:outline-hidden focus:border-[#1868db]"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading audit receipts...</div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="size-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700">No consent receipts logged yet</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Consent events from visitors interacting with your banner will appear here with tamper-evident records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                  <th className="py-2.5 px-4">Consent ID & Hash</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Consented Categories</th>
                  <th className="py-2.5 px-4">Country & Device</th>
                  <th className="py-2.5 px-4">Version</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4 text-right">Proof Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map((r) => (
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
                      {r.consent_given ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3" /> Consented
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <XCircle className="size-3" /> Rejected All
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
                        {r.advertisement && (
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof-of-Consent Certificate Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#1868db]" />
                <h3 className="text-sm font-bold text-slate-900">GDPR Proof-of-Consent Certificate</h3>
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
                This certificate serves as cryptographically verifiable legal proof that affirmative consent was captured in accordance with GDPR Article 7 and ePrivacy Directive.
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Anonymized Visitor Hash</span>
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
                    <strong>{selectedReceipt.advertisement ? "Granted" : "Blocked"}</strong>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-right">
                Logged at: {new Date(selectedReceipt.created_at).toUTCString()}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">ConsentOS Engine v2.3</span>
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
