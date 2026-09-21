"use client"

import React, { useState, useEffect } from "react"
import { useDomain } from "@/lib/domain-context"
import {
  Radar,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Cookie,
  FileCode,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"

interface ScanRecord {
  id: string
  domain: string
  status: string
  cookies_found: number
  scripts_found: number
  leaks_found: number
  dark_patterns_found?: number
  created_at: string
  findings?: Array<{
    type: "leak" | "info" | "warning"
    message: string
    severity: "critical" | "medium" | "low"
  }>
}

export function ScannerDashboard() {
  const { activeDomain } = useDomain()
  const [latestScan, setLatestScan] = useState<ScanRecord | null>(null)
  const [discoveredCookies, setDiscoveredCookies] = useState<any[]>([])
  const [leaks, setLeaks] = useState<any[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [scanProgress, setScanProgress] = useState<string>("")

  useEffect(() => {
    if (!activeDomain) {
      setIsLoading(false)
      return
    }
    fetchScanData()
  }, [activeDomain])

  const fetchScanData = async () => {
    if (!activeDomain) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/v1/consent/scanner?domain=${encodeURIComponent(activeDomain)}`)
      if (res.ok) {
        const data = await res.json()
        setLatestScan(data.latest_scan || null)
        setDiscoveredCookies(data.cookies || [])
        setLeaks(data.pre_consent_leaks || [])
      }
    } catch (err) {
      console.error("Error fetching scanner details:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const triggerScan = async () => {
    if (!activeDomain || isScanning) return
    setIsScanning(true)
    setScanProgress("Connecting to crawler service...")

    try {
      setTimeout(() => setScanProgress("Visiting URLs & executing DOM..."), 1200)
      setTimeout(() => setScanProgress("Matching against Open Cookie Database (2,200+ signatures)..."), 2500)
      setTimeout(() => setScanProgress("Analyzing pre-consent network leaks & cookies..."), 4000)

      const res = await fetch("/api/v1/consent/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: activeDomain }),
      })

      if (res.ok) {
        const data = await res.json()
        setLatestScan(data.scan || null)
        await fetchScanData()
      } else {
        alert("Crawler scan failed. Please verify that the domain is reachable.")
      }
    } catch (err) {
      console.error("Scan trigger error:", err)
    } finally {
      setIsScanning(false)
      setScanProgress("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Scanner Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="size-5 text-[#1868db]" />
            <h2 className="text-base font-bold text-slate-900">Automated Website Scanner</h2>
            <span className="text-xs px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Open Cookie DB v2.3
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Headless browser crawler automatically indexes cookies, local storage keys, and third-party trackers on{" "}
            <strong className="text-slate-700">{activeDomain || "your site"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={triggerScan}
            disabled={isScanning || !activeDomain}
            className="rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-2 h-9 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={cn("size-3.5", isScanning && "animate-spin")} />
            {isScanning ? "Scanning Site..." : "Run New Scan"}
          </Button>
        </div>
      </div>

      {/* Live Scan Status Banner */}
      {isScanning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 animate-pulse">
          <Radar className="size-5 text-[#1868db] animate-spin" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-blue-900">Deep Scanner Active</h4>
            <p className="text-[11px] text-blue-700">{scanProgress}</p>
          </div>
        </div>
      )}

      {/* Scanner Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Cookies Discovered</span>
            <Cookie className="size-4 text-[#1868db]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {latestScan ? latestScan.cookies_found : discoveredCookies.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">First & third-party tags</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Scripts Indexed</span>
            <FileCode className="size-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {latestScan ? latestScan.scripts_found : 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Vendor SDKs & pixels</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Pre-Consent Leaks</span>
            <ShieldAlert className="size-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {latestScan ? latestScan.leaks_found : leaks.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {leaks.length === 0 ? "Zero non-consented tracking" : "Requires auto-blocker"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Last Scan Time</span>
            <Clock className="size-4 text-slate-400" />
          </div>
          <div className="text-xs font-bold text-slate-800 mt-3 truncate">
            {latestScan ? new Date(latestScan.created_at).toLocaleString() : "Never scanned"}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Status: Ready</div>
        </div>
      </div>

      {/* Pre-Consent Leak Warnings */}
      {leaks.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
            <AlertTriangle className="size-4 text-rose-600" />
            <span>Compliance Warning: {leaks.length} tracking script(s) fired before user consent</span>
          </div>
          <p className="text-[11px] text-rose-700 leading-relaxed">
            Under GDPR, ePrivacy, and LGPD, non-essential cookies and analytics scripts cannot execute before explicit affirmative consent is captured.
          </p>
          <div className="space-y-1.5 pt-1">
            {leaks.map((leak, idx) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded border border-rose-200 text-xs text-slate-800 flex items-start gap-2"
              >
                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] uppercase">
                  {leak.severity || "Critical"}
                </span>
                <span className="font-mono text-[11px]">{leak.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovered Cookies & Scripts Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-xs font-bold text-slate-800">Scanned Tracking Inventory ({discoveredCookies.length})</h3>
          <span className="text-[11px] text-slate-500">Auto-synchronized with Cookie Catalog</span>
        </div>

        {discoveredCookies.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No scanned data yet. Click &quot;Run New Scan&quot; above to discover all trackers on {activeDomain}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                  <th className="py-2.5 px-4">Identifier</th>
                  <th className="py-2.5 px-4">Service Provider</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Detection Method</th>
                  <th className="py-2.5 px-4 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discoveredCookies.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-4 text-slate-700">{c.service_name || "First-Party"}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1868db] border border-blue-200 text-[10px] font-bold capitalize">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{c.duration || "Session"}</td>
                    <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                      Open Cookie Database Pattern
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="size-3" />
                        {c.confidence || "High"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
