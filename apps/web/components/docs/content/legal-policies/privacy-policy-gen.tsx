"use client"

import React from "react"
import { FileText, Shield, Sparkles, Sliders, CheckCircle2, Globe, RefreshCw } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function PrivacyPolicyGenDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Legal Policy Generators</span>
          <span>•</span>
          <span>Privacy Policy Generator</span>
        </div>
        <h1 id="privacy-policy-gen" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Privacy Policy Generator
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Generate comprehensive, attorney-reviewed Privacy Policies with automated cookie disclosure tables that update automatically whenever new trackers are detected.
        </p>
      </div>

      {/* 13-Section Compliant Structure */}
      <div className="space-y-4">
        <h2 id="policy-sections" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          13 Comprehensive Legal Sections
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The UpFront generator dynamically populates all necessary statutory disclosures required under GDPR, CCPA/CPRA, CalOPPA, and PIPEDA:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
          {[
            "1. Data Controller & Legal Entity Info",
            "2. Data Protection Officer (DPO) Contact",
            "3. Types of Personal Data Collected",
            "4. Legal Basis for Processing (GDPR Art. 6)",
            "5. Automated Cookie & LocalStorage Table",
            "6. Third-Party Sub-Processors & Vendors",
            "7. International Data Transfers (SCCs)",
            "8. User Privacy Rights (Access, Deletion, Portability)",
            "9. CCPA/CPRA 'Do Not Sell My Info' Clause",
            "10. Children's Privacy (COPPA Compliance)",
            "11. Data Retention Periods & Schedules",
            "12. Security & Encryption Safeguards",
            "13. Changes & Policy Revision History"
          ].map((section, idx) => (
            <div key={idx} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-3 text-xs font-medium text-ink">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{section}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Cookie Table Sync */}
      <div className="space-y-4">
        <h2 id="cookie-table-sync" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Automated Cookie Table Synchronization
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The single biggest challenge with traditional privacy policies is that cookie disclosures become stale the moment a developer installs a new tracking pixel.
        </p>

        <DocsCallout type="tip" title="Self-Updating Privacy Policy">
          UpFront automatically injects your live cookie scan inventory directly into Section 5 of your policy. When our crawler discovers a new cookie or you edit a description in the dashboard, your embedded policy reflects the update instantly.
        </DocsCallout>
      </div>

      {/* How to Generate */}
      <div className="space-y-4">
        <h2 id="how-to-generate" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Generating Your Policy in 3 Steps
        </h2>
        <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
          <li>Navigate to <strong>Legal Policies &rarr; Privacy Policy Generator</strong>.</li>
          <li>Fill in your company legal name, contact email, address, and jurisdiction.</li>
          <li>Review the generated draft and click <strong>Publish Live Policy</strong>.</li>
        </ol>
      </div>
    </article>
  )
}
