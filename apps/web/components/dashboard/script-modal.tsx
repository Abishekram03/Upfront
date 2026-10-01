"use client"

import { useState } from "react"
import { Copy, Check, X, Code2, CheckCircle2, ShieldCheck, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDomain } from "@/lib/domain-context"
import { cn } from "@/lib/utils"

interface ScriptModalProps {
  open: boolean
  onClose: () => void
  domain?: string | null
}

export function ScriptModal({
  open,
  onClose,
  domain,
}: ScriptModalProps) {
  const { refreshSites, sites } = useDomain()
  const [copied, setCopied] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean
    message: string
    detail?: string
  } | null>(null)

  if (!open) return null

  const activeSite = sites.find((s) => s.domain === domain)
  const isDetected = activeSite?.installation_status === "detected"

  const scriptHost = typeof window !== "undefined" ? window.location.origin : "https://usrly-five.vercel.app"
  const snippet = `<script defer data-domain="${domain || "yourdomain.com"}" src="${scriptHost}/script.js"></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVerify = async () => {
    if (!domain) return
    setIsVerifying(true)
    setVerifyResult(null)

    try {
      const res = await fetch("/api/v1/sites/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: activeSite?.id,
          domain,
        }),
      })
      const data = await res.json()
      if (data.success && data.status === "detected") {
        setVerifyResult({
          success: true,
          message: data.message || "Your website is connected.",
        })
        await refreshSites()
      } else {
        setVerifyResult({
          success: false,
          message: data.message || "We couldn't detect the UpFront script yet.",
          detail: data.detail,
        })
        await refreshSites()
      }
    } catch (err: any) {
      setVerifyResult({
        success: false,
        message: "Verification failed. Please check your network and try again.",
        detail: err.message,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-[#1868db] text-white shadow-xs">
              <Code2 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Install UpFront Script
              </h3>
              <p className="text-xs text-neutral-500">
                Manual copy/paste installation snippet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 pt-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Paste this snippet into the <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[11px] text-neutral-800">&lt;head&gt;</code> tag of your website. It powers both <strong>Cookieless Web Analytics</strong> and the <strong>Privacy Consent Banner</strong>.
          </p>

          {/* Light-themed syntax-highlighted code block */}
          <div className="relative rounded-lg border border-slate-200 bg-slate-900 text-slate-100 p-3.5 shadow-2xs">
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-slate-300" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <pre className="font-mono text-xs overflow-x-auto pr-18 py-1 leading-relaxed text-slate-200 select-all whitespace-pre-wrap break-all">
              <code>{snippet}</code>
            </pre>
          </div>

          {/* Verification Status & Feedback */}
          {verifyResult ? (
            <div
              className={cn(
                "p-3 rounded-lg border text-xs font-medium flex items-start gap-2.5 animate-in fade-in-50",
                verifyResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              )}
            >
              {verifyResult.success ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{verifyResult.message}</p>
                {verifyResult.detail && (
                  <p className="text-[11px] opacity-80 mt-0.5">{verifyResult.detail}</p>
                )}
              </div>
            </div>
          ) : isDetected ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <p className="font-semibold">Website Connected & Verified</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 text-xs text-slate-700 flex items-start gap-2.5">
              <ShieldCheck className="size-4 text-[#1868db] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Installation Verification</p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Click &ldquo;Verify Installation&rdquo; below to confirm UpFront is detectable on your website.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isVerifying}
              onClick={handleVerify}
              className="text-xs font-semibold rounded-md border-slate-300 hover:bg-slate-50 text-slate-700 h-9 flex items-center gap-1.5 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Checking website...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5 text-[#1868db]" />
                  Verify Installation
                </>
              )}
            </Button>

            <Button
              onClick={onClose}
              className="text-xs font-semibold rounded-md bg-neutral-900 hover:bg-neutral-800 text-white px-4 h-9 cursor-pointer"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
