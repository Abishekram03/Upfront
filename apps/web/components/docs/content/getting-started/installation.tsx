"use client"

import React from "react"
import { Code2, Terminal, Layers, Check, Copy } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function InstallationDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Getting Started</span>
          <span>•</span>
          <span>Integration</span>
        </div>
        <h1 id="script-installation" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Script Installation Across Frameworks
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          UpFront is distributed globally via our high-speed edge CDN network under 4KB compressed. It runs smoothly on any static HTML page, modern JavaScript framework, or CMS platform.
        </p>
      </div>

      {/* Script Attributes Explained */}
      <div className="space-y-4">
        <h2 id="script-attributes" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Snippet Attributes & Options
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You can configure client behavior directly via <code>data-*</code> HTML attributes on the script tag:
        </p>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-muted/40 font-medium text-ink">
              <tr>
                <th className="p-3">Attribute</th>
                <th className="p-3">Type</th>
                <th className="p-3">Default</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-muted-foreground font-mono">
              <tr>
                <td className="p-3 font-medium text-primary">data-site</td>
                <td className="p-3 text-muted-foreground">string (required)</td>
                <td className="p-3">—</td>
                <td className="p-3 font-sans">Your unique Site ID generated in the UpFront workspace.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-primary">data-auto-block</td>
                <td className="p-3 text-muted-foreground">boolean</td>
                <td className="p-3">"true"</td>
                <td className="p-3 font-sans">Enables client-side interception of unconsented third-party scripts.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-primary">data-consent-mode</td>
                <td className="p-3 text-muted-foreground">"v2" | "off"</td>
                <td className="p-3">"v2"</td>
                <td className="p-3 font-sans">Sends Google Consent Mode v2 status updates automatically to <code>dataLayer</code>.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-primary">data-debug</td>
                <td className="p-3 text-muted-foreground">boolean</td>
                <td className="p-3">"false"</td>
                <td className="p-3 font-sans">Prints verbose CMP lifecycle and telemetry dispatch logs to developer console.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-primary">data-domains</td>
                <td className="p-3 text-muted-foreground">string (csv)</td>
                <td className="p-3">—</td>
                <td className="p-3 font-sans">Comma-separated domain whitelist (e.g. <code>"acme.com,app.acme.com"</code>) to prevent localhost tracking.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Framework Implementations */}
      <div className="space-y-6">
        <h2 id="framework-guides" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Framework Guides
        </h2>

        {/* Tabbed Code Snippets */}
        <DocsCodeBlock
          tabs={[
            {
              label: "HTML / Static",
              language: "html",
              code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Website</title>

  <!-- Upfront Analytics & CMP (Place at top of <head>) -->
  <script
    defer
    src="https://cdn.upfront.app/upfront.js"
    data-site="YOUR-SITE-ID"
    data-auto-block="true"
  ></script>

  <!-- Other tags like stylesheets and fonts follow -->
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <h1>Welcome to my website</h1>
</body>
</html>`,
            },
            {
              label: "Next.js (App Router)",
              language: "tsx",
              code: `// app/layout.tsx
import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'My Next.js Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Load Upfront before interactive scripts */}
        <Script
          strategy="beforeInteractive"
          src="https://cdn.upfront.app/upfront.js"
          data-site="YOUR-SITE-ID"
          data-auto-block="true"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}`,
            },
            {
              label: "Next.js (Pages)",
              language: "tsx",
              code: `// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Upfront Analytics & CMP */}
        <script
          defer
          src="https://cdn.upfront.app/upfront.js"
          data-site="YOUR-SITE-ID"
          data-auto-block="true"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}`,
            },
            {
              label: "React / Vite SPA",
              language: "html",
              code: `<!-- index.html in your Vite root -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React App</title>

    <!-- Upfront Script (in <head>) -->
    <script
      defer
      src="https://cdn.upfront.app/upfront.js"
      data-site="YOUR-SITE-ID"
      data-auto-block="true"
    ></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
            },
            {
              label: "WordPress",
              language: "php",
              code: `<?php
// Add this snippet to your child theme's functions.php
// or via the 'WPCode' / 'Insert Headers and Footers' plugin:

function add_upfront_script_to_head() {
    ?>
    <script
      defer
      src="https://cdn.upfront.app/upfront.js"
      data-site="YOUR-SITE-ID"
      data-auto-block="true"
    ></script>
    <?php
}
add_action('wp_head', 'add_upfront_script_to_head', 1);
?>`,
            },
            {
              label: "Webflow",
              language: "html",
              code: `<!-- In Webflow Project Settings -> Custom Code -> Head Code -->
<script
  defer
  src="https://cdn.upfront.app/upfront.js"
  data-site="YOUR-SITE-ID"
  data-auto-block="true"
></script>`,
            },
            {
              label: "Shopify",
              language: "liquid",
              code: `<!-- In Shopify Admin -> Online Store -> Themes -> Edit Code -> theme.liquid -->
<!-- Place right inside <head> before {{ content_for_header }} -->
<script
  defer
  src="https://cdn.upfront.app/upfront.js"
  data-site="YOUR-SITE-ID"
  data-auto-block="true"
></script>`,
            },
          ]}
        />
      </div>

      {/* Script Auto-Blocking in Detail */}
      <div className="space-y-4">
        <h2 id="auto-blocking-how-to" className="text-2xl font-bold tracking-tight text-ink border-b border-line pb-2">
          Tagging Scripts for Auto-Blocking
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          When <code>data-auto-block="true"</code> is enabled, Upfront automatically categorizes known scripts. However, for maximum deterministic control over custom scripts, you can assign <code>data-consent-category</code> and set <code>type="text/plain"</code>:
        </p>

        <DocsCodeBlock
          filename="Custom Tag Example"
          language="html"
          code={`<!-- Meta / Facebook Pixel (Marketing category) -->
<script
  type="text/plain"
  data-consent-category="marketing"
  src="https://connect.facebook.net/en_US/fbevents.js"
></script>

<!-- Custom Analytics Tag -->
<script
  type="text/plain"
  data-consent-category="analytics"
>
  console.log("Analytics initialized only after visitor consents!");
</script>`}
        />

        <DocsCallout type="tip" title="Automatic Release">
          When the visitor accepts the "marketing" category, Upfront automatically re-evaluates the script with <code>type="text/javascript"</code> and injects it seamlessly into the DOM!
        </DocsCallout>
      </div>
    </article>
  )
}
