"use client"

import React from "react"
import { Tag, Shield, Database, Edit3, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function CookieCategorizationDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Cookie Scanner & Audits</span>
          <span>•</span>
          <span>Categorization & Overrides</span>
        </div>
        <h1 id="cookie-categorization" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Cookie Categorization & Overrides
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Every cookie discovered by UpFront is categorized into one of five standard legal categories. Learn how automated dictionary matching works, how to override classifications, and how changes sync automatically to your Cookie Banner and Policy.
        </p>
      </div>

      {/* The 5 Standard Categories */}
      <div className="space-y-4">
        <h2 id="standard-categories" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          The 5 Standard Compliance Categories
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Under GDPR, ePrivacy Directive, and CCPA/CPRA, cookies must be grouped by their operational purpose:
        </p>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs my-6">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-muted/40 font-medium text-ink">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Consent Required?</th>
                <th className="p-3">Typical Purpose</th>
                <th className="p-3">Example Trackers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-muted-foreground">
              <tr>
                <td className="p-3 font-medium text-ink">
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <Shield className="w-3.5 h-3.5" /> Strictly Necessary
                  </span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    Exempt (Always Active)
                  </span>
                </td>
                <td className="p-3">Security, CSRF protection, login auth, load balancing, shopping cart persistence.</td>
                <td className="p-3 font-mono text-[11px]">__Host-session, csrf_token, XSRF-TOKEN</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">
                  <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold">
                    <Tag className="w-3.5 h-3.5" /> Functional
                  </span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    Opt-in (GDPR)
                  </span>
                </td>
                <td className="p-3">Language preferences, dark/light theme, video player state, live chat widgets.</td>
                <td className="p-3 font-mono text-[11px]">i18next_lng, crisp-client, intercom-id</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">
                  <span className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold">
                    <Tag className="w-3.5 h-3.5" /> Analytics
                  </span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    Opt-in (GDPR)
                  </span>
                </td>
                <td className="p-3">Aggregated telemetry, bounce rate, page view metrics, user journey funnels.</td>
                <td className="p-3 font-mono text-[11px]">_ga, _gid, _pk_id, plausible_session</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">
                  <span className="inline-flex items-center gap-1.5 text-purple-600 font-semibold">
                    <Tag className="w-3.5 h-3.5" /> Performance
                  </span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    Opt-in (GDPR)
                  </span>
                </td>
                <td className="p-3">Core Web Vitals monitoring, CDN edge routing, client-side error telemetry.</td>
                <td className="p-3 font-mono text-[11px]">sentry_session, _cfuvid, datadog_rum</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-ink">
                  <span className="inline-flex items-center gap-1.5 text-rose-600 font-semibold">
                    <Tag className="w-3.5 h-3.5" /> Advertisement
                  </span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-md bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                    Opt-in (GDPR) / Opt-out (CCPA)
                  </span>
                </td>
                <td className="p-3">Cross-domain user profiling, retargeting pixels, conversion attribution.</td>
                <td className="p-3 font-mono text-[11px]">_fbp, IDE, fr, _gcl_au, li_sugr</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Dictionary Matching */}
      <div className="space-y-4">
        <h2 id="dictionary-matching" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Automated Dictionary Matching
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          UpFront maintains a cloud dictionary of over <strong>50,000+ known web cookies and vendor signatures</strong>. When the scanner identifies a new key, it automatically matches:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <span className="text-xs font-semibold text-primary">1. Regex Patterns</span>
            <p className="text-xs text-muted-foreground">
              Matches wildcard keys such as <code>_ga_*</code> or <code>mp_*_mixpanel</code> to Google Analytics 4 and Mixpanel engines.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <span className="text-xs font-semibold text-primary">2. Plain-English Descriptions</span>
            <p className="text-xs text-muted-foreground">
              Automatically provides human-readable explanations of why the cookie exists and how long it stays stored on the device.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <span className="text-xs font-semibold text-primary">3. Vendor Identification</span>
            <p className="text-xs text-muted-foreground">
              Links the cookie to the responsible third party (e.g. Google LLC, Meta Platforms, Stripe, Cloudflare).
            </p>
          </div>
        </div>
      </div>

      {/* Manual Overrides */}
      <div className="space-y-4">
        <h2 id="manual-overrides" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Custom Overrides & Editing
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If your website utilizes proprietary first-party cookies or custom tokens, you can edit them directly in the UpFront Dashboard:
        </p>

        <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
          <li>Go to <strong>Cookie Scanner &rarr; Discovered Cookies</strong>.</li>
          <li>Click the <strong>Edit (Pencil)</strong> icon next to any cookie record.</li>
          <li>Change the <strong>Category</strong> dropdown to the appropriate classification.</li>
          <li>Write a custom description explaining its purpose for your visitors.</li>
          <li>Set the exact <strong>Retention Duration</strong> (e.g. <code>Session</code>, <code>30 days</code>, <code>1 year</code>).</li>
          <li>Click <strong>Save & Publish</strong>.</li>
        </ol>

        <DocsCallout type="important" title="Instant Live Sync">
          All categorization changes sync to your live website in real-time. When a user opens your Cookie Preference Centre or views your embedded Cookie Policy, the updated category and description are rendered immediately.
        </DocsCallout>
      </div>
    </article>
  )
}
