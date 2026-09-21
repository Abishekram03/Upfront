"use client"

import { useState } from "react"
import { Copy, Check, Eye, FileText, Code2, ShieldCheck, Layers, ExternalLink } from "lucide-react"
import { useDomain } from "@/lib/domain-context"
import { cn } from "@workspace/ui/lib/utils"

function HighlightedPolicySnippet({ code, type }: { code: string; type: "dynamic" | "html" | "markdown" }) {
  if (type === "markdown") {
    const lines = code.split("\n")
    return (
      <pre className="font-mono text-xs overflow-x-auto select-all max-h-56 leading-relaxed">
        <code>
          {lines.map((l, i) => {
            if (l.startsWith("#")) {
              return <div key={i} className="text-blue-700 font-semibold">{l}</div>
            }
            if (l.startsWith("-") || l.startsWith("*")) {
              return <div key={i} className="text-purple-700">{l}</div>
            }
            return <div key={i} className="text-slate-700">{l || " "}</div>
          })}
        </code>
      </pre>
    )
  }

  // HTML / Dynamic Snippet
  const lines = code.split("\n")
  return (
    <pre className="font-mono text-xs overflow-x-auto select-all max-h-56 leading-relaxed">
      <code>
        {lines.map((line, idx) => {
          const tokens = line.split(/(<\/?[a-zA-Z0-9-]+|"[^"]*"|'[^']*'|\b(?:id|class|style|href|src|type|data-category)\b|[<>=!/])/g).filter(Boolean)
          return (
            <div key={idx} className="min-h-[1.25rem]">
              {tokens.map((tok, ti) => {
                if (/^<\/?(script|div|h2|h3|p|table|thead|tbody|tr|th|td|a|span)/.test(tok) || tok === ">" || tok === "/>" || tok === "<") {
                  return <span key={ti} className="text-blue-700 font-semibold">{tok}</span>
                }
                if (/^(id|class|style|href|src|type|data-category)$/.test(tok)) {
                  return <span key={ti} className="text-purple-700 font-medium">{tok}</span>
                }
                if (/^("[^"]*"|'[^']*')$/.test(tok)) {
                  return <span key={ti} className="text-emerald-700">{tok}</span>
                }
                return <span key={ti} className="text-slate-800">{tok}</span>
              })}
            </div>
          )
        })}
      </code>
    </pre>
  )
}

export function CookiePolicyGenerator() {
  const { activeDomain } = useDomain()

  const domain = activeDomain || "yourdomain.com"
  const [companyName, setCompanyName] = useState("Our Company")
  const [contactEmail, setContactEmail] = useState(`privacy@${domain}`)
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split("T")[0] || "")
  const [activeEmbedTab, setActiveEmbedTab] = useState<"dynamic" | "html" | "markdown">("dynamic")
  const [copiedType, setCopiedType] = useState<string | null>(null)

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  // 1. Dynamic Auto-Updating Widget
  const dynamicSnippet = `<div id="usrly-cookie-declaration" data-domain="${domain}"></div>
<script defer src="https://usrly-five.vercel.app/userly.js"></script>`

  // 2. Full Static HTML
  const fullHtmlPolicy = `<div class="cookie-policy-container" style="font-family: sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #334155;">
  <h2 style="color: #0f172a; margin-bottom: 4px;">Cookie Policy for ${domain}</h2>
  <p style="font-size: 13px; color: #64748b; margin-top: 0;">Last updated: ${effectiveDate}</p>

  <h3 style="color: #0f172a; margin-top: 24px;">1. What Are Cookies?</h3>
  <p>Cookies are small text files stored on your device that allow us to ensure site functionality, enhance user navigation, and remember your preferences.</p>

  <h3 style="color: #0f172a; margin-top: 24px;">2. How We Use Cookies</h3>
  <p>${companyName} uses cookies to monitor site performance, provide analytics, and manage consent preferences according to GDPR and CCPA standards.</p>

  <h3 style="color: #0f172a; margin-top: 24px;">3. Cookie Categories</h3>
  <ul>
    <li><strong>Necessary:</strong> Essential for core site functionality and security.</li>
    <li><strong>Functional:</strong> Enables preference saving and interactive widgets.</li>
    <li><strong>Analytics:</strong> Measures traffic and aggregate usage metrics.</li>
    <li><strong>Advertisement:</strong> Manages campaign delivery and conversion tracking.</li>
  </ul>

  <h3 style="color: #0f172a; margin-top: 24px;">4. Managing Consent</h3>
  <p>You can revoke or modify your cookie choices at any time by clicking the floating cookie badge on our website.</p>

  <h3 style="color: #0f172a; margin-top: 24px;">5. Contact Us</h3>
  <p>For inquiries, contact us at: <a href="mailto:${contactEmail}" style="color: #1868db;">${contactEmail}</a></p>
</div>`

  // 3. Markdown version
  const markdownPolicy = `# Cookie Policy for ${domain}
*Last updated: ${effectiveDate}*

## 1. What Are Cookies?
Cookies are small text files stored on your device that ensure site functionality and remember user preferences.

## 2. How We Use Cookies
**${companyName}** uses cookies to monitor website performance, provide aggregated analytics, and honor your privacy choices.

## 3. Cookie Categories
- **Necessary:** Essential for basic site security and functionality (Always Active).
- **Functional:** Enables enhanced features and user preferences.
- **Analytics:** Measures site interactions to improve user experience.
- **Advertisement:** Delivers targeted ads and measures conversion rates.

## 4. How Can I Control My Preferences?
You can adjust or revoke your cookie preferences at any time by clicking the floating cookie button on our website.

## 5. Contact Us
For any inquiries regarding this policy, contact: [${contactEmail}](mailto:${contactEmail})`

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Cookie Policy Generator</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Auto-generate and embed a comprehensive, live-updating cookie policy for <strong className="text-neutral-800">{domain}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(fullHtmlPolicy, "html")}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md px-3.5 py-2 shadow-2xs transition-colors inline-flex items-center gap-1.5"
          >
            {copiedType === "html" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-slate-500" />}
            Copy HTML
          </button>

          <button
            type="button"
            onClick={() => handleCopy(dynamicSnippet, "dynamic")}
            className="text-xs bg-[#1868db] hover:bg-[#1559be] text-white font-semibold rounded-md px-4 py-2 shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            {copiedType === "dynamic" ? <Check className="size-3.5 text-white" /> : <Code2 className="size-3.5" />}
            Copy Embed Code
          </button>
        </div>
      </div>

      {/* Configuration & Embed Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Metadata Inputs */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Policy Details</h3>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Company / Website Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Privacy Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1868db]"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-4 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <ShieldCheck className="size-4 text-emerald-600" /> Transparent Compliance
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              GDPR & CCPA guidelines require clear disclosure of all cookie categories. Embedding this policy ensures continuous compliance for your visitors.
            </p>
          </div>
        </div>

        {/* Right: Embed Code Tabs */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveEmbedTab("dynamic")}
                  className={cn(
                    "px-3 py-1 rounded font-semibold transition-all text-xs",
                    activeEmbedTab === "dynamic" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  1. Dynamic Widget
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEmbedTab("html")}
                  className={cn(
                    "px-3 py-1 rounded font-semibold transition-all text-xs",
                    activeEmbedTab === "html" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  2. Full HTML
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEmbedTab("markdown")}
                  className={cn(
                    "px-3 py-1 rounded font-semibold transition-all text-xs",
                    activeEmbedTab === "markdown" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  3. Markdown
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    activeEmbedTab === "dynamic"
                      ? dynamicSnippet
                      : activeEmbedTab === "html"
                      ? fullHtmlPolicy
                      : markdownPolicy,
                    activeEmbedTab
                  )
                }
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-md shadow-2xs transition-colors inline-flex items-center gap-1.5"
              >
                {copiedType === activeEmbedTab ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-slate-500" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            {/* Light-themed syntax-highlighted code block */}
            <div className="relative rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
              <HighlightedPolicySnippet
                code={
                  activeEmbedTab === "dynamic"
                    ? dynamicSnippet
                    : activeEmbedTab === "html"
                    ? fullHtmlPolicy
                    : markdownPolicy
                }
                type={activeEmbedTab}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              {activeEmbedTab === "dynamic"
                ? "Paste this container tag into your /cookie-policy page. usrly.js will automatically inject the dynamic declaration table and live consent status."
                : activeEmbedTab === "html"
                ? "Static HTML version ready to paste into WordPress, Webflow, Shopify, or custom pages."
                : "Markdown version formatted for Notion, GitHub, or static docs."}
            </p>
          </div>
        </div>
      </div>

      {/* Live Visual Preview */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-[#1868db]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Live Policy Preview</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Rendered for {domain}</span>
        </div>

        <div className="p-6 sm:p-8 space-y-6 bg-white text-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Cookie Policy for {domain}</h2>
            <p className="text-xs text-slate-400 mt-1">Last updated: {effectiveDate}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">1. What Are Cookies?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cookies are small text files stored on your computer or mobile device when you visit a website. They are widely used to ensure websites function properly, remember user preferences, and provide analytical insights to site operators.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">2. How We Use Cookies</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{companyName}</strong> uses cookies to understand user navigation, improve website performance, securely manage sessions, and honor visitor privacy settings.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">3. Cookie Categories & Declaration Table</h3>
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3.5">Category</th>
                    <th className="py-2.5 px-3.5">Purpose & Description</th>
                    <th className="py-2.5 px-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">Necessary</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Essential for core features, secure login authentication, and storing consent preferences.</td>
                    <td className="py-2.5 px-3.5 font-bold text-emerald-600">Always Active</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">Functional</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Enables social sharing widgets, customer feedback collection, and live chat assistance.</td>
                    <td className="py-2.5 px-3.5 font-semibold text-[#1868db]">Optional (User Gated)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">Analytics</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Measures traffic volume, popular pages, and bounce rates to optimize user experience.</td>
                    <td className="py-2.5 px-3.5 font-semibold text-[#1868db]">Optional (User Gated)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">Performance</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Monitors loading times and page speed indexes to ensure high performance.</td>
                    <td className="py-2.5 px-3.5 font-semibold text-[#1868db]">Optional (User Gated)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">Advertisement</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Serves personalized advertising and tracks campaign conversion effectiveness.</td>
                    <td className="py-2.5 px-3.5 font-semibold text-[#1868db]">Optional (User Gated)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">4. Managing & Withdrawing Your Consent</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have the right to withdraw or modify your cookie consent at any time by clicking the floating cookie icon in the bottom corner of our website.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">5. Contact Information</h3>
            <p className="text-xs text-slate-600">
              For any questions regarding our cookie policy, please contact us at:{" "}
              <a href={`mailto:${contactEmail}`} className="text-[#1868db] font-semibold underline">
                {contactEmail}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
