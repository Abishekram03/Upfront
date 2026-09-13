"use client"

import { useState } from "react"
import { Copy, Check, X, Code2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { API_BASE } from "@/lib/api"

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
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-blue-600 text-white shadow-xs">
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

          <div className="relative rounded-lg border border-neutral-200 bg-neutral-950 p-3.5 text-neutral-100 shadow-inner">
            <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap select-all">
              {snippet}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-white" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="rounded-lg border border-blue-200/80 bg-blue-50/50 p-3 text-xs text-blue-900 flex items-start gap-2.5">
            <Sparkles className="size-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Automatic Verification</p>
              <p className="text-blue-700 text-[11px] mt-0.5">
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
