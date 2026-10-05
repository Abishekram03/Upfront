"use client"

import React, { useState } from "react"
import {
  Zap,
  ShieldCheck,
  Search,
  BarChart3,
  FileCheck,
  FileText,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  Command,
  ChevronRight,
  ExternalLink,
  MessageSquare,
} from "lucide-react"
import { DOCS_CATEGORIES } from "@/lib/docs/docs-config"
import { Container, Section, Reveal, SectionHeader } from "@/components/marketing/ui"

const ICON_MAP: Record<string, any> = {
  Zap,
  ShieldCheck,
  Search,
  BarChart3,
  FileCheck,
  FileText,
  BookOpen,
}

interface DocsHubViewProps {
  onSelectArticle: (articleId: string) => void
  onOpenSearch: () => void
}

export function DocsHubView({ onSelectArticle, onOpenSearch }: DocsHubViewProps) {
  const [copiedSnippet, setCopiedSnippet] = useState(false)

  const quickSnippet = `<script
  defer
  src="https://cdn.upfront.app/upfront.js"
  data-site="YOUR-SITE-ID"
  data-auto-block="true"
></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(quickSnippet)
    setCopiedSnippet(true)
    setTimeout(() => setCopiedSnippet(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Hero matching landing style */}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="bg-grid bg-grid-fade absolute inset-0 pointer-events-none" aria-hidden="true" />
        <Container className="relative py-16 text-center md:py-24">
          <Reveal>
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
              <span className="h-px w-5 bg-primary/60" aria-hidden="true" />
              Documentation
              <span className="h-px w-5 bg-primary/60" aria-hidden="true" />
            </p>
            <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-medium tracking-normal text-balance text-ink sm:text-5xl md:text-6xl">
              Everything you need to get running.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Guides for installing UpFront, configuring consent, scanning cookies, and understanding your data. Start here, then go deeper by product.
            </p>
          </Reveal>

          {/* Quick Search Bar */}
          <Reveal delay={100} className="pt-6 max-w-md mx-auto">
            <button
              onClick={onOpenSearch}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted-foreground shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-primary" />
                <span>Search documentation...</span>
              </div>
              <kbd className="inline-flex items-center gap-0.5 rounded border border-line bg-muted/60 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                <Command className="h-3 w-3" /> K
              </kbd>
            </button>
          </Reveal>
        </Container>
      </section>

      {/* Quickstart 1-line script section */}
      <Section className="py-16 md:py-20">
        <Reveal>
          <div className="mx-auto max-w-4xl">
            <SectionHeader
              align="left"
              eyebrow="Quickstart"
              title="Install in one line"
              description="A single <script> tag, under 4KB, served from our edge. Add it to your site's <head> and start measuring and managing consent immediately."
            />
            <div className="mt-8 overflow-hidden rounded-xl border border-line bg-ink shadow-lg">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                <span className="text-xs font-medium text-slate-400">Your website's &lt;head&gt;</span>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white">
                    &lt; 4KB
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-0.5 font-mono text-xs text-slate-300 hover:bg-white/20 transition-colors"
                  >
                    {copiedSnippet ? (
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
              <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-200">
                <code>{quickSnippet}</code>
              </pre>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Replace <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">YOUR-SITE-ID</code> with the site ID from your workspace.
              </p>
              <button
                onClick={() => onSelectArticle("quickstart")}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>Full Quickstart Guide</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Categories Grid Section */}
      <Section className="border-t border-line bg-surface py-16 md:py-24">
        <Reveal>
          <SectionHeader
            align="left"
            eyebrow="Browse by category"
            title="Find the guide you need"
            description="Select any category or guide below to open the complete step-by-step documentation."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DOCS_CATEGORIES.map((cat, i) => {
            const Icon = ICON_MAP[cat.iconName] || BookOpen

            return (
              <Reveal key={cat.id} delay={(i % 3) * 60}>
                <div className="card-lift flex h-full flex-col justify-between rounded-xl border border-line bg-surface p-6 shadow-xs">
                  <div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-mist text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-lg font-medium text-ink">{cat.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {cat.description}
                    </p>

                    {/* Articles list */}
                    <ul className="mt-5 space-y-2 border-t border-line pt-4">
                      {cat.articles.map((article) => (
                        <li key={article.id}>
                          <button
                            onClick={() => onSelectArticle(article.id)}
                            className="group flex w-full items-center justify-between rounded-lg py-1 text-left text-sm text-ink-soft hover:text-primary transition-colors"
                          >
                            <span className="font-normal truncate">{article.title}</span>
                            {article.badge ? (
                              <span className="ml-2 shrink-0 rounded bg-brand-mist px-1.5 py-0.5 text-[10px] font-mono text-primary">
                                {article.badge}
                              </span>
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-line">
                    <button
                      onClick={() => cat.articles[0]?.id && onSelectArticle(cat.articles[0].id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <span>Explore {cat.title}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </Section>

      {/* Support Section */}
      <Section className="border-t border-line py-16">
        <Reveal>
          <div className="rounded-xl border border-line bg-brand-mist/60 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-medium tracking-normal text-ink md:text-3xl">
              Need custom setup help or have questions?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Our engineering team is ready to assist you with custom integrations, enterprise CMP compliance, or data migrations.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Contact support</span>
              </a>
              <a
                href="https://github.com/Abishekram03/usrly"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-6 py-3 text-sm font-medium text-ink hover:bg-muted/60 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>
        </Reveal>
      </Section>
    </div>
  )
}
