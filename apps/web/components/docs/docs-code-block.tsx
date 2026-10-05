"use client"

import React, { useState } from "react"
import { Copy, Check, Terminal } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface CodeTab {
  label: string
  code: string
  language?: string
}

interface DocsCodeBlockProps {
  filename?: string
  badge?: string
  tabs?: CodeTab[]
  code?: string
  language?: string
  className?: string
}

export function DocsCodeBlock({
  filename,
  badge,
  tabs,
  code,
  language = "html",
  className,
}: DocsCodeBlockProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const currentTab = tabs && tabs.length > 0 ? tabs[activeTabIndex] : undefined
  const activeCode = currentTab?.code ?? (code || "")
  const activeLang = currentTab?.language ?? language

  const handleCopy = () => {
    if (!activeCode) return
    navigator.clipboard.writeText(activeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("my-6 overflow-hidden rounded-xl border border-line bg-slate-950 text-slate-100 shadow-md", className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs && tabs.length > 0 ? (
            <div className="flex items-center gap-1.5">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTabIndex(idx)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition-colors",
                    activeTabIndex === idx
                      ? "bg-slate-800 text-white shadow-2xs"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Terminal className="h-3.5 w-3.5" />
              <span className="font-mono">{filename || activeLang}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {badge && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              {badge}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1 font-mono text-[11px] text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            title="Copy snippet"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code viewport */}
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-200 selection:bg-primary/30">
        <code>{activeCode.trim()}</code>
      </pre>
    </div>
  )
}
