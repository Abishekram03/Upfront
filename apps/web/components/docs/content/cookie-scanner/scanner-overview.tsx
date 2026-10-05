"use client"

import React from "react"
import { Search, Globe, Cookie, Shield, Terminal, CheckCircle2, AlertTriangle, Layers } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function ScannerOverviewDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Cookie Scanner & Audits</span>
          <span>•</span>
          <span>Automated Crawler</span>
        </div>
        <h1 id="scanner-overview" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Automated Cookie Scanner
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          The UpFront automated cookie scanner crawls your website to uncover every cookie, tracker, local storage key, and third-party beacon running on your pages before your visitors encounter them.
        </p>
      </div>

      {/* Two-Tier Scanning Technology */}
      <div className="space-y-4">
        <h2 id="scanning-technology" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Two-Tier Scanning Engine
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Many modern marketing tags are injected asynchronously via JavaScript only after user interaction. UpFront uses a hybrid scanning approach:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-2">
            <span className="text-xs font-medium text-primary uppercase">Tier 1</span>
            <h4 className="text-base font-medium text-ink">HTTP Crawl Engine</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rapidly parses HTML response headers, <code>Set-Cookie</code> directives, meta tags, and static <code>&lt;script&gt;</code> sources across hundreds of pages in seconds.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-2">
            <span className="text-xs font-medium text-primary uppercase">Tier 2</span>
            <h4 className="text-base font-medium text-ink">Headless Browser Runtime</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Spins up an isolated Chromium browser environment, executes client-side JavaScript, and captures runtime cookies, Web Storage, and network tracking beacons.
            </p>
          </div>
        </div>
      </div>

      {/* What UpFront Discovers */}
      <div className="space-y-4">
        <h2 id="what-is-detected" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Detected Storage & Tracker Types
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The scanner identifies and categorizes all client-side persistence mechanisms:
        </p>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-muted/40 font-medium text-ink">
              <tr>
                <th className="p-3">Type</th>
                <th className="p-3">Scope</th>
                <th className="p-3">Example Detected Keys</th>
                <th className="p-3">Privacy Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-muted-foreground">
              <tr>
                <td className="p-3 font-medium text-ink">First-Party HTTP Cookies</td>
                <td className="p-3">Your domain</td>
                <td className="p-3 font-mono">session_id, csrf_token, cart_id</td>
                <td className="p-3">Essential for core site functions.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">Third-Party Tracking Cookies</td>
                <td className="p-3">External vendor domains</td>
                <td className="p-3 font-mono">_fbp, _ga, _gcl_au, IDE, fr</td>
                <td className="p-3 text-amber-600 font-medium">Requires explicit GDPR opt-in consent.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">HTML5 Local Storage</td>
                <td className="p-3">Persistent browser storage</td>
                <td className="p-3 font-mono">loglevel, theme, ajx_user_id</td>
                <td className="p-3">Treated as cookies under ePrivacy Directive.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">Session Storage</td>
                <td className="p-3">Active tab session</td>
                <td className="p-3 font-mono">checkout_step, analytics_buffer</td>
                <td className="p-3">Temporary data storage.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Running Your First Scan */}
      <div className="space-y-4">
        <h2 id="running-a-scan" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          How to Run a Manual Scan
        </h2>
        <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
          <li>Navigate to your UpFront Dashboard and click on <strong>Cookie Scanner</strong>.</li>
          <li>Select your registered website and click <strong>"Scan Website Now"</strong>.</li>
          <li>The crawler walks through your sitemap and discovers internal links.</li>
          <li>Once complete (usually 10–45 seconds), review the categorized inventory of detected cookies.</li>
        </ol>

        <DocsCallout type="tip" title="Scan Limits by Plan">
          Free plans support 100 pages per scan, Growth supports 1,000 pages per scan with monthly automation, and Business supports 5,000 pages per scan with weekly or daily scheduling.
        </DocsCallout>
      </div>
    </article>
  )
}
