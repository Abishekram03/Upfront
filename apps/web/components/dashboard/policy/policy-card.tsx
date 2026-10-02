"use client"

import { Plus, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { PolicyDefinition, DomainPolicyRecord } from "./policy-types"

interface PolicyCardProps {
  policy: PolicyDefinition
  record?: DomainPolicyRecord
  onGenerate: (policy: PolicyDefinition) => void
  onPreview: (policy: PolicyDefinition, record?: DomainPolicyRecord) => void
  onViewDetails: (policy: PolicyDefinition, record?: DomainPolicyRecord) => void
}

export function PolicyCard({
  policy,
  record,
  onGenerate,
  onPreview,
  onViewDetails,
}: PolicyCardProps) {
  const isCreated = record && record.status !== "not_created"
  const isPublished = record?.status === "published"
  const Icon = policy.icon

  // -------------------------------------------------------------
  // 1. Uncreated Empty State Card (Exact Screenshot Match: centered + & Title)
  // -------------------------------------------------------------
  if (!isCreated) {
    return (
      <div
        onClick={() => onGenerate(policy)}
        className="group relative rounded-sm border border-slate-200 bg-white hover:border-blue-400 transition-all duration-150 flex flex-col items-center justify-center min-h-[320px] text-center cursor-pointer select-none p-6"
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <Plus className="size-6 text-[#1868db] stroke-[2.5]" />
          <h3 className="text-xs font-bold text-[#1868db] tracking-wider uppercase">
            {policy.shortTitle}
          </h3>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // 2. Configured / Published Card (Exact Screenshot Match: Cookie Policy)
  // -------------------------------------------------------------
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-5 transition-all flex flex-col justify-between min-h-[320px] relative">
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-2">
          {/* Top Left Icon in Circle Badge */}
          <div className="size-9 rounded-full bg-[#1868db] text-white flex items-center justify-center shadow-xs shrink-0">
            <Icon className="size-5 text-white" />
          </div>

          {/* Top Right "VIEW DETAILS..." Link */}
          <button
            type="button"
            onClick={() => onViewDetails(policy, record)}
            className="text-[11px] font-semibold text-slate-500 hover:text-[#1868db] tracking-wider transition-colors uppercase cursor-pointer"
          >
            VIEW DETAILS...
          </button>
        </div>

        {/* Title & Status */}
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {record.customTitle || policy.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span
              className={cn(
                "size-2 rounded-full shrink-0",
                isPublished ? "bg-[#10b981]" : "bg-amber-500"
              )}
            />
            <span
              className={cn(
                "font-semibold",
                isPublished ? "text-[#10b981]" : "text-amber-600"
              )}
            >
              {isPublished ? "Published" : "Draft"}
            </span>
            <span className="text-slate-400 text-xs">
              {record.publishedAgo || (isPublished ? "Just now" : "Draft saved")}
            </span>
          </div>
        </div>

        {/* Mini Document Paper Preview Box (Matches Screenshot) */}
        <div
          onClick={() => onPreview(policy, record)}
          className="mt-3.5 rounded-sm border border-slate-200/90 bg-slate-50/60 p-3 hover:bg-slate-100/60 transition-colors cursor-pointer"
        >
          <div className="bg-white rounded-xs border border-slate-200 p-3 space-y-1.5 shadow-2xs pointer-events-none select-none">
            <div className="text-[9px] font-bold text-[#f59e0b] uppercase tracking-wider mb-2">
              {policy.shortTitle}
            </div>
            <div className="space-y-1 text-[8px] text-slate-400 leading-tight font-serif">
              <p className="line-clamp-1">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              <p className="line-clamp-1">Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <p className="line-clamp-1">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
              <p className="line-clamp-1">Duis aute irure dolor in reprehenderit in voluptate velit esse.</p>
              <p className="line-clamp-1">Excepteur sint occaecat cupidatat non proident, sunt in culpa.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action: PREVIEW Button (Outlined blue with eye icon) */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={() => onPreview(policy, record)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xs border border-[#1868db] text-[#1868db] bg-white hover:bg-blue-50/60 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Eye className="size-4 text-[#1868db]" />
          <span>PREVIEW</span>
        </button>
      </div>
    </div>
  )
}
