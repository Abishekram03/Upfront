"use client"

import React from "react"
import { ShieldCheck, Scale, Globe, FileText, CheckCircle2, AlertTriangle } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function LegalFrameworksDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Consent Management (CMP)</span>
          <span>•</span>
          <span>Compliance Frameworks</span>
        </div>
        <h1 id="legal-frameworks" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Legal Frameworks (GDPR, CCPA, LGPD)
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Different jurisdictions mandate different consent mechanics. UpFront includes pre-configured compliance presets that automatically adjust your banner behavior, opt-in/opt-out signals, and records according to visitor location.
        </p>
      </div>

      {/* Preset Breakdown */}
      <div className="space-y-4">
        <h2 id="framework-presets" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Compliance Presets Comparison
        </h2>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-muted/40 font-medium text-ink">
              <tr>
                <th className="p-3">Framework</th>
                <th className="p-3">Target Region</th>
                <th className="p-3">Consent Model</th>
                <th className="p-3">Key Requirement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-muted-foreground">
              <tr>
                <td className="p-3 font-medium text-ink">GDPR & ePrivacy</td>
                <td className="p-3">EU, EEA, UK, Switzerland</td>
                <td className="p-3 font-semibold text-primary">Strict Opt-In</td>
                <td className="p-3">No non-essential cookies/scripts before explicit consent. Equal prominence for Accept & Reject.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">CCPA / CPRA</td>
                <td className="p-3">California & US States</td>
                <td className="p-3 font-semibold text-amber-600">Opt-Out Model</td>
                <td className="p-3">"Do Not Sell or Share My Personal Information" link. Honor browser GPC opt-out signals.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">LGPD</td>
                <td className="p-3">Brazil</td>
                <td className="p-3 font-semibold text-primary">Opt-In</td>
                <td className="p-3">Explicit consent required for behavioral profiling & cross-site marketing.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">Law 25</td>
                <td className="p-3">Quebec, Canada</td>
                <td className="p-3 font-semibold text-primary">Strict Opt-In</td>
                <td className="p-3">All tracking and profiling technologies deactivated by default.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* GDPR Equal Prominence */}
      <div className="space-y-4">
        <h2 id="equal-prominence" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          GDPR "Equal Prominence" Rule
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          European Data Protection Authorities (EDPB, CNIL, ICO) mandate that rejecting non-essential cookies must be just as easy as accepting them. Dark patterns — such as hiding the "Reject" button inside a sub-menu or styling it with lower contrast — violate GDPR.
        </p>

        <DocsCallout type="tip" title="UpFront Compliant by Default">
          When the GDPR preset is enabled, UpFront automatically displays <strong>Accept All</strong> and <strong>Reject All</strong> buttons with equal visual weight and identical click depth.
        </DocsCallout>
      </div>

      {/* Global Privacy Control (GPC) */}
      <div className="space-y-4">
        <h2 id="gpc-signal" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Global Privacy Control (GPC) Support
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Global Privacy Control (GPC) is a browser-level signal sent via <code>navigator.globalPrivacyControl === true</code>. Under California CPRA and Colorado CPA, websites are legally required to recognize GPC as a valid opt-out request.
        </p>

        <p className="text-sm leading-relaxed text-muted-foreground">
          UpFront automatically inspects this browser header. When GPC is detected:
        </p>

        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>Marketing and advertising category toggles are automatically switched <strong>Off</strong>.</li>
          <li>Third-party marketing pixels remain blocked.</li>
          <li>A timestamped proof-of-consent record is saved with <code>gpc_signal: true</code> for legal audit defense.</li>
        </ul>
      </div>
    </article>
  )
}
