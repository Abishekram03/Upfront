"use client"

import { useState } from "react"
import { Copy, Check, X, Code2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const scriptHost = typeof window !== "undefined" ? window.location.origin : "https://usrly-five.vercel.app"
  const snippet = `<script defer data-domain="${domain}" src="${scriptHost}/userly.js"></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <div className="flex size-8 items-center justify-center rounded-md bg-neutral-900 text-white shadow-xs">
              <Code2 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Install usrly Script
              </h3>
              <p className="text-xs text-neutral-500">
                Lightweight (&lt; 4KB), cookieless, and Privacy Consent ready
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
          <div className="relative rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 shadow-2xs">
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <pre className="font-mono text-xs overflow-x-auto pr-20 leading-relaxed select-all">
              <code>
                <span className="text-blue-700 font-semibold">&lt;script</span>{" "}
                <span className="text-purple-700 font-medium">defer</span>{" "}
                <span className="text-purple-700 font-medium">data-domain</span>=
                <span className="text-emerald-700">&quot;{domain}&quot;</span>{" "}
                <span className="text-purple-700 font-medium">src</span>=
                <span className="text-emerald-700">&quot;{scriptHost}/userly.js&quot;</span>
                <span className="text-blue-700 font-semibold">&gt;&lt;/script&gt;</span>
              </code>
            </pre>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 text-xs text-slate-700 flex items-start gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Automatic Verification</p>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Once you add the code and visit your website, usrly will verify the installation in real-time.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={onClose}
              className="text-xs font-semibold rounded-md bg-neutral-900 hover:bg-neutral-800 text-white px-4"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
