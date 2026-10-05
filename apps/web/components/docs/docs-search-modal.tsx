"use client"

import React, { useState, useEffect } from "react"
import { Search, X, ChevronRight, FileText, Sparkles, Command } from "lucide-react"
import { ALL_DOC_ARTICLES } from "@/lib/docs/docs-config"
import { DocArticleMeta } from "@/lib/docs/docs-types"

interface DocsSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectArticle: (articleId: string) => void
}

export function DocsSearchModal({
  isOpen,
  onClose,
  onSelectArticle,
}: DocsSearchModalProps) {
  const [query, setQuery] = useState("")

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // Trigger open via custom event or parent
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filteredArticles = query.trim() === ""
    ? ALL_DOC_ARTICLES.slice(0, 6)
    : ALL_DOC_ARTICLES.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.description.toLowerCase().includes(query.toLowerCase()) ||
          a.category.toLowerCase().includes(query.toLowerCase())
      )

  const handleSelect = (articleId: string) => {
    onSelectArticle(articleId)
    onClose()
    setQuery("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 pt-20 backdrop-blur-xs">
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl animate-in fade-in-50 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-line px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            type="text"
            placeholder="Search guides, installation, CMP, APIs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredArticles.length > 0 ? (
            <div className="space-y-1">
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {query.trim() === "" ? "Popular Guides" : `Found ${filteredArticles.length} results`}
              </p>
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleSelect(article.id)}
                  className="group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/70"
                >
                  <div className="mt-0.5 rounded-lg bg-brand-mist p-2 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink group-hover:text-primary transition-colors">
                        {article.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {article.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {article.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No documentation articles matching "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-line bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span>Navigate with mouse or keyboard</span>
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px]">
            ESC to close
          </kbd>
        </div>
      </div>
    </div>
  )
}
