"use client"

import React from "react"
import { Globe, Languages, MapPin, ShieldCheck, CheckCircle2 } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function GeoTargetingDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Consent Management (CMP)</span>
          <span>•</span>
          <span>Geo-Location & Languages</span>
        </div>
        <h1 id="geo-targeting" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Geo-Targeting & Regional Delivery
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Deliver the exact legal consent experience required in your visitor's jurisdiction while avoiding unnecessary banners for visitors in non-regulated regions.
        </p>
      </div>

      {/* How Edge Geo-Targeting Works */}
      <div className="space-y-4">
        <h2 id="edge-detection" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Edge Geo-Resolution (Zero IP Storage)
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When a request hits UpFront's edge CDN, the visitor's country and state are resolved instantly via edge headers (e.g. <code>cf-ipcountry</code>). The raw IP address is discarded in memory without writing it to disk.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-1.5">
            <span className="text-xs font-medium text-primary uppercase">Zone 1: EU / EEA / UK</span>
            <h4 className="text-base font-medium text-ink">Strict GDPR Banner</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Full opt-in banner with equal Accept/Reject buttons; scripts blocked until consent.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-1.5">
            <span className="text-xs font-medium text-primary uppercase">Zone 2: California / US</span>
            <h4 className="text-base font-medium text-ink">CCPA Notice & GPC</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              "Do Not Sell My Info" link with automatic Global Privacy Control opt-out handling.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-1.5">
            <span className="text-xs font-medium text-primary uppercase">Zone 3: Rest of World</span>
            <h4 className="text-base font-medium text-ink">Silent Cookieless Mode</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Zero intrusive banners; measures cookieless pageviews with 100% privacy compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Language Support */}
      <div className="space-y-4">
        <h2 id="multi-language" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Automatic Multi-Language Translation
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          UpFront inspects the browser's <code>navigator.language</code> setting and automatically serves the banner in the visitor's preferred language. Supported out of the box:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-ink my-4">
          <span className="p-2 rounded border border-line bg-muted/30">English (en)</span>
          <span className="p-2 rounded border border-line bg-muted/30">German (de)</span>
          <span className="p-2 rounded border border-line bg-muted/30">French (fr)</span>
          <span className="p-2 rounded border border-line bg-muted/30">Spanish (es)</span>
          <span className="p-2 rounded border border-line bg-muted/30">Italian (it)</span>
          <span className="p-2 rounded border border-line bg-muted/30">Portuguese (pt)</span>
          <span className="p-2 rounded border border-line bg-muted/30">Dutch (nl)</span>
          <span className="p-2 rounded border border-line bg-muted/30">Polish (pl)</span>
        </div>

        <DocsCallout type="tip" title="Custom Translations">
          You can provide custom text overrides for any language under <strong>CMP &gt; Banner Studio &gt; Translations</strong> in your UpFront dashboard.
        </DocsCallout>
      </div>
    </article>
  )
}
