"use client"

import React from "react"
import { Shield, Zap, Lock, Database, ArrowRight, CheckCircle2, Layers, Cpu, Globe } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function OverviewDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Getting Started</span>
          <span>•</span>
          <span>Core Concepts</span>
        </div>
        <h1 id="introduction" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Introduction & Architecture
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          UpFront is a unified, privacy-first website intelligence platform that consolidates cookieless analytics, a complete Consent Management Platform (CMP), automated cookie scanning, and legal policy generation into a <strong className="font-semibold text-ink">single lightweight script under 4KB</strong>.
        </p>
      </div>

      {/* The Problem & Our Approach */}
      <div className="space-y-4">
        <h2 id="why-upfront" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Why UpFront? The Fragmentation Problem
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Traditionally, making a modern website both data-informed and legally compliant required stitching together 3 to 5 separate third-party vendor tools:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
            <span className="text-xs font-medium text-primary uppercase">Legacy Problem 1</span>
            <h4 className="mt-2 text-base font-medium text-ink">Heavy Script Bloat</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Google Analytics (45KB+) + Cookiebot / OneTrust (120KB+) drastically drags down Google Lighthouse scores and Core Web Vitals (LCP, INP).
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
            <span className="text-xs font-medium text-primary uppercase">Legacy Problem 2</span>
            <h4 className="mt-2 text-base font-medium text-ink">Disjointed Data Silos</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Visitor consent records live in one dashboard, traffic metrics in another, and cookie audit logs in a third.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
            <span className="text-xs font-medium text-primary uppercase">Legacy Problem 3</span>
            <h4 className="mt-2 text-base font-medium text-ink">Per-Domain Pricing</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Traditional CMPs charge $15–$50 per domain per month, penalizing agencies and multi-site creators.
            </p>
          </div>
        </div>

        <DocsCallout type="tip" title="The UpFront Solution">
          UpFront delivers <strong className="font-semibold">unlimited websites</strong> on all plans, cookieless telemetry by default, a full CMP Banner Studio, automatic script auto-blocking, and an auditable proof-of-consent vault — all through one <code>&lt;script&gt;</code> tag.
        </DocsCallout>
      </div>

      {/* Core Architectural Pillars */}
      <div className="space-y-6">
        <h2 id="architectural-pillars" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Core Architectural Pillars
        </h2>

        <div className="space-y-6">
          {/* Pillar 1 */}
          <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mist text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-ink">1. Zero-Cookie Telemetry Engine</h3>
                <span className="text-xs text-muted-foreground">Cookieless, IP-free, daily rotated cryptographic salting</span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Upfront does not place tracking cookies, Flash cookies, or IndexedDB identifiers on visitor devices. Instead, it computes an ephemeral cryptographic session hash derived from:
            </p>
            <div className="mt-3 rounded-lg bg-muted/40 p-3 font-mono text-xs text-ink space-y-1">
              <div>session_hash = SHA-256( Client_IP + User_Agent + Site_ID + Daily_Server_Salt )</div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Because the server salt rotates every 24 hours, it is cryptographically impossible to track a visitor across different days or different websites. Raw IP addresses are discarded instantly in memory right at the edge lookup.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mist text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-ink">2. Client-Side Script Auto-Blocking (CMP)</h3>
                <span className="text-xs text-muted-foreground">MutationObserver & DOM prototype interception</span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              When <code>data-auto-block="true"</code> is enabled, UpFront hooks into the browser DOM execution pipeline. Any third-party script matching known tracking signatures (Google Tag Manager, Meta Pixel, TikTok, Hotjar) is automatically paused in a holding state until the visitor explicitly grants consent for that category.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mist text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-ink">3. Cryptographic Proof of Consent Vault</h3>
                <span className="text-xs text-muted-foreground">Tamper-evident audit receipts for regulatory compliance</span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Whenever a visitor clicks "Accept All", "Decline", or customizes preferences, UpFront generates a timestamped consent receipt containing the banner version, geo-location country, and category states. These receipts are stored securely and can be exported as CSV during regulatory audits.
            </p>
          </div>
        </div>
      </div>

      {/* Global Privacy Compatibility Matrix */}
      <div className="space-y-4">
        <h2 id="compliance-matrix" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Global Compliance Compatibility
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          UpFront is designed from the ground up to comply with major international privacy directives:
        </p>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-muted/40 font-medium text-ink">
              <tr>
                <th className="p-3">Regulation</th>
                <th className="p-3">Jurisdiction</th>
                <th className="p-3">Requirement</th>
                <th className="p-3">UpFront Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-muted-foreground">
              <tr>
                <td className="p-3 font-medium text-ink">GDPR & ePrivacy</td>
                <td className="p-3">European Union / UK</td>
                <td className="p-3">Opt-in consent prior to tracking scripts; proof of consent retention</td>
                <td className="p-3 text-emerald-600 font-medium">✓ 100% Supported</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">CCPA / CPRA</td>
                <td className="p-3">California, USA</td>
                <td className="p-3">"Do Not Sell My Info" link & Global Privacy Control (GPC) support</td>
                <td className="p-3 text-emerald-600 font-medium">✓ 100% Supported</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">Google Consent Mode v2</td>
                <td className="p-3">Global / EEA</td>
                <td className="p-3">ad_storage, analytics_storage, ad_user_data, ad_personalization signals</td>
                <td className="p-3 text-emerald-600 font-medium">✓ 100% Supported</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">PECR / FADP</td>
                <td className="p-3">UK / Switzerland</td>
                <td className="p-3">Granular category preference centre & cookie policy sync</td>
                <td className="p-3 text-emerald-600 font-medium">✓ 100% Supported</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </article>
  )
}
