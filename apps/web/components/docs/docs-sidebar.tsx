"use client"

import React, { useState } from "react"
import {
  Zap,
  ShieldCheck,
  Search,
  BarChart3,
  FileCheck,
  FileText,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sliders,
  Sparkles,
  Command,
} from "lucide-react"
import { DOCS_CATEGORIES } from "@/lib/docs/docs-config"
import { DocCategory, DocArticleMeta } from "@/lib/docs/docs-types"
import { cn } from "@workspace/ui/lib/utils"

const ICON_MAP: Record<string, any> = {
  Zap,
  ShieldCheck,
  Search,
  BarChart3,
  FileCheck,
  FileText,
  BookOpen,
  Sliders,
}

interface DocsSidebarProps {
  currentArticleId: string
  onSelectArticle: (articleId: string) => void
  onOpenSearch: () => void
  onNavigateHome?: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function DocsSidebar({
  currentArticleId,
  onSelectArticle,
  onOpenSearch,
  onNavigateHome,
  isMobileOpen,
  onCloseMobile,
}: DocsSidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }))
  }

  const handleArticleClick = (articleId: string) => {
    onSelectArticle(articleId)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 shrink-0 border-r border-line bg-surface px-4 py-6 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-y-auto",
        isMobileOpen ? "block" : "hidden md:block"
      )}
    >
      <div className="space-y-5">
        {/* Docs Home Return Button */}
        {onNavigateHome && (
          <button
            onClick={() => {
              onNavigateHome()
              if (onCloseMobile) onCloseMobile()
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-brand-mist/50 hover:text-primary"
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>← All Documentation</span>
          </button>
        )}

        {/* Quick Search Button */}
        <div>
          <button
            onClick={onOpenSearch}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-muted/40 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/70 hover:text-ink"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Search docs...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Navigation Categories */}
        <nav className="space-y-6">
          {DOCS_CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.iconName] || BookOpen
            const isCollapsed = collapsedCategories[cat.id]

            return (
              <div key={cat.id} className="space-y-1.5">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="flex w-full items-center justify-between py-1 text-left text-xs font-semibold uppercase tracking-wider text-ink hover:text-primary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span>{cat.title}</span>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>

                {/* Articles List */}
                {!isCollapsed && (
                  <ul className="space-y-0.5 pl-2 border-l border-line/70 ml-1.5">
                    {cat.articles.map((article) => {
                      const isActive = currentArticleId === article.id

                      return (
                        <li key={article.id}>
                          <button
                            onClick={() => handleArticleClick(article.id)}
                            className={cn(
                              "group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all text-left",
                              isActive
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-ink-soft hover:bg-muted/60 hover:text-ink"
                            )}
                          >
                            <span className="truncate">{article.title}</span>
                            {article.badge && (
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.2 text-[9px] font-mono uppercase tracking-tight",
                                  isActive
                                    ? "bg-primary text-primary-foreground font-semibold"
                                    : "bg-brand-mist text-primary border border-primary/20"
                                )}
                              >
                                {article.badge}
                              </span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
