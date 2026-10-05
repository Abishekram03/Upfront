"use client"

import React from "react"
import { Download, FileSpreadsheet, Filter, Calendar, ShieldCheck, Clock } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function ExportAuditLogsDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Proof of Consent Vault</span>
          <span>•</span>
          <span>CSV Exports & Regulatory Defense</span>
        </div>
        <h1 id="export-audit-logs" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          CSV Exports & Regulatory Defense
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Learn how to query, filter, and export timestamped consent records to satisfy regulatory inquiries from European DPAs, legal counsel, or internal compliance audits.
        </p>
      </div>

      {/* Querying & Filtering */}
      <div className="space-y-4">
        <h2 id="filtering-records" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Filtering Audit Records
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The UpFront Consent Vault lets you run granular queries across millions of historical consent interactions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Calendar className="w-4 h-4" />
              <span>Date Range</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Filter by exact dates or preset periods (Last 24 Hours, Last 30 Days, Custom Quarter).
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Filter className="w-4 h-4" />
              <span>Action Type</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Segment by <code>Accept All</code>, <code>Reject Non-Essential</code>, or <code>Custom Preferences</code>.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Jurisdiction</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Isolate visitors by country (e.g. Germany, France, United Kingdom, California).
            </p>
          </div>
        </div>
      </div>

      {/* Exporting Data */}
      <div className="space-y-4">
        <h2 id="export-formats" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Exporting to CSV & JSON
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To export records for compliance verification:
        </p>

        <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
          <li>Navigate to <strong>Proof of Consent &rarr; Audit Vault</strong>.</li>
          <li>Apply any required filters (e.g. Country: <code>DE</code>, Date: <code>2026-01-01 to 2026-06-30</code>).</li>
          <li>Click the <strong>Export</strong> button in the top-right corner.</li>
          <li>Select either <strong>CSV (Spreadsheet / Excel)</strong> or <strong>JSON (Raw cryptographic audit payload)</strong>.</li>
          <li>Your download will generate securely and be delivered within seconds.</li>
        </ol>

        <DocsCallout type="important" title="Audit Trail Retention Policy">
          Depending on your plan, audit logs are retained for 12 months (Starter), 24 months (Growth), or 36 months (Business). After the retention threshold, old logs are securely expunged in accordance with GDPR data minimization principles.
        </DocsCallout>
      </div>
    </article>
  )
}
