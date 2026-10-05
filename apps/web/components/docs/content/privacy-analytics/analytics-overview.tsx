"use client"

import React from "react"
import { BarChart3, Shield, Lock, EyeOff, Hash, Cpu, CheckCircle2 } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function AnalyticsOverviewDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Privacy Analytics</span>
          <span>•</span>
          <span>Cookieless Tracking Engine</span>
        </div>
        <h1 id="analytics-overview" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Cookieless Tracking Engine
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          UpFront delivers web analytics with zero cookies, zero persistent device fingerprints, and zero retention of raw IP addresses. Learn how our daily cryptographic session hashing provides actionable insights while honoring visitor privacy by design.
        </p>
      </div>

      {/* How Cookieless Tracking Works */}
      <div className="space-y-4">
        <h2 id="how-it-works" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          How Daily Cryptographic Hashing Works
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Traditional analytics platforms write persistent cookies (e.g. <code>_ga</code> with 2-year lifespan) to track individuals across sessions. UpFront replaces persistent storage with a 24-hour rotating hash:
        </p>

        <div className="rounded-xl border border-line bg-surface p-5 space-y-4 my-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-ink">Session Identifier Generation Formula</h3>
              <p className="text-xs text-muted-foreground">Generated strictly in-memory at our edge ingestion nodes and never stored raw.</p>
            </div>
          </div>

          <DocsCodeBlock
            language="typescript"
            filename="session-hashing-concept.ts"
            code={`// Ingested at edge proxy:
const sessionHash = sha256(
  clientIP + 
  userAgent + 
  websiteDomain + 
  dailyRotatingSalt // Changes every 24 hours at 00:00 UTC
).substring(0, 16);

// The raw IP is immediately discarded from memory.
// It is mathematically impossible to reconstruct the visitor's identity.`}
          />
        </div>
      </div>

      {/* 3 Privacy Pillars */}
      <div className="space-y-4">
        <h2 id="privacy-pillars" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Zero-PII Compliance Architecture
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Our data pipeline is built from the ground up to comply with GDPR, CCPA, PECR, and PIPEDA without requiring consent banners for the analytics layer:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <EyeOff className="w-4 h-4" />
              <span>No Cross-Site Tracking</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Domain-isolated salts ensure a user visiting Website A cannot be correlated with their visit to Website B.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Lock className="w-4 h-4" />
              <span>Zero Raw IP Storage</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              IP addresses are mapped to country/city level at edge proxies and instantly purged from telemetry buffers.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Cpu className="w-4 h-4" />
              <span>Lightweight Payload</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The telemetry beacon is under 2.4 KB, executing asynchronously with zero performance degradation.
            </p>
          </div>
        </div>

        <DocsCallout type="tip" title="Consent Exemption">
          Because UpFront uses no device storage (no cookies, no LocalStorage) and stores no PII, analytics telemetry is completely exempt from GDPR consent requirements in the European Union.
        </DocsCallout>
      </div>

      {/* Captured Metrics */}
      <div className="space-y-4">
        <h2 id="captured-metrics" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Metrics Collected by UpFront
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Without collecting personal data, UpFront captures all necessary product intelligence:
        </p>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-muted/40 font-medium text-ink">
              <tr>
                <th className="p-3">Metric Dimension</th>
                <th className="p-3">Methodology</th>
                <th className="p-3">Privacy Safeguard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-muted-foreground">
              <tr>
                <td className="p-3 font-medium text-ink">Page Views & Visitors</td>
                <td className="p-3">Aggregated daily unique session counts.</td>
                <td className="p-3 text-emerald-600 font-medium">Daily salt rotation prevents multi-day profiling.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">Referrer Sources</td>
                <td className="p-3">Sanitized <code>document.referrer</code> parsing.</td>
                <td className="p-3 text-emerald-600 font-medium">Query parameters containing sensitive auth tokens stripped.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">Geographic Distribution</td>
                <td className="p-3">ISO Country Code and City resolution.</td>
                <td className="p-3 text-emerald-600 font-medium">No granular GPS or street-level coordinates recorded.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">Device & Browser</td>
                <td className="p-3">High-level User-Agent classification.</td>
                <td className="p-3 text-emerald-600 font-medium">Grouped by family (Chrome, Safari, iOS, Windows).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
  )
}
