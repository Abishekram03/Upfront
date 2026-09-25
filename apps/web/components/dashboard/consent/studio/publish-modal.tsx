"use client"

import { useState } from "react"
import { CheckCircle2, AlertCircle, AlertTriangle, X, UploadCloud, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StudioConfig, ValidationResult } from "./types"
import { cn } from "@/lib/utils"

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmPublish: () => Promise<void>
  isPublishing: boolean
  targetVersion: string
  publishedVersion: string
  diffs: string[]
  validation: ValidationResult
}

export function PublishModal({
  isOpen,
  onClose,
  onConfirmPublish,
  isPublishing,
  targetVersion,
  publishedVersion,
  diffs,
  validation,
}: PublishModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-0">
      <div className="fixed inset-0" onClick={isPublishing ? undefined : onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#1868db]/10 text-[#1868db]">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Publish Consent Banner
              </h3>
              <p className="text-xs text-slate-500">
                Deploying <span className="font-mono font-bold text-slate-800">v{targetVersion}</span> (Upgrading from v{publishedVersion})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Validation Errors Notice */}
        {!validation.isValid && (
          <div className="mt-4 p-3.5 rounded-lg border border-rose-200 bg-rose-50/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
              <AlertCircle className="size-4 text-rose-600 shrink-0" />
              <span>Publishing Blocked — Configuration Errors</span>
            </div>
            <ul className="text-xs text-rose-700 list-disc list-inside space-y-1 pl-1">
              {validation.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Change Summary Diff */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Change Summary ({diffs.length})
            </span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
              Immutable Versioning
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
            {diffs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No structural configuration changes detected.</p>
            ) : (
              <ul className="text-xs text-slate-700 space-y-1.5">
                {diffs.map((diff, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#1868db] font-bold mt-0.5">•</span>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Safety & Runtime Assurance */}
        <div className="mt-4 p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Publishing is atomic. New website visitors will receive version <strong className="text-slate-800">v{targetVersion}</strong>. Existing stored consent records remain preserved in the audit log.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="rounded-[4px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <Button
            type="button"
            disabled={!validation.isValid || isPublishing}
            onClick={onConfirmPublish}
            className="rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-2 shadow-xs transition-colors disabled:opacity-50"
          >
            {isPublishing ? "Publishing to Production..." : `Publish v${targetVersion}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
