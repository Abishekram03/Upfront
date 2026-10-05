"use client"

import React from "react"
import { Sliders, Eye, Palette, Layout, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function BannerStudioDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Consent Management (CMP)</span>
          <span>•</span>
          <span>Banner Customization</span>
        </div>
        <h1 id="banner-studio" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Banner Studio & Layouts
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          The UpFront Banner Studio allows you to design, preview, and deploy high-converting, compliant cookie consent banners that seamlessly match your brand aesthetic without writing a single line of CSS.
        </p>
      </div>

      {/* Available Layouts */}
      <div className="space-y-4">
        <h2 id="banner-layouts" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Banner Form Factors & Layouts
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Choose from 4 layout archetypes engineered for desktop and mobile responsiveness:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mist text-primary text-xs">
                1
              </span>
              <span>Bottom Floating Bar (Default)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A sleek bar fixed across the bottom of the viewport with backdrop blur. Best for general compliance with minimal intrusion on reading flow.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mist text-primary text-xs">
                2
              </span>
              <span>Floating Corner Box</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A compact card docked to the bottom-left or bottom-right corner. Popular for SaaS apps and modern portfolio sites.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mist text-primary text-xs">
                3
              </span>
              <span>Center Modal Dialog</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A centered card overlay with optional background dimming. Ideal when explicit opt-in confirmation is required before interaction.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mist text-primary text-xs">
                4
              </span>
              <span>Full Screen Compliance Barrier</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Locks page scroll until the user makes a choice. Recommended for strict enterprise intranets and e-commerce compliance mandates.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Theming & Design Tokens */}
      <div className="space-y-4">
        <h2 id="styling-options" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Visual Theming & Customization
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          In your dashboard under <strong>CMP &gt; Banner Studio</strong>, customize every visual property:
        </p>

        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li><strong className="font-medium text-ink">Theme Mode</strong>: Automatic System Match, Forced Light, or Sleek Dark Mode.</li>
          <li><strong className="font-medium text-ink">Brand Accent Color</strong>: Set custom HEX/HSL values for primary buttons and category toggle switches.</li>
          <li><strong className="font-medium text-ink">Border Radius</strong>: Sharp (0px), Rounded (8px), Pill (9999px), or match your CSS variable.</li>
          <li><strong className="font-medium text-ink">Typography</strong>: Automatically inherits your website's active font stack or custom Google Fonts.</li>
          <li><strong className="font-medium text-ink">Backdrop Blur & Shadow</strong>: Subtle glassmorphism with custom drop shadows.</li>
        </ul>

        <DocsCallout type="tip" title="Custom CSS Injection">
          On Business plans, you can override any banner style by passing custom CSS selectors directly targeted at <code>#upfront-consent-root</code>.
        </DocsCallout>
      </div>

      {/* Preference Centre */}
      <div className="space-y-4">
        <h2 id="preference-centre" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          The Granular Preference Centre
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Under GDPR and ePrivacy regulations, visitors must be given the right to accept or decline individual tracking categories. When a visitor clicks <strong>"Customize"</strong> or <strong>"Manage Preferences"</strong>, UpFront opens a modal displaying your active categories:
        </p>

        <div className="space-y-3 my-4">
          <div className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between text-xs">
            <div>
              <span className="font-medium text-ink text-sm">Strictly Necessary Cookies</span>
              <p className="text-muted-foreground mt-0.5">Required for core site security, user login, and cart persistence.</p>
            </div>
            <span className="rounded bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">Always Active</span>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between text-xs">
            <div>
              <span className="font-medium text-ink text-sm">Privacy Analytics</span>
              <p className="text-muted-foreground mt-0.5">Cookieless, anonymized traffic measurement to improve user experience.</p>
            </div>
            <span className="rounded bg-brand-mist text-primary border border-primary/20 px-2 py-1 font-mono text-[10px]">Toggleable</span>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between text-xs">
            <div>
              <span className="font-medium text-ink text-sm">Marketing & Advertising</span>
              <p className="text-muted-foreground mt-0.5">Third-party pixels for campaign attribution and retargeting ads.</p>
            </div>
            <span className="rounded bg-brand-mist text-primary border border-primary/20 px-2 py-1 font-mono text-[10px]">Toggleable</span>
          </div>
        </div>
      </div>

      {/* Programmatic API Trigger */}
      <div className="space-y-4">
        <h2 id="re-opening-banner" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Re-Opening the Banner Programmatically
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Privacy regulations mandate that visitors must be able to change or withdraw their consent at any time. You can trigger the preference modal from your website footer with a simple HTML link or JavaScript call:
        </p>

        <DocsCodeBlock
          filename="Footer Re-open Link"
          language="html"
          code={`<!-- HTML link using data attribute -->
<a href="#" data-upfront-open-preferences>
  Cookie Preferences
</a>

<!-- Or trigger via JavaScript API -->
<button onclick="window.upfront && window.upfront.openPreferences()">
  Change Privacy Settings
</button>`}
        />
      </div>
    </article>
  )
}
