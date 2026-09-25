"use client"

import { useState, useEffect } from "react"
import { History, X, RotateCcw, CheckCircle2, Clock, Shield, Sparkles, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConsentVersion, fetchConsentVersions, restoreConsentVersion } from "@/lib/api"
import { cn } from "@/lib/utils"

interface VersionHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  activeDomain: string
  currentPublishedVersion: string
  onVersionRestored: () => void
}

export function VersionHistoryDrawer({
  isOpen,
  onClose,
  activeDomain,
  currentPublishedVersion,
  onVersionRestored,
}: VersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<ConsentVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [restoringVersion, setRestoringVersion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !activeDomain) return

    setIsLoading(true)
    setError(null)
    fetchConsentVersions(activeDomain)
      .then((data) => {
        setVersions(data.versions || [])
      })
      .catch((err) => {
        setError(err?.message || "Failed to load version history.")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [isOpen, activeDomain])

  const handleRestore = async (versionStr: string) => {
    if (!activeDomain || restoringVersion) return
    const confirmed = window.confirm(
      `Rollback configuration to v${versionStr}? This will safely create a new published version containing the configuration from v${versionStr}.`
    )
    if (!confirmed) return

    setRestoringVersion(versionStr)
    setError(null)
    try {
      const res = await restoreConsentVersion(activeDomain, versionStr)
      setSuccessMessage(res.message || `Restored as v${res.new_version}`)
      setTimeout(() => setSuccessMessage(null), 4000)
      onVersionRestored()
      onClose()
    } catch (err: any) {
      setError(err?.message || "Failed to restore version.")
    } finally {
      setRestoringVersion(null)
    }
  }

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return isoStr
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs animate-in fade-in-0">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-[6px] bg-[#1868db]/10 text-[#1868db]">
              <History className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Version History & Audit Log</h3>
              <p className="text-[11px] text-slate-500 font-mono">{activeDomain}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Version List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-200 bg-slate-50 animate-pulse space-y-2">
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                  <div className="h-3 w-40 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Clock className="size-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No Historical Versions Yet</p>
              <p className="text-[11px] text-slate-400">
                Every time you publish changes, an immutable version record will be captured here.
              </p>
            </div>
          ) : (
            versions.map((ver) => {
              const isCurrent = ver.version === currentPublishedVersion
              const changes = Array.isArray(ver.change_summary) ? ver.change_summary : []

              return (
                <div
                  key={ver.id || ver.version}
                  className={cn(
                    "p-4 rounded-lg border transition-all space-y-2.5",
                    isCurrent
                      ? "border-[#1868db] bg-blue-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        v{ver.version}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-[#1868db] bg-blue-100/70 px-2 py-0.5 rounded-full border border-blue-200">
                          Active in Production
                        </span>
                      )}
                    </div>

                    {!isCurrent && (
                      <button
                        type="button"
                        disabled={restoringVersion === ver.version}
                        onClick={() => handleRestore(ver.version)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1868db] hover:text-[#1559be] px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {restoringVersion === ver.version ? (
                          <>
                            <Loader2 className="size-3 animate-spin" /> Restoring...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="size-3" /> Rollback to this
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="size-3" />
                    <span>Published {formatDate(ver.published_at)}</span>
                  </div>

                  {changes.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-100 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Changes</p>
                      <ul className="text-[11px] text-slate-600 space-y-0.5">
                        {changes.map((c: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-slate-400">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="size-3.5 text-emerald-600" />
            <span className="text-[11px]">Audit records are immutable</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
