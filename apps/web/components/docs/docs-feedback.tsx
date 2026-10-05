"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight, CheckCircle2, MessageSquare } from "lucide-react"
import { DocArticleMeta } from "@/lib/docs/docs-types"

interface DocsFeedbackProps {
  currentArticle: DocArticleMeta
  prevArticle?: DocArticleMeta
  nextArticle?: DocArticleMeta
  onSelectArticle: (articleId: string) => void
}

export function DocsFeedback({
  currentArticle,
  prevArticle,
  nextArticle,
  onSelectArticle,
}: DocsFeedbackProps) {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [comment, setComment] = useState("")

  const handleVote = (vote: "yes" | "no") => {
    setFeedback(vote)
    setSubmitted(true)
  }

  return (
    <div className="mt-16 border-t border-line pt-8 space-y-10">
      {/* Helpful feedback block */}
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-ink">Was this page helpful?</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Let us know how we can improve our documentation.
            </p>
          </div>

          {!submitted ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote("yes")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>Yes</span>
              </button>
              <button
                onClick={() => handleVote("no")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-amber-500 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                <span>No</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Thank you for your feedback!</span>
            </div>
          )}
        </div>

        {submitted && feedback === "no" && (
          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-xs font-medium text-ink mb-2">What could we improve?</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Optional: Tell us what's missing or unclear..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 rounded-lg border border-line bg-muted/40 px-3 py-1.5 text-xs text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => setSubmitted(true)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Prev / Next Pagination Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {prevArticle ? (
          <button
            onClick={() => onSelectArticle(prevArticle.id)}
            className="group flex flex-col items-start justify-between rounded-xl border border-line bg-surface p-4 text-left transition-all hover:border-primary/40 hover:shadow-xs"
          >
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Previous</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-ink group-hover:text-primary transition-colors">
              {prevArticle.title}
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5">{prevArticle.category}</span>
          </button>
        ) : (
          <div className="hidden sm:block" />
        )}

        {nextArticle && (
          <button
            onClick={() => onSelectArticle(nextArticle.id)}
            className="group flex flex-col items-end justify-between rounded-xl border border-line bg-surface p-4 text-right transition-all hover:border-primary/40 hover:shadow-xs sm:col-start-2"
          >
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-sm font-semibold text-ink group-hover:text-primary transition-colors">
              {nextArticle.title}
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5">{nextArticle.category}</span>
          </button>
        )}
      </div>
    </div>
  )
}
