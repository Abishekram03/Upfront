"use client"

import React from "react"
import { Code, Globe, RefreshCw, ExternalLink, ShieldCheck, CheckCircle2 } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function EmbedPoliciesDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Legal Policy Generators</span>
          <span>•</span>
          <span>Dynamic Embed & Live Sync</span>
        </div>
        <h1 id="embed-policies" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Dynamic Embed & Live Sync
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Deploy your generated legal policies across your websites using hosted public URLs, responsive embed snippets, or headless JSON API endpoints.
        </p>
      </div>

      {/* 3 Integration Methods */}
      <div className="space-y-4">
        <h2 id="integration-methods" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          3 Flexible Delivery Options
        </h2>

        {/* Method 1: Hosted URL */}
        <div className="space-y-2">
          <h3 className="text-base font-medium text-ink">Option 1: Hosted Standalone URL</h3>
          <p className="text-xs text-muted-foreground">
            Fastest approach. UpFront hosts your responsive, SEO-optimized policy page on our global edge CDN:
          </p>
          <DocsCodeBlock
            language="html"
            filename="footer-links.html"
            code={`<!-- Place in your website footer -->
<a href="https://upfront.io/p/acme-corp/privacy-policy" target="_blank" rel="noopener noreferrer">
  Privacy Policy
</a>
<a href="https://upfront.io/p/acme-corp/terms-of-service" target="_blank" rel="noopener noreferrer">
  Terms of Service
</a>`}
          />
        </div>

        {/* Method 2: Embed Snippet */}
        <div className="space-y-2 pt-4">
          <h3 className="text-base font-medium text-ink">Option 2: Responsive Embed Container</h3>
          <p className="text-xs text-muted-foreground">
            Embed the live policy directly inside your own domain layout (e.g. <code>/privacy</code>):
          </p>
          <DocsCodeBlock
            language="html"
            filename="privacy.html"
            code={`<div id="upfront-policy-container" data-policy-id="pol_982bca81"></div>
<script async src="https://cdn.upfront.io/embed.js"></script>`}
          />
        </div>

        {/* Method 3: Headless API */}
        <div className="space-y-2 pt-4">
          <h3 className="text-base font-medium text-ink">Option 3: Headless REST API (Next.js / Nuxt / Mobile)</h3>
          <p className="text-xs text-muted-foreground">
            Fetch raw structured HTML or JSON to render using your own design system:
          </p>
          <DocsCodeBlock
            language="typescript"
            filename="app/privacy/page.tsx"
            code={`// Next.js App Router Server Component
export default async function PrivacyPage() {
  const res = await fetch("https://api.upfront.io/v1/policies/pol_982bca81", {
    next: { revalidate: 3600 } // ISR cache for 1 hour
  });
  const policy = await res.json();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold">{policy.title}</h1>
      <p className="text-sm text-gray-500">Last updated: {policy.updated_at}</p>
      <div 
        className="prose mt-8" 
        dangerouslySetInnerHTML={{ __html: policy.content_html }} 
      />
    </div>
  );
}`}
          />
        </div>
      </div>

      {/* Live Sync */}
      <div className="space-y-4">
        <h2 id="live-synchronization" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Automatic Cookie Table Updates
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Regardless of the delivery method chosen, any changes made in your UpFront Dashboard or discovered by automated cookie scans propagate within minutes without code redeployments.
        </p>
      </div>
    </article>
  )
}
