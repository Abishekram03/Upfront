"use client"

import { useState } from "react"
import { Copy, Check, FileCode2, HelpCircle, Layers } from "lucide-react"

export function DeclarationEmbedCard() {
  const [copied, setCopied] = useState(false)
  const embedSnippet = `<div id="usrly-cookie-declaration"></div>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3.5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <FileCode2 className="size-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Cookie Declaration Embed
            </h2>
            <div className="relative group cursor-pointer inline-flex items-center">
              <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-72 p-2.5 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                When present on a page loaded with the SDK, this container dynamically injects the authoritative cookie disclosure table categorized into Necessary, Functional, Analytics, Performance, and Advertisement.
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Embed a live, automatically updated cookie disclosure table on your Cookie or Privacy Policy page.
          </p>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
          <Layers className="size-3.5 text-slate-400" />
          <span>Authoritative Inventory Sync</span>
        </div>
      </div>

      {/* Embed Code Snippet with Copy Button */}
      <div className="relative rounded-lg border border-slate-200 bg-slate-50/80 p-3 shadow-2xs">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy cookie declaration embed snippet"
          className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1868db]"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 text-slate-500" />
              <span>Copy</span>
            </>
          )}
        </button>

        <pre className="font-mono text-xs overflow-x-auto pr-24 leading-relaxed select-all text-slate-800">
          <code>
            <span className="text-blue-700 font-semibold">&lt;div</span>{" "}
            <span className="text-purple-700 font-medium">id</span>=
            <span className="text-emerald-700">&quot;usrly-cookie-declaration&quot;</span>
            <span className="text-blue-700 font-semibold">&gt;&lt;/div&gt;</span>
          </code>
        </pre>
      </div>
    </div>
  )
}
