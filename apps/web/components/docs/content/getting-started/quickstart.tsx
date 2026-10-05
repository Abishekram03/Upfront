"use client"

import React from "react"
import { CheckCircle2, Copy, ArrowRight, ShieldCheck, Zap, Sparkles, Terminal } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function QuickstartDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Getting Started</span>
          <span>•</span>
          <span>Quickstart</span>
        </div>
        <h1 id="quickstart-guide" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Quickstart Guide (2-Minute Setup)
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Follow this 3-step walkthrough to create your workspace, configure your consent preferences, and embed the script on your website.
        </p>
      </div>

      {/* Step 1 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            1
          </span>
          <h2 id="step-1-create-site" className="text-xl font-medium tracking-normal text-ink">
            Create your Workspace and Add a Website
          </h2>
        </div>
        <div className="pl-11 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Log in to your <a href="/login" className="text-primary font-medium hover:underline">UpFront Dashboard</a>, navigate to the <strong className="font-semibold text-ink">Sites</strong> page, and click <strong className="font-semibold text-ink">Add Website</strong>.
          </p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li><strong className="font-medium text-ink">Website Name</strong>: e.g., <code>Acme Corp Marketing</code></li>
            <li><strong className="font-medium text-ink">Domain Name</strong>: e.g., <code>acme.com</code> (without <code>https://</code>)</li>
            <li><strong className="font-medium text-ink">Timezone & Currency</strong>: Select your preferred reporting timezone</li>
          </ul>
          <p>
            Upon creation, you will receive your unique <strong className="font-medium text-ink">Site ID</strong> (e.g. <code>site_9a8f2c01b4</code>).
          </p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            2
          </span>
          <h2 id="step-2-embed-script" className="text-xl font-medium tracking-normal text-ink">
            Embed the Snippet into your &lt;head&gt;
          </h2>
        </div>
        <div className="pl-11 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Copy the lightweight HTML snippet below and paste it directly into the <code>&lt;head&gt;</code> of your website templates:
          </p>

          <DocsCodeBlock
            filename="index.html"
            badge="< 4KB"
            language="html"
            code={`<!-- Upfront Analytics & Consent CMP -->
<script
  defer
  src="https://cdn.upfront.app/upfront.js"
  data-site="YOUR-SITE-ID"
  data-auto-block="true"
></script>`}
          />

          <DocsCallout type="important" title="Placement Rule">
            Always place the UpFront script tag <strong className="font-semibold">before</strong> any third-party marketing tags (like Meta Pixel, TikTok, or Google Ads) so that client-side script auto-blocking can intercept them before they execute.
          </DocsCallout>
        </div>
      </div>

      {/* Step 3 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            3
          </span>
          <h2 id="step-3-verify" className="text-xl font-medium tracking-normal text-ink">
            Verify Live Telemetry & Consent Banner
          </h2>
        </div>
        <div className="pl-11 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Open your website in an Incognito window:
          </p>
          <ol className="space-y-2 list-decimal pl-5">
            <li>
              You should see your customized <strong className="font-medium text-ink">Consent Banner</strong> appear at the bottom or corner of your screen.
            </li>
            <li>
              Open your browser's Developer Tools (<code>F12</code>) and click on the <strong className="font-medium text-ink">Console</strong> tab. Type <code>window.upfront</code> to inspect the initialized API client.
            </li>
            <li>
              Return to your UpFront Dashboard. You will see the <strong className="font-medium text-ink">Live Pulse Indicator</strong> turn green with your active test session!
            </li>
          </ol>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Congratulations! Your site is now live with privacy analytics and CMP.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="space-y-4 border-t border-line pt-6">
        <h2 id="next-steps" className="text-xl font-medium tracking-normal text-ink">
          Recommended Next Steps
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/docs?article=installation"
            className="group rounded-xl border border-line bg-surface p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">Framework Guides</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h4 className="mt-2 text-base font-medium text-ink">Framework-Specific Installation</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Integrate with Next.js App Router, React, Vue, WordPress, Webflow, or Shopify.
            </p>
          </a>

          <a
            href="/docs?article=banner-studio"
            className="group rounded-xl border border-line bg-surface p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">CMP Styling</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h4 className="mt-2 text-base font-medium text-ink">Customize Banner Studio</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Pick colors, rounded corners, font families, and privacy legal framework presets.
            </p>
          </a>
        </div>
      </div>
    </article>
  )
}
