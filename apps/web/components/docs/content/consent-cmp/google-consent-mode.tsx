"use client"

import React from "react"
import { Gauge, CheckCircle2, ArrowRight, ShieldCheck, Terminal } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function GoogleConsentModeDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Consent Management (CMP)</span>
          <span>•</span>
          <span>Google Consent Mode</span>
        </div>
        <h1 id="google-consent-mode" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Google Consent Mode v2 Integration
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Google Consent Mode v2 allows your Google tags (Google Analytics 4, Google Ads Conversion Tracking, Floodlight) to dynamically adjust their data collection behavior based on user consent choices.
        </p>
      </div>

      {/* The 4 Consent Signals */}
      <div className="space-y-4">
        <h2 id="consent-signals" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          The 4 Consent Mode v2 Signals
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Consent Mode v2 introduces two new mandatory parameters alongside the original two:
        </p>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-muted/40 font-medium text-ink">
              <tr>
                <th className="p-3">Signal Parameter</th>
                <th className="p-3">Mapped UpFront Category</th>
                <th className="p-3">Function</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-muted-foreground font-mono">
              <tr>
                <td className="p-3 font-medium text-primary">analytics_storage</td>
                <td className="p-3 font-sans">Analytics</td>
                <td className="p-3 font-sans">Enables storage (like cookies) related to analytics e.g. visit duration.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-primary">ad_storage</td>
                <td className="p-3 font-sans">Marketing</td>
                <td className="p-3 font-sans">Enables storage related to advertising.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-primary">ad_user_data (New in v2)</td>
                <td className="p-3 font-sans">Marketing</td>
                <td className="p-3 font-sans">Sets consent for sending user data to Google for advertising purposes.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-primary">ad_personalization (New in v2)</td>
                <td className="p-3 font-sans">Marketing</td>
                <td className="p-3 font-sans">Sets consent for personalized advertising (remarketing).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* How UpFront Handles It Automatically */}
      <div className="space-y-4">
        <h2 id="automatic-sync" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Automatic dataLayer Synchronization
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When <code>data-consent-mode="v2"</code> is enabled (the default), UpFront automatically executes the default consent command before any tags load, and issues updates upon visitor interaction:
        </p>

        <DocsCodeBlock
          filename="Internal Consent Mode Flow"
          language="javascript"
          code={`// 1. UpFront sets initial defaults (denied by default under GDPR)
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
  'ad_storage': 'denied',
  'analytics_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'wait_for_update': 500
});

// 2. When visitor clicks "Accept All", UpFront automatically pushes:
gtag('consent', 'update', {
  'ad_storage': 'granted',
  'analytics_storage': 'granted',
  'ad_user_data': 'granted',
  'ad_personalization': 'granted'
});`}
        />

        <DocsCallout type="tip" title="Zero Configuration Required in GTM">
          Because UpFront communicates natively with the standard Google <code>gtag('consent')</code> API, Google Tag Manager automatically intercepts these events without needing custom triggers or complex tag sequences.
        </DocsCallout>
      </div>

      {/* Verification in Network Tab */}
      <div className="space-y-4">
        <h2 id="verifying-consent-mode" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Verifying Consent Mode Signals in Network Tab
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To verify that Google tags are receiving your consent states:
        </p>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
          <li>Open DevTools (<code>F12</code>) and go to the <strong>Network</strong> tab.</li>
          <li>Filter by <code>collect?v=2</code> or <code>google-analytics.com</code>.</li>
          <li>
            Inspect the query parameters in the request payload:
            <ul className="mt-1 space-y-1 list-disc pl-5 font-mono text-xs">
              <li><code>gcs=G100</code>: All denied (cookieless ping).</li>
              <li><code>gcs=G111</code>: Granted analytics and ad storage.</li>
              <li><code>gcd=13r3r3r3r5</code>: Encoded Consent Mode v2 status showing individual states.</li>
            </ul>
          </li>
        </ol>
      </div>
    </article>
  )
}
