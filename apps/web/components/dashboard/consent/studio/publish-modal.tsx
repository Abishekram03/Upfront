"use client"

import { CheckCircle2, AlertCircle, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ValidationResult } from "./types"

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmPublish: () => Promise<void>
  isPublishing: boolean
  targetVersion?: string
  publishedVersion?: string
  diffs?: string[]
  validation?: ValidationResult
}

export function PublishModal({
  isOpen,
  onClose,
  onConfirmPublish,
  isPublishing,
  validation,
}: PublishModalProps) {
  if (!isOpen) return null

  const hasErrors = validation && !validation.isValid

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in-0">
      <div className="fixed inset-0" onClick={isPublishing ? undefined : onClose} />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-[#1868db]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Publish Changes?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Apply your updated banner settings to production
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Validation Errors (if any) */}
        {hasErrors && (
          <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/70 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
              <AlertCircle className="size-4 text-rose-600 shrink-0" />
              <span>Please resolve configuration errors</span>
            </div>
            <ul className="text-xs text-rose-700 list-disc list-inside space-y-1 pl-1">
              {validation.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Friendly Confirmation Text */}
        <p className="text-xs text-slate-600 leading-relaxed">
          Do you want to save and publish your banner configuration changes? Your live website visitors will immediately see the updated design and consent preferences.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <Button
            type="button"
            disabled={hasErrors || isPublishing}
            onClick={onConfirmPublish}
            className="rounded-lg bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPublishing ? "Publishing Changes..." : "Publish Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
