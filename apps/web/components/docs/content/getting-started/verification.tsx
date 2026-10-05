"use client"

import React from "react"
import { CheckCircle2, AlertTriangle, Bug, Terminal, Activity, RefreshCw } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function VerificationDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Getting Started</span>
          <span>•</span>
          <span>Diagnostics</span>
        </div>
        <h1 id="domain-verification" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Domain Verification & Health Check
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Learn how to test your UpFront installation, inspect live network telemetry, enable verbose debug mode, and diagnose common setup hurdles.
        </p>
      </div>

      {/* Verification Methods */}
      <div className="space-y-6">
        <h2 id="verification-methods" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          3 Ways to Verify Installation
        </h2>

        {/* Method 1 */}
        <div className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              1
            </span>
            <h3 className="text-base font-medium text-ink">DevTools Console Inspection</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Open your website, open Chrome/Firefox DevTools (<code>F12</code> or <code>Cmd+Option+I</code>), and switch to the <strong className="font-medium text-ink">Console</strong> tab. Type:
          </p>

          <DocsCodeBlock
            language="javascript"
            code={`// Check global Upfront instance
window.upfront

// Expected output:
// {
//   version: "1.4.0",
//   siteId: "site_9a8f2c01b4",
//   getConsent: ƒ (),
//   openPreferences: ƒ (),
//   trackEvent: ƒ ()
// }`}
          />
        </div>

        {/* Method 2 */}
        <div className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              2
            </span>
            <h3 className="text-base font-medium text-ink">Network Telemetry Inspection</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In DevTools, switch to the <strong className="font-medium text-ink">Network</strong> tab and filter by <code>telemetry</code> or <code>upfront</code>.
          </p>
          <ul className="text-sm space-y-1.5 list-disc pl-5 text-muted-foreground">
            <li>
              You should see a <code>POST</code> request sent to <code>https://cdn.upfront.app/api/v1/telemetry</code> or your custom proxy.
            </li>
            <li>
              The server will return HTTP <code>204 No Content</code> with a sub-50ms roundtrip.
            </li>
          </ul>
        </div>

        {/* Method 3 */}
        <div className="rounded-xl border border-line bg-surface p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              3
            </span>
            <h3 className="text-base font-medium text-ink">UpFront Dashboard Real-Time Pulse</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Visit your <a href="/analytics" className="text-primary font-medium hover:underline">Analytics Dashboard</a>. The live heartbeat counter will display:
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>1 Active Visitor Right Now (Your test session)</span>
          </div>
        </div>
      </div>

      {/* Debug Mode */}
      <div className="space-y-4">
        <h2 id="debug-mode" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Enabling Verbose Debug Mode
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If you want detailed console diagnostics showing which scripts were blocked, consent evaluations, and telemetry payload transmissions, add <code>data-debug="true"</code>:
        </p>

        <DocsCodeBlock
          filename="index.html"
          language="html"
          code={`<script
  defer
  src="https://cdn.upfront.app/upfront.js"
  data-site="YOUR-SITE-ID"
  data-auto-block="true"
  data-debug="true"
></script>`}
        />

        <DocsCallout type="tip" title="Console Output in Debug Mode">
          You will see colored logs prefixed with <code>[Upfront CMP]</code> detailing script interception states, Google Consent Mode signals, and localStorage cache syncs. Remember to remove <code>data-debug="true"</code> before production deployments.
        </DocsCallout>
      </div>

      {/* Troubleshooting Checklist */}
      <div className="space-y-4">
        <h2 id="troubleshooting-checklist" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Common Troubleshooting Scenarios
        </h2>

        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-1.5">
            <p className="font-medium text-ink text-sm">Symptom: Consent Banner does not appear</p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="font-medium text-ink">Check:</strong> Verify whether you have previously accepted or declined the banner in your browser. Clear your browser cookies/localStorage or test in an <strong>Incognito window</strong>. Also ensure <code>data-site</code> matches your registered workspace Site ID.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-1.5">
            <p className="font-medium text-ink text-sm">Symptom: Script auto-blocking is not stopping tracking tags</p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="font-medium text-ink">Check:</strong> Ensure the UpFront <code>&lt;script&gt;</code> is placed at the very top of your <code>&lt;head&gt;</code> before any other marketing tags. If a tag is loaded before UpFront, the browser DOM parser executes it before UpFront's interception hooks initialize.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-1.5">
            <p className="font-medium text-ink text-sm">Symptom: AdBlocker is blocking upfront.js</p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="font-medium text-ink">Check:</strong> UpFront operates in full cookieless mode and respects privacy standards. However, aggressive adblockers can be bypassed by using our custom proxy sub-domain (e.g. <code>analytics.yourcompany.com</code>) available on Growth and Business plans.
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
