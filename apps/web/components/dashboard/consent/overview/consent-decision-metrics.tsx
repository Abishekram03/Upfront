"use client"

import { HelpCircle } from "lucide-react"
import { ConsentStatsSummary } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ConsentDecisionMetricsProps {
  stats: ConsentStatsSummary | null
  isLoading: boolean
}

export function ConsentDecisionMetrics({ stats, isLoading }: ConsentDecisionMetricsProps) {
  const totalDecisions = stats?.total_decisions ?? stats?.total_receipts ?? 0
  const acceptAllRate = stats?.accept_all_rate ?? (stats?.acceptance_rate ? stats.acceptance_rate : 0)
  const rejectAllRate = stats?.reject_all_rate ?? (stats?.rejection_rate ? stats.rejection_rate : 0)
  const customChoiceRate = stats?.custom_choice_rate ?? Math.max(0, Number((100 - acceptAllRate - rejectAllRate).toFixed(1)))
  const analyticsOptIn = stats?.analytics_opt_in_pct ?? stats?.analytics_accepted_pct ?? 0

  const metrics = [
    {
      title: "Total Decisions",
      value: totalDecisions.toLocaleString(),
      subtext: "Logged consent transactions",
      tooltip: "Total recorded consent decisions submitted by visitors for this site.",
      valueColor: "text-slate-900",
      accentBorder: "border-slate-200",
    },
    {
      title: "Accept All Rate",
      value: `${acceptAllRate}%`,
      subtext: "Granted all optional categories",
      tooltip: "Percentage of recorded consent decisions where the visitor granted all optional tracking categories.",
      valueColor: "text-emerald-600",
      accentBorder: "border-slate-200",
    },
    {
      title: "Reject All Rate",
      value: `${rejectAllRate}%`,
      subtext: "Declined non-essential cookies",
      tooltip: "Percentage of recorded consent decisions where the visitor declined all optional categories.",
      valueColor: "text-rose-600",
      accentBorder: "border-slate-200",
    },
    {
      title: "Custom Choice Rate",
      value: `${customChoiceRate}%`,
      subtext: "Granular category selections",
      tooltip: "Percentage of recorded decisions where the visitor configured specific category preferences.",
      valueColor: "text-indigo-600",
      accentBorder: "border-slate-200",
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-3 animate-pulse">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-7 w-16 bg-slate-300 rounded" />
              <div className="h-2.5 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">Consent Decisions</h2>
          <div className="relative group cursor-pointer inline-flex items-center">
            <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
            <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-72 p-2.5 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
              Granular distribution of user consent responses (Accept All, Reject All, and Custom choices). Percentages are calculated against all recorded decisions.
            </div>
          </div>
        </div>

        {/* Analytics Opt-In Highlight Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-blue-50 border border-blue-200 text-xs">
          <span className="text-slate-600 font-medium">Analytics Opt-In:</span>
          <strong className="text-[#1868db] font-bold">{analyticsOptIn}%</strong>
          <div className="relative group cursor-pointer inline-flex items-center ml-0.5">
            <HelpCircle className="size-3 text-slate-400 hover:text-slate-600" />
            <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
              Percentage of total consent decisions in which the visitor specifically granted consent for the Analytics category.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.title} className={cn("rounded-lg border bg-white p-5 shadow-2xs transition-all", m.accentBorder)}>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{m.title}</div>
              <div className="relative group cursor-pointer inline-flex items-center">
                <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-60 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                  {m.tooltip}
                </div>
              </div>
            </div>
            <div className={cn("text-2xl font-bold mt-2", m.valueColor)}>
              {m.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{m.subtext}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
