"use client"

import React from "react"
import { Target, Layers, Code, Sparkles, Filter, CheckCircle2, AlertTriangle } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function UtmReferrersDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Privacy Analytics</span>
          <span>•</span>
          <span>Campaigns & Custom Events</span>
        </div>
        <h1 id="utm-referrers" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          UTM Campaigns & Custom Events
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Track campaign conversions across paid ads, newsletters, and social media with automatic UTM parsing and programmatic custom event tracking.
        </p>
      </div>

      {/* UTM Parameter Support */}
      <div className="space-y-4">
        <h2 id="utm-parameters" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Automated UTM Parameter Extraction
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          UpFront automatically captures standard campaign query parameters from the landing URL without requiring manual setup:
        </p>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs my-6">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-muted/40 font-medium text-ink">
              <tr>
                <th className="p-3">Parameter</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Example Query String</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-muted-foreground">
              <tr>
                <td className="p-3 font-mono text-primary font-medium">utm_source</td>
                <td className="p-3">Traffic platform or referrer</td>
                <td className="p-3 font-mono text-[11px]">utm_source=twitter</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-primary font-medium">utm_medium</td>
                <td className="p-3">Marketing medium channel</td>
                <td className="p-3 font-mono text-[11px]">utm_medium=cpc</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-primary font-medium">utm_campaign</td>
                <td className="p-3">Specific promotion or product release</td>
                <td className="p-3 font-mono text-[11px]">utm_campaign=summer_sale_2026</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-primary font-medium">utm_term</td>
                <td className="p-3">Target search keywords</td>
                <td className="p-3 font-mono text-[11px]">utm_term=cookie+banner+saas</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-primary font-medium">utm_content</td>
                <td className="p-3">Ad creative variation or A/B variant</td>
                <td className="p-3 font-mono text-[11px]">utm_content=banner_variant_b</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Event Tracking API */}
      <div className="space-y-4">
        <h2 id="custom-events" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Custom Event Tracking API
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Track high-value user conversions such as button clicks, signups, downloads, and checkout completions using the global <code>window.upfront</code> JavaScript API:
        </p>

        <DocsCodeBlock
          language="typescript"
          filename="event-tracking-examples.ts"
          code={`// 1. Basic event trigger
window.upfront?.trackEvent("signup_started");

// 2. Event with numeric revenue or custom metadata
window.upfront?.trackEvent("subscription_upgraded", {
  plan: "business_annual",
  currency: "USD",
  value: 499
});

// 3. Document or PDF download tracking
document.getElementById("download-whitepaper")?.addEventListener("click", () => {
  window.upfront?.trackEvent("whitepaper_downloaded", {
    title: "gdpr_compliance_2026_guide"
  });
});`}
        />

        <DocsCallout type="warning" title="Privacy Safeguard: No PII in Events">
          Never pass personally identifiable information (e.g. email addresses, phone numbers, credit card tokens, or full names) inside custom event properties. UpFront edge proxies automatically drop events containing emails or unhashed identifiers.
        </DocsCallout>
      </div>

      {/* React / Next.js Hook Pattern */}
      <div className="space-y-4">
        <h2 id="react-integration" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          React & Next.js Integration Helper
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You can create a reusable TypeScript hook in your Next.js or React application:
        </p>

        <DocsCodeBlock
          language="typescript"
          filename="use-analytics.ts"
          code={`export function useAnalytics() {
  const track = (eventName: string, properties?: Record<string, string | number | boolean>) => {
    if (typeof window !== "undefined" && window.upfront?.trackEvent) {
      window.upfront.trackEvent(eventName, properties);
    }
  };

  return { track };
}`}
        />
      </div>
    </article>
  )
}
