"use client"

import { useState } from "react"
import { Copy, Check, Code2, HelpCircle, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from "lucide-react"
import { ConsentStatsSummary } from "@/lib/api"
import { cn } from "@/lib/utils"

interface InstallationCardProps {
  activeDomain: string
  stats: ConsentStatsSummary | null
  isLoading: boolean
}

export function InstallationCard({ activeDomain, stats, isLoading }: InstallationCardProps) {
  const [copied, setCopied] = useState(false)

  const isConnected = stats?.is_connected ?? (stats?.total_receipts ? stats.total_receipts > 0 : false)
  const lastDetected = stats?.last_detected_at

  const scriptHost = typeof window !== "undefined" ? window.location.origin : "https://usrly-five.vercel.app"
  const domainPlaceholder = activeDomain || "your-domain.com"
  const snippet = `<script defer data-domain="${domainPlaceholder}" src="${scriptHost}/userly.js"></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format last detected timestamp
  const formatLastDetected = (isoStr?: string | null) => {
    if (!isoStr) return null
    try {
      const date = new Date(isoStr)
      if (isNaN(date.getTime())) return null
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return null
    }
  }

  const lastSeen = formatLastDetected(lastDetected)

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Code2 className="size-4 text-[#1868db]" />
            <h2 className="text-sm font-bold text-slate-900">
              Install Single-Tag SDK on {activeDomain || "your site"}
            </h2>
            <div className="relative group cursor-pointer inline-flex items-center">
              <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-80 p-2.5 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                Add this single lightweight (&lt;4KB) tag to your site&apos;s &lt;head&gt;. It automatically enforces consent, triggers Google Consent Mode v2, and captures audit receipts.
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Unifies Cookieless Web Analytics and Privacy Consent Banner in a single script tag.
          </p>
        </div>

        {/* Integration Status Badge */}
        <div className="flex items-center gap-2 text-xs">
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
            isConnected 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          )}>
            <span className={cn("size-2 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
            <span>{isConnected ? "Connected" : "Not Detected"}</span>
            {lastSeen && (
              <span className="text-[10px] font-normal text-slate-500">
                (Last seen {lastSeen})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Code Snippet Box with Copy Button */}
      <div className="relative rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 shadow-2xs">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy SDK script tag"
          className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1868db]"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 text-slate-500" />
              <span>Copy</span>
            </>
          )}
        </button>

        <pre className="font-mono text-xs overflow-x-auto pr-24 leading-relaxed select-all text-slate-800">
          <code>
            <span className="text-blue-700 font-semibold">&lt;script</span>{" "}
            <span className="text-purple-700 font-medium">defer</span>{" "}
            <span className="text-purple-700 font-medium">data-domain</span>=
            <span className="text-emerald-700">&quot;{domainPlaceholder}&quot;</span>{" "}
            <span className="text-purple-700 font-medium">src</span>=
            <span className="text-emerald-700">&quot;{scriptHost}/userly.js&quot;</span>
            <span className="text-blue-700 font-semibold">&gt;&lt;/script&gt;</span>
          </code>
        </pre>
      </div>

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600 pt-1">
        <div className="flex items-center gap-1.5">
          <Zap className="size-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px]">Auto Google Consent Mode v2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
          <span className="text-[11px]">Strict Script Regex Gating</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-[#1868db] shrink-0" />
          <span className="text-[11px]">Zero-Layout-Shift Shadow DOM</span>
        </div>
      </div>
    </div>
  )
}
