"use client"

import React from "react"
import { Ban, Code2, Play, CheckCircle2, AlertTriangle, Layers } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function ScriptRulesDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Consent Management (CMP)</span>
          <span>•</span>
          <span>Script Blocking</span>
        </div>
        <h1 id="script-rules" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Script Auto-Blocking Rules
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Under GDPR, marketing tracking tags, pixels, and third-party analytics scripts cannot execute before explicit user consent. UpFront provides both automatic signature matching and manual tag overrides.
        </p>
      </div>

      {/* How Auto-Blocking Works */}
      <div className="space-y-4">
        <h2 id="how-it-works" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          How Client-Side Auto-Blocking Operates
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When <code>data-auto-block="true"</code> is placed in your <code>&lt;head&gt;</code>, UpFront activates a low-overhead DOM interception engine. It intercepts dynamic <code>document.createElement('script')</code> calls and inline HTML script tags before the browser executes them.
        </p>

        <div className="rounded-xl border border-line bg-surface p-5 shadow-xs space-y-3">
          <h4 className="text-base font-medium text-ink">Built-in Auto-Detected Script Signatures</h4>
          <p className="text-xs text-muted-foreground">UpFront automatically recognizes and pauses the following vendors by default until categorized consent is received:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-ink">
            <span className="p-2 rounded border border-line bg-muted/30">Meta / FB Pixel</span>
            <span className="p-2 rounded border border-line bg-muted/30">Google Tag Manager</span>
            <span className="p-2 rounded border border-line bg-muted/30">TikTok Pixel</span>
            <span className="p-2 rounded border border-line bg-muted/30">LinkedIn Insight</span>
            <span className="p-2 rounded border border-line bg-muted/30">Hotjar / Clarity</span>
            <span className="p-2 rounded border border-line bg-muted/30">Twitter / X Ads</span>
            <span className="p-2 rounded border border-line bg-muted/30">Pinterest Tag</span>
            <span className="p-2 rounded border border-line bg-muted/30">Snapchat Pixel</span>
          </div>
        </div>
      </div>

      {/* Manual Tag Override */}
      <div className="space-y-4">
        <h2 id="manual-tagging" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Manual Script Tagging (Best Practice for Custom Code)
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          For custom tracking scripts or newly installed widgets, prevent premature execution by setting <code>type="text/plain"</code> and specifying <code>data-consent-category</code>:
        </p>

        <DocsCodeBlock
          filename="Manual Script Tagging"
          language="html"
          code={`<!-- 1. Tag mapped to 'marketing' category -->
<script
  type="text/plain"
  data-consent-category="marketing"
  src="https://example.com/marketing-pixel.js"
></script>

<!-- 2. Tag mapped to 'analytics' category -->
<script
  type="text/plain"
  data-consent-category="analytics"
  src="https://example.com/custom-tracker.js"
></script>

<!-- 3. Inline script mapped to 'functional' category -->
<script
  type="text/plain"
  data-consent-category="functional"
>
  window.initLiveChatWidget({ apiKey: 'xyz' });
</script>`}
        />
      </div>

      {/* JavaScript Event Listener */}
      <div className="space-y-4">
        <h2 id="javascript-events" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Programmatic Event Listeners
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If your application dynamically mounts components (e.g. React single page apps), listen to the <code>upfront:consent_changed</code> window event:
        </p>

        <DocsCodeBlock
          filename="React / JavaScript Listener"
          language="javascript"
          code={`window.addEventListener('upfront:consent_changed', (event) => {
  const { categories, status } = event.detail;

  console.log("Consent updated:", categories);
  // Example output: { necessary: true, analytics: true, marketing: false }

  if (categories.marketing) {
    // Dynamically initialize your marketing SDK
    initializeMarketingSDK();
  }
});`}
        />
      </div>
    </article>
  )
}
