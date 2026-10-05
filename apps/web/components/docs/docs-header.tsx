"use client"

import React from "react"
import Link from "next/link"
import { Search, Menu, X, ChevronRight, BookOpen, Command, Sparkles } from "lucide-react"
import { DocArticleMeta } from "@/lib/docs/docs-types"

interface DocsHeaderProps {
  currentArticle?: DocArticleMeta
  onOpenSearch: () => void
  isMobileOpen: boolean
  onToggleMobile: () => void
  onNavigateHome?: () => void
}

export function DocsHeader({
  currentArticle,
  onOpenSearch,
  isMobileOpen,
  onToggleMobile,
  onNavigateHome,
}: DocsHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-line bg-surface/90 px-4 sm:px-8 backdrop-blur-md">
      {/* Left: Mobile menu toggle + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden"
          aria-label="Toggle navigation menu"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1 font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Docs</span>
          </button>
          {currentArticle && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="text-muted-foreground">{currentArticle.category}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="font-semibold text-ink truncate max-w-[150px] sm:max-w-none">
                {currentArticle.title}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-line bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-ink transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Quick search...</span>
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            v1.4 Live
          </span>
        </div>
      </div>
    </header>
  )
}
