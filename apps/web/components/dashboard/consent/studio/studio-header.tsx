"use client"

import { useState } from "react"
import Link from "next/link"
import {
  History,
  Save,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
  Eye,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { UpgradeBadge } from "@/components/ui/upgrade-gate"
import { useEntitlements } from "@/lib/entitlements-context"

interface StudioHeaderProps {
  activeDomain: string
  publishedVersion: string
  isDraft: boolean
  isSavingDraft: boolean
  isPublishing: boolean
  onSaveDraft: () => void
  onDiscardDraft: () => void
  onOpenPublishModal: () => void
  onOpenVersionHistory: () => void
}

export function StudioHeader({
  activeDomain,
  publishedVersion,
  isDraft,
  isSavingDraft,
  isPublishing,
  onSaveDraft,
  onDiscardDraft,
  onOpenPublishModal,
  onOpenVersionHistory,
}: StudioHeaderProps) {
  const { hasCapability, openUpgradeModal } = useEntitlements()
  const canVersionHistory = hasCapability("cmp.version_history")

  const handleVersionHistoryClick = () => {
    if (!canVersionHistory) {
      openUpgradeModal("growth", "Version History & Rollback")
      return
    }
    onOpenVersionHistory()
  }

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 bg-white px-5 flex items-center justify-between select-none">
      {/* Left: Domain & Status */}
      <div className="flex items-center gap-3">
        <Link
          href="/consent"
          title="Back to Consent Overview"
          className="p-1.5 rounded-[4px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Banner Studio</h1>

            {/* Status Pill */}
            {isDraft ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Draft Changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Live Published
              </span>
            )}

            <span className="text-slate-300 font-normal">|</span>
            <span className="font-mono text-xs text-slate-500">v{publishedVersion}</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Domain: <strong className="text-slate-700 font-mono font-medium">{activeDomain || "No domain selected"}</strong>
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Version History Button */}
        <button
          type="button"
          onClick={handleVersionHistoryClick}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
        >
          <History className="size-3.5 text-slate-500" />
          <span>Version History</span>
          {!canVersionHistory && <UpgradeBadge capability="cmp.version_history" size="sm" showText={false} />}
        </button>

        {/* Discard Draft Button (if draft changes exist) */}
        {isDraft && (
          <button
            type="button"
            onClick={onDiscardDraft}
            className="inline-flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>Discard Draft</span>
          </button>
        )}

        {/* Save Draft Button */}
        <button
          type="button"
          disabled={isSavingDraft || isPublishing}
          onClick={onSaveDraft}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
        >
          {isSavingDraft ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
        </button>

        {/* Review & Publish Button */}
        <button
          type="button"
          disabled={isPublishing || isSavingDraft}
          onClick={onOpenPublishModal}
          className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#1868db] hover:bg-[#1559be] px-4 py-1.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <UploadCloud className="size-3.5" />
          <span>Review & Publish</span>
        </button>
      </div>
    </header>
  )
}
