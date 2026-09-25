"use client"

import { HelpCircle } from "lucide-react"
import { ConsentStatsSummary } from "@/lib/api"
import { CategoryItem } from "./types"

interface ConsentCategoryBreakdownProps {
  stats: ConsentStatsSummary | null
  isLoading: boolean
}

export function ConsentCategoryBreakdown({ stats, isLoading }: ConsentCategoryBreakdownProps) {
  const categories: CategoryItem[] = [
    {
      key: "necessary",
      label: "Necessary",
      description: "Essential cookies required for page routing, session security, and basic functionality.",
      percentage: 100.0,
      required: true,
      badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
      barColor: "bg-emerald-500",
    },
    {
      key: "functional",
      label: "Functional",
      description: "Preferences, language memory, chat widgets, and interactive feature cookies.",
      percentage: stats?.functional_pct ?? stats?.functional_accepted_pct ?? 0,
      badgeColor: "text-[#1868db] bg-blue-50 border-blue-200",
      barColor: "bg-[#1868db]",
    },
    {
      key: "analytics",
      label: "Analytics",
      description: "Telemetry cookies measuring page visits, entry/exit paths, and traffic performance.",
      percentage: stats?.analytics_pct ?? stats?.analytics_accepted_pct ?? 0,
      badgeColor: "text-indigo-700 bg-indigo-50 border-indigo-200",
      barColor: "bg-indigo-600",
    },
    {
      key: "performance",
      label: "Performance",
      description: "Telemetry monitoring asset loading speed, response latency, and frontend errors.",
      percentage: stats?.performance_pct ?? stats?.performance_accepted_pct ?? 0,
      badgeColor: "text-purple-700 bg-purple-50 border-purple-200",
      barColor: "bg-purple-600",
    },
    {
      key: "advertisement",
      label: "Advertisement",
      description: "Targeted advertising, conversion tracking, and retargeting pixels.",
      percentage: stats?.advertisement_pct ?? stats?.advertisement_accepted_pct ?? 0,
      badgeColor: "text-rose-700 bg-rose-50 border-rose-200",
      barColor: "bg-rose-500",
    },
  ]

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3.5 rounded-[6px] border border-slate-200 bg-slate-50 space-y-2">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-2 w-full bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-bold text-slate-900">Consent Categories</h2>
        <div className="relative group cursor-pointer inline-flex items-center">
          <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
          <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-72 p-2.5 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
            Breakdown of visitor opt-in rates across UpFront&apos;s configured consent categories. Necessary cookies are essential and always enabled.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        {categories.map((cat) => (
          <div key={cat.key} className="p-3 rounded-[6px] border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-semibold flex items-center gap-1">
                {cat.label}
                <div className="relative group cursor-pointer inline-flex items-center">
                  <HelpCircle className="size-3 text-slate-400 hover:text-slate-600" />
                  <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-52 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                    {cat.description}
                  </div>
                </div>
              </span>

              <span className="text-[11px] font-bold font-mono">
                {cat.required ? (
                  <span className="text-emerald-700 font-bold">100%</span>
                ) : (
                  <span>{cat.percentage}%</span>
                )}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={cat.barColor}
                style={{ width: `${Math.min(100, Math.max(0, cat.percentage))}%`, height: "100%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
