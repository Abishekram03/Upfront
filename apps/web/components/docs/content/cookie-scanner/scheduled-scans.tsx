"use client"

import React from "react"
import { Calendar, Bell, History, FileText, CheckCircle2, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function ScheduledScansDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Cookie Scanner & Audits</span>
          <span>•</span>
          <span>Scheduled Audits & Auto-Sync</span>
        </div>
        <h1 id="scheduled-scans" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Scheduled Audits & Auto-Sync
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Maintain continuous GDPR & ePrivacy compliance by configuring automated recurring cookie scans. Detect tracking drift when third-party scripts introduce new cookies and keep your public legal policies always up to date.
        </p>
      </div>

      {/* Why Continuous Audits Matter */}
      <div className="space-y-4">
        <h2 id="why-continuous-audits" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Why Continuous Cookie Auditing is Critical
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Websites are dynamic. Engineering updates, marketing campaign tags, and third-party SaaS vendors frequently introduce new cookies without explicit notice. If a newly added marketing pixel drops cookies without prior consent, your site is immediately non-compliant under GDPR.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Calendar className="w-4 h-4" />
              <span>Automated Cadence</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Configure scans to run automatically every week or month without manual intervention.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
              <Bell className="w-4 h-4" />
              <span>Drift Alerts</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive immediate email and dashboard notifications whenever an unrecognized cookie is detected.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
              <RefreshCw className="w-4 h-4" />
              <span>Zero-Touch Sync</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              New verified cookies are automatically published to your live Cookie Policy and CMP banner modal.
            </p>
          </div>
        </div>
      </div>

      {/* Configuring Schedule */}
      <div className="space-y-4">
        <h2 id="configuring-schedule" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Configuring Scan Schedule & Depth
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You can configure scanning settings on a per-website basis:
        </p>

        <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
          <li>Navigate to <strong>Cookie Scanner &rarr; Scan Settings</strong> in your UpFront Dashboard.</li>
          <li>Choose your preferred <strong>Frequency</strong>: <code>Weekly (Recommended)</code>, <code>Monthly</code>, or <code>Manual Only</code>.</li>
          <li>Select the <strong>Crawl Depth</strong>: Specify the maximum page limit (up to 5,000 pages on Business tier).</li>
          <li>Optionally provide custom URL paths to prioritize (e.g. <code>/checkout</code>, <code>/pricing</code>, <code>/login</code>).</li>
          <li>Toggle <strong>Auto-Publish New Cookies</strong> to keep your legal documents synchronized without manual approval.</li>
        </ol>

        <DocsCallout type="tip" title="Sitemap Crawling">
          UpFront automatically parses your domain&apos;s <code>/sitemap.xml</code> to guarantee exhaustive discovery of deep subpages, blog posts, and marketing landing pages.
        </DocsCallout>
      </div>

      {/* Compliance Audit Reports */}
      <div className="space-y-4">
        <h2 id="audit-reports" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Audit History & Regulatory Export
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every scan execution produces a tamper-proof audit record containing:
        </p>

        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li><strong>Timestamped Scan Execution</strong> with total pages crawled and duration.</li>
          <li><strong>Delta Comparison</strong> highlighting cookies added, modified, or removed since the prior scan.</li>
          <li><strong>Third-Party Vendor Origin</strong> mapping each discovered tracker to its legal entity.</li>
          <li><strong>1-Click PDF & CSV Export</strong> ready to provide to Data Protection Officers (DPOs) or regulatory auditors.</li>
        </ul>
      </div>
    </article>
  )
}
