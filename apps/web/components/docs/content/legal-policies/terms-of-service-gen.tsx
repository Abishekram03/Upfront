"use client"

import React from "react"
import { FileText, ShieldAlert, Scale, CheckCircle2, Sliders, Globe } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function TermsOfServiceGenDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Legal Policy Generators</span>
          <span>•</span>
          <span>Terms of Service Generator</span>
        </div>
        <h1 id="terms-of-service-gen" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Terms of Service Generator
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Protect your business, define acceptable use rules, and establish enforceable user agreements with our 21-section standardized Terms of Service generator.
        </p>
      </div>

      {/* Business Model Presets */}
      <div className="space-y-4">
        <h2 id="business-presets" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Customized for Your Business Model
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The generator adapts clauses depending on whether your business provides subscription software, digital ecommerce, marketplaces, or content:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <span className="text-xs font-semibold text-primary">SaaS & Cloud Apps</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Includes uptime SLA disclaimers, API usage quotas, subscription renewals, and cancellation terms.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <span className="text-xs font-semibold text-primary">E-Commerce Stores</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Includes return & refund policies, shipping terms, pricing errors, and sales tax disclosures.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <span className="text-xs font-semibold text-primary">Content & Communities</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Includes user-generated content (UGC) licensing, DMCA copyright notices, and community moderation rules.
            </p>
          </div>
        </div>
      </div>

      {/* Core Legal Protections */}
      <div className="space-y-4">
        <h2 id="core-clauses" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Essential Protection Clauses Included
        </h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-surface p-4 space-y-1">
            <h4 className="text-sm font-medium text-ink">Limitation of Liability & Warranty Disclaimers</h4>
            <p className="text-xs text-muted-foreground">
              Caps financial exposure and provides standard &quot;as is&quot; and &quot;as available&quot; commercial disclaimers.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-1">
            <h4 className="text-sm font-medium text-ink">Intellectual Property & Trademarks</h4>
            <p className="text-xs text-muted-foreground">
              Explicitly reserves ownership of proprietary source code, branding, interfaces, and customer data.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-1">
            <h4 className="text-sm font-medium text-ink">Governing Law & Dispute Resolution</h4>
            <p className="text-xs text-muted-foreground">
              Sets the legal jurisdiction, binding arbitration rules, and class action waiver provisions.
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
