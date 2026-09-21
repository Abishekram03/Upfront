"use client"

import { useState } from "react"
import { ScannerDashboard } from "@/components/dashboard/consent/scanner-dashboard"
import { CookieManager } from "@/components/dashboard/consent/cookie-manager"
import { Radar, Cookie } from "lucide-react"
import { cn } from "@/lib/utils"

export default function CookieScannerPage() {
  const [activeSubTab, setActiveSubTab] = useState<"scanner" | "catalog">("scanner")

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab("scanner")}
          className={cn(
            "px-3.5 py-1.5 rounded-[4px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeSubTab === "scanner"
              ? "bg-[#1868db] text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          )}
        >
          <Radar className="size-3.5" />
          <span>Automated Crawler Scanner</span>
        </button>

        <button
          onClick={() => setActiveSubTab("catalog")}
          className={cn(
            "px-3.5 py-1.5 rounded-[4px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeSubTab === "catalog"
              ? "bg-[#1868db] text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          )}
        >
          <Cookie className="size-3.5" />
          <span>Discovered Cookies & Regex Manager</span>
        </button>
      </div>

      {activeSubTab === "scanner" ? <ScannerDashboard /> : <CookieManager />}
    </div>
  )
}
