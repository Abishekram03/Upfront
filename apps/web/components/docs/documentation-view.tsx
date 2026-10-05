"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DOCS_CATEGORIES, ALL_DOC_ARTICLES, getArticleById, getAdjacentArticles } from "@/lib/docs/docs-config"
import { DocArticleMeta } from "@/lib/docs/docs-types"
import { DOC_ARTICLE_COMPONENTS } from "./content"
import { DocsHeader } from "./docs-header"
import { DocsSidebar } from "./docs-sidebar"
import { DocsToc } from "./docs-toc"
import { DocsFeedback } from "./docs-feedback"
import { DocsSearchModal } from "./docs-search-modal"
import { DocsHubView } from "./docs-hub-view"
import { BookOpen, Sparkles, Clock, Calendar } from "lucide-react"

function DocsViewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentArticleId = searchParams.get("article")
  const isHubView = !currentArticleId

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState<string>("")

  const fallbackArticle: DocArticleMeta = ALL_DOC_ARTICLES[0] ?? {
    id: "overview",
    title: "Introduction & Architecture",
    category: "Getting Started",
    categoryId: "getting-started",
    description: "Learn how Upfront delivers cookieless analytics, CMP, and legal policies via a single script.",
  }

  const currentArticle: DocArticleMeta = currentArticleId
    ? (getArticleById(currentArticleId) ?? fallbackArticle)
    : fallbackArticle

  const { prev, next } = getAdjacentArticles(currentArticle.id)

  const articleDefinition = DOC_ARTICLE_COMPONENTS[currentArticle.id]
  const ArticleComponent = articleDefinition?.component
  const headings = articleDefinition?.headings || []

  // Switch article handler
  const handleSelectArticle = (articleId: string) => {
    router.push(`/docs?article=${articleId}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Return to Cards Hub handler
  const handleNavigateHome = () => {
    router.push("/docs")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Heading scrollspy
  useEffect(() => {
    if (isHubView || !headings || headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id)
          }
        })
      },
      { rootMargin: "-80px 0% -60% 0%" }
    )

    headings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings, currentArticleId, isHubView])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Search Modal */}
      <DocsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectArticle={handleSelectArticle}
      />

      {/* When on the Category Cards Hub View */}
      {isHubView ? (
        <DocsHubView
          onSelectArticle={handleSelectArticle}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      ) : (
        /* When in 3-Column Detailed Article View */
        <>
          {/* Docs Top Bar Header */}
          <DocsHeader
            currentArticle={currentArticle}
            onOpenSearch={() => setIsSearchOpen(true)}
            isMobileOpen={isMobileSidebarOpen}
            onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onNavigateHome={handleNavigateHome}
          />

          {/* Main 3-Column Layout */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex">
              {/* Left Sidebar */}
              <DocsSidebar
                currentArticleId={currentArticle.id}
                onSelectArticle={handleSelectArticle}
                onOpenSearch={() => setIsSearchOpen(true)}
                onNavigateHome={handleNavigateHome}
                isMobileOpen={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
              />

              {/* Middle Content Area */}
              <main className="min-w-0 flex-1 py-8 px-0 sm:px-6 lg:px-10">
                {/* Article Metadata Bar */}
                <div className="mb-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-b border-line pb-4">
                  {currentArticle.readTime && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{currentArticle.readTime}</span>
                    </div>
                  )}
                  {currentArticle.lastUpdated && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{currentArticle.lastUpdated}</span>
                    </div>
                  )}
                  <div className="ml-auto">
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-mist px-2.5 py-1 text-[11px] font-medium text-primary">
                      {currentArticle.category}
                    </span>
                  </div>
                </div>

                {/* Dynamic Article Content */}
                {ArticleComponent ? (
                  <ArticleComponent />
                ) : (
                  <div className="rounded-2xl border border-line bg-surface p-8 text-center space-y-3">
                    <BookOpen className="h-8 w-8 text-primary mx-auto" />
                    <h2 className="text-xl font-bold text-ink">{currentArticle.title}</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      {currentArticle.description}
                    </p>
                    <p className="text-xs text-muted-foreground pt-2">
                      This documentation guide is currently being finalized. Check back shortly or contact our support team.
                    </p>
                  </div>
                )}

                {/* Bottom Feedback and Pagination */}
                <DocsFeedback
                  currentArticle={currentArticle}
                  prevArticle={prev}
                  nextArticle={next}
                  onSelectArticle={handleSelectArticle}
                />
              </main>

              {/* Right Sidebar: Table of Contents & Quick Actions */}
              <DocsToc
                headings={headings}
                activeHeadingId={activeHeadingId}
                articleTitle={currentArticle.title}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function DocumentationView() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading documentation...</div>}>
      <DocsViewContent />
    </Suspense>
  )
}
