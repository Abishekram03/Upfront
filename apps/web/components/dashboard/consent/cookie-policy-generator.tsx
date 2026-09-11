"use client"

import { useState } from "react"
import {
  FileText,
  Code2,
  Copy,
  Check,
  Download,
  Sparkles,
  Shield,
  Eye,
  ExternalLink,
  Layers,
  CheckCircle2,
  Globe,
  Sliders,
  Cookie,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDomain } from "@/lib/domain-context"
import { cn } from "@workspace/ui/lib/utils"
import { API_BASE } from "@/lib/api"

export function CookiePolicyGenerator() {
  const { activeDomain } = useDomain()

  const domain = activeDomain || "yourwebsite.com"
  const [companyName, setCompanyName] = useState(domain)
  const [contactEmail, setContactEmail] = useState(`privacy@${domain}`)
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0] ?? "2026-01-01")

  const [activeEmbedTab, setActiveEmbedTab] = useState<"dynamic" | "html" | "markdown">("dynamic")
  const [copiedType, setCopiedType] = useState<string | null>(null)

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  // Dynamic Embed Snippet
  const dynamicSnippet = `<!-- usrly Dynamic Cookie Policy & Declaration -->
<div id="usrly-cookie-declaration"></div>
<script defer data-domain="${domain}" src="${API_BASE}/userly.js"></script>`

  // Static Full HTML Policy
  const fullHtmlPolicy = `<!-- Cookie Policy for ${domain} -->
<div class="cookie-policy-container" style="max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6;">
  <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Cookie Policy for ${domain}</h1>
  <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">Last updated: ${effectiveDate}</p>

  <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 24px;">1. What Are Cookies?</h2>
  <p style="font-size: 14px; color: #334155;">Cookies are small text files that are placed on your device by websites that you visit. They are widely used to make websites work efficiently, provide personalized content, and analyze web traffic in compliance with GDPR and ePrivacy regulations.</p>

  <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 24px;">2. How We Use Cookies</h2>
  <p style="font-size: 14px; color: #334155;"><strong>${companyName}</strong> uses cookies to understand how you interact with our website, secure your login state, and deliver tailored functionality.</p>

  <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 24px;">3. Cookie Categories</h2>
  <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; border: 1px solid #e2e8f0;">
    <thead>
      <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
        <th style="padding: 10px 12px;">Category</th>
        <th style="padding: 10px 12px;">Purpose</th>
        <th style="padding: 10px 12px;">Default State</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 12px; font-weight: bold; color: #0f172a;">Necessary</td>
        <td style="padding: 10px 12px; color: #475569;">Essential for website security, authentication, and remembering your consent preferences.</td>
        <td style="padding: 10px 12px; color: #16a34a; font-weight: bold;">Always Active</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 12px; font-weight: bold; color: #0f172a;">Functional</td>
        <td style="padding: 10px 12px; color: #475569;">Enables sharing content on social media platforms and collecting user feedback.</td>
        <td style="padding: 10px 12px; color: #1868db;">Optional</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 12px; font-weight: bold; color: #0f172a;">Analytics</td>
        <td style="padding: 10px 12px; color: #475569;">Helps us understand visitor metrics, bounce rates, and traffic sources without collecting personal data.</td>
        <td style="padding: 10px 12px; color: #1868db;">Optional</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 12px; font-weight: bold; color: #0f172a;">Performance</td>
        <td style="padding: 10px 12px; color: #475569;">Monitors page load speeds and technical indexes to ensure smooth browsing.</td>
        <td style="padding: 10px 12px; color: #1868db;">Optional</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; color: #0f172a;">Advertisement</td>
        <td style="padding: 10px 12px; color: #475569;">Delivers relevant ads and measures the effectiveness of marketing campaigns.</td>
        <td style="padding: 10px 12px; color: #1868db;">Optional</td>
      </tr>
    </tbody>
  </table>

  <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 24px;">4. How Can I Control My Preferences?</h2>
  <p style="font-size: 14px; color: #334155;">You can change or withdraw your consent at any time by clicking the floating cookie icon located at the bottom of our website.</p>

  <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 24px;">5. Contact Us</h2>
  <p style="font-size: 14px; color: #334155;">If you have any questions about our use of cookies, please email us at: <a href="mailto:${contactEmail}" style="color: #1868db; font-weight: 600;">${contactEmail}</a></p>
</div>`

  // Markdown Format Policy
  const markdownPolicy = `# Cookie Policy for ${domain}
*Last updated: ${effectiveDate}*

## 1. What Are Cookies?
Cookies are small text files placed on your device to make websites function properly, provide customized user experiences, and analyze traffic in compliance with GDPR and ePrivacy guidelines.

## 2. How We Use Cookies
**${companyName}** uses cookies to secure login sessions, analyze traffic trends, and honor visitor privacy preferences.

## 3. Cookie Categories

| Category | Purpose | Default State |
| :--- | :--- | :--- |
| **Necessary** | Essential for website security, authentication, and storing consent. | **Always Active** |
| **Functional** | Enables social sharing, user feedback, and widgets. | Optional |
| **Analytics** | Analyzes page traffic, bounce rates, and visitor trends. | Optional |
| **Performance** | Measures load times, latency, and performance indexes. | Optional |
| **Advertisement** | Tailors advertisements and measures campaign efficacy. | Optional |

## 4. How Can I Control My Preferences?
You can adjust or revoke your cookie preferences at any time by clicking the floating cookie button on our website.

## 5. Contact Us
For any inquiries regarding this policy, contact: [${contactEmail}](mailto:${contactEmail})`

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Cookie Policy Generator</h1>
            <span className="rounded-[4px] bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-700 border border-neutral-200">
              GDPR & CCPA Compliant
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Auto-generate and embed a comprehensive, live-updating cookie policy for <strong className="text-neutral-800">{domain}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(fullHtmlPolicy, "html")}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-[4px] px-3.5 py-2 shadow-2xs transition-colors inline-flex items-center gap-1.5"
          >
            {copiedType === "html" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-[#1868db]" />}
            Copy HTML
          </button>

          <button
            type="button"
            onClick={() => handleCopy(dynamicSnippet, "dynamic")}
            className="text-xs bg-[#1868db] hover:bg-[#1559be] text-white font-bold rounded-[4px] px-4 py-2 shadow-xs transition-colors inline-flex items-center gap-1.5"
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
          <div className="rounded-[4px] border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Policy Details</h3>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Company / Website Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-[4px] border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Privacy Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-[4px] border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full rounded-[4px] border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1868db]"
              />
            </div>
          </div>

          <div className="rounded-[4px] border border-blue-200 bg-blue-50/60 p-4 text-xs text-[#1868db] space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="size-4" /> Why Embed the Policy?
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              GDPR Article 13 & 14 requires websites to provide a comprehensive explanation of all cookie categories. Embedding this page fulfills European and US state requirements.
            </p>
          </div>
        </div>

        {/* Right: Embed Code Tabs */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-[4px] border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveEmbedTab("dynamic")}
                  className={cn(
                    "px-3 py-1 rounded-[4px] font-bold transition-all",
                    activeEmbedTab === "dynamic" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  1. Dynamic Widget (Auto-updating)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEmbedTab("html")}
                  className={cn(
                    "px-3 py-1 rounded-[4px] font-bold transition-all",
                    activeEmbedTab === "html" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  2. Full HTML Code
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEmbedTab("markdown")}
                  className={cn(
                    "px-3 py-1 rounded-[4px] font-bold transition-all",
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
                className="text-xs font-bold text-[#1868db] hover:text-[#1559be] inline-flex items-center gap-1"
              >
                {copiedType === activeEmbedTab ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" /> Copy Snippet
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-[4px] border border-slate-800 bg-slate-950 p-3.5 text-slate-100 shadow-inner">
              <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap select-all max-h-56">
                {activeEmbedTab === "dynamic"
                  ? dynamicSnippet
                  : activeEmbedTab === "html"
                  ? fullHtmlPolicy
                  : markdownPolicy}
              </pre>
            </div>

            <p className="text-[11px] text-slate-500">
              {activeEmbedTab === "dynamic"
                ? "Paste this container tag into your /cookie-policy or /privacy page. usrly.js will automatically inject the dynamic declaration table and live consent status."
                : activeEmbedTab === "html"
                ? "Static HTML version ready to paste into WordPress, Webflow, Shopify, or raw HTML pages."
                : "Markdown version formatted for Notion, GitHub, or static site generators."}
            </p>
          </div>
        </div>
      </div>

      {/* Live Visual Preview */}
      <div className="rounded-[4px] border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-[#1868db]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Live Policy Preview</h3>
          </div>
          <span className="text-[11px] text-slate-400">Rendered for {domain}</span>
        </div>

        <div className="p-6 sm:p-8 space-y-6 bg-white text-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Cookie Policy for {domain}</h2>
            <p className="text-xs text-slate-400 mt-1">Last updated: {effectiveDate}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">1. What Are Cookies?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to ensure websites function properly, remember user preferences, and provide analytical insights to site operators.
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
            <div className="overflow-x-auto rounded-[4px] border border-slate-200">
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
              Under GDPR Article 7(3), you have the right to withdraw or modify your consent at any time. You can do so easily by clicking the floating cookie icon 🍪 in the bottom corner of our website.
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
