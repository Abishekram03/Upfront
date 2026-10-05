"use client"

import React, { useEffect, useState } from "react"
import { DocHeading } from "@/lib/docs/docs-types"
import { Link2, MessageSquare, ExternalLink, Sparkles, Check } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface DocsTocProps {
  headings: DocHeading[]
  activeHeadingId?: string
  articleTitle: string
}

export function DocsToc({ headings, activeHeadingId, articleTitle }: DocsTocProps) {
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const topOffset = 80
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - topOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="sticky top-20 hidden lg:block w-64 shrink-0 py-6 pl-6 text-sm">
      <div className="space-y-6">
        {/* Table of contents */}
        {headings && headings.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink">
              On this page
            </p>
            <nav className="mt-3 space-y-1.5 border-l border-line">
              {headings.map((h) => {
                const isActive = activeHeadingId === h.id
                return (
                  <button
                    key={h.id}
                    onClick={() => scrollToHeading(h.id)}
                    className={cn(
                      "group -ml-px block w-full text-left transition-colors",
                      h.level === 3 ? "pl-5 text-xs" : "pl-3 text-xs font-medium",
                      isActive
                        ? "border-l-2 border-primary font-medium text-primary"
                        : "text-muted-foreground hover:border-l-2 hover:border-ink-soft hover:text-ink"
                    )}
                  >
                    {h.title}
                  </button>
                )
              })}
            </nav>
          </div>
        )}

        {/* Quick actions box */}
        <div className="rounded-xl border border-line bg-surface/80 p-4 shadow-2xs backdrop-blur-xs space-y-3">
          <p className="text-xs font-semibold text-ink">Quick Actions</p>
          <div className="space-y-1.5 text-xs">
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-left"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">Link copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Copy article link</span>
                </>
              )}
            </button>

            <a
              href="/contact"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Ask a question</span>
            </a>

            <a
              href="https://github.com/Abishekram03/usrly"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>

        {/* Script badge callout */}
        <div className="rounded-xl border border-primary/20 bg-brand-mist/50 p-3.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Lightweight Guarantee</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
            Upfront delivers analytics, CMP, and cookie scanning in a single bundle under 4KB.
          </p>
        </div>
      </div>
    </div>
  )
}
