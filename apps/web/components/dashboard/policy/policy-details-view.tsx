"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Code2,
  Edit3,
  Globe,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Info,
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"
import { PolicyDefinition, DomainPolicyRecord } from "./policy-types"
import { useCMPCookiePolicy } from "./use-cmp-cookie-policy"

interface PolicyDetailsViewProps {
  policy: PolicyDefinition
  record?: DomainPolicyRecord | null
  domain: string
  onBack: () => void
  onEdit: () => void
  onPublish: (record: DomainPolicyRecord) => void
}

export function PolicyDetailsView({
  policy,
  record,
  domain,
  onBack,
  onEdit,
  onPublish,
}: PolicyDetailsViewProps) {
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false)
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [embedTab, setEmbedTab] = useState<"widget" | "html" | "url">("widget")
  const [isPublishing, setIsPublishing] = useState(false)

  const isCookiePolicy = policy.id === "cookies"
  const isPrivacyPolicy = policy.id === "privacy"
  const isTermsPolicy = policy.id === "terms"

  // Live CMP cookie policy data for cookies
  const cmpData = useCMPCookiePolicy(isCookiePolicy ? domain : "")

  const isPublished = record?.status === "published"
  const policyTitle = record?.customTitle || policy.name
  const lastUpdated =
    record?.publishedAt ||
    (isCookiePolicy && cmpData.lastScanDate ? cmpData.lastScanDate : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))

  // Snippets
  const widgetSnippet = isCookiePolicy
    ? `<div id="usrly-cookie-declaration" data-domain="${domain}"></div>\n<script defer src="https://usrly-five.vercel.app/script.js"></script>`
    : `<div id="usrly-${policy.id}-policy" data-domain="${domain}"></div>\n<script defer src="https://usrly-five.vercel.app/script.js"></script>`

  const publicHostedUrl = `https://usrly-five.vercel.app/legal/${policy.id}?domain=${encodeURIComponent(domain)}`

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedType(null), 2000)
  }

  const handlePublishClick = () => {
    setIsPublishing(true)
    setTimeout(() => {
      setIsPublishing(false)
      const updated: DomainPolicyRecord = {
        policyId: policy.id,
        status: "published",
        publishedAt: new Date().toISOString(),
        publishedAgo: "Just now",
        customTitle: policyTitle,
        contentMarkdown: record?.contentMarkdown || (isCookiePolicy ? cmpData.generatedMarkdown : undefined),
        contentHtml: record?.contentHtml || (isCookiePolicy ? cmpData.generatedHtml : undefined),
        version: record?.version || "1.0",
      }
      onPublish(updated)
      toast.success(`${policy.name} published successfully!`)
    }, 400)
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-150">
      {/* 1. TOP HEADER BAR (Back to policies | Add to website | Edit | Publish) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 bg-white/50 -mx-2 px-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="size-4 text-slate-400 group-hover:text-slate-900 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to policies</span>
        </button>

        <div className="flex items-center gap-2.5">
          {/* Add to website */}
          <button
            type="button"
            onClick={() => setIsEmbedModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Code2 className="size-3.5 text-slate-500" />
            <span>Add to website</span>
          </button>

          {/* Edit (Opens Staged Editor) */}
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Edit3 className="size-3.5 text-[#1868db]" />
            <span>Edit</span>
          </button>

          {/* Publish Button */}
          <Button
            type="button"
            onClick={handlePublishClick}
            disabled={isPublishing}
            className={cn(
              "rounded-md text-xs font-bold px-4 py-1.5 shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors",
              isPublished
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-[#1868db] hover:bg-[#1559be] text-white"
            )}
          >
            <CheckCircle2 className="size-3.5" />
            <span>{isPublishing ? "Publishing..." : isPublished ? "Published" : "Publish"}</span>
          </Button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT: PREVIEW (LEFT) | NOTICE & INFO (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: LIVE RENDERED POLICY PREVIEW */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6 text-slate-800">
          {/* Document Header */}
          <div className="border-b border-slate-100 pb-5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#1868db] border border-blue-100">
                {policy.shortTitle}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">{domain}</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {policyTitle}
            </h1>

            <p className="text-xs text-slate-400 italic">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* COOKIE POLICY PREVIEW */}
          {isCookiePolicy && (
            <div className="space-y-6 text-xs leading-relaxed text-slate-700">
              {/* Section 1 */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">{cmpData.aboutHeading}</h2>
                {cmpData.aboutDescription.split("\n\n").map((p, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">{p}</p>
                ))}
              </div>

              {/* Section 2 */}
              <div className="space-y-2 pt-2">
                <h2 className="text-sm font-bold text-slate-900">{cmpData.useHeading}</h2>
                {cmpData.useDescription.split("\n\n").map((p, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">{p}</p>
                ))}
              </div>

              {/* Section 3: Live Cookie Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">{cmpData.typesHeading}</h2>
                  <span className="text-[11px] font-semibold text-[#1868db] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {cmpData.cookies.length} Active Cookies Linked
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-[11px]">
                      <tr>
                        <th className="p-2.5 font-bold">Cookie</th>
                        <th className="p-2.5 font-bold">Category</th>
                        <th className="p-2.5 font-bold">Duration</th>
                        <th className="p-2.5 font-bold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
                      {cmpData.cookies.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-2.5 font-mono font-semibold text-slate-900">{c.name}</td>
                          <td className="p-2.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize",
                                c.category === "necessary"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : c.category === "analytics"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              )}
                            >
                              {c.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600">{c.duration || "Session"}</td>
                          <td className="p-2.5 text-slate-500">
                            {c.description || (c.service_name ? `Set by ${c.service_name}` : "Website functionality & security")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Manage Cookie Preferences */}
              <div className="space-y-3 pt-2">
                <h2 className="text-sm font-bold text-slate-900">{cmpData.prefHeading}</h2>

                <div>
                  <button
                    type="button"
                    onClick={() => toast.info("Opens CMP Cookie Preferences modal for website visitors.")}
                    className="px-3.5 py-1.5 rounded-md bg-[#1868db] hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Consent Preferences</span>
                  </button>
                </div>

                {cmpData.prefDescription.split("\n\n").map((p, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">{p}</p>
                ))}

                {/* Browser Links */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {cmpData.browserLinks.map((b) => (
                    <a
                      key={b.name}
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 text-[11px] font-medium flex items-center justify-between transition-colors"
                    >
                      <span>{b.name}</span>
                      <ExternalLink className="size-3 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY PREVIEW */}
          {isPrivacyPolicy && (
            <div className="space-y-6 text-xs leading-relaxed text-slate-700">
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">1. Introduction & Overview</h2>
                <p className="text-slate-600">
                  Welcome to {domain}. We are committed to safeguarding personal data in accordance with the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA/CPRA).
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">2. Personal Data We Collect</h2>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>Directly provided information: Account credentials, contact email, and payment records.</li>
                  <li>Automated telemetry: Device identifiers, browser characteristics, IP addresses, and session timestamps.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">3. How We Use Personal Data</h2>
                <p className="text-slate-600">
                  We process data to deliver secure services, prevent fraud, analyze performance, and fulfill user requests. We do not sell or monetize personal data.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">4. Your Privacy Rights</h2>
                <p className="text-slate-600">
                  Visitors have the right to access, rectify, port, or erase their personal information, or opt out of non-essential data processing at any time.
                </p>
              </div>
            </div>
          )}

          {/* TERMS OF SERVICE PREVIEW */}
          {isTermsPolicy && (
            <div className="space-y-6 text-xs leading-relaxed text-slate-700">
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">1. Agreement to Terms</h2>
                <p className="text-slate-600">
                  By accessing or using {domain}, you agree to comply with and be bound by these Terms of Service. If you disagree, do not use the service.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">2. User Accounts & Responsibilities</h2>
                <p className="text-slate-600">
                  Users are responsible for maintaining account confidentiality and all activities conducted under their credentials.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">3. Prohibited Activities</h2>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>Attempting to decompile, reverse engineer, or exploit the platform.</li>
                  <li>Using unauthorized automated scrapers, bots, or crawlers.</li>
                  <li>Transmitting malicious code or violating applicable regulations.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">4. Disclaimers & Limitation of Liability</h2>
                <p className="text-slate-600">
                  The service is provided on an 'AS IS' basis without express or implied warranties. Our liability is limited to the fullest extent permitted by law.
                </p>
              </div>
            </div>
          )}

          {/* OTHER POLICIES PREVIEW */}
          {!isCookiePolicy && !isPrivacyPolicy && !isTermsPolicy && (
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                {record?.contentMarkdown || policy.defaultSampleText || "This policy statement protects your platform, ensures consumer compliance, and defines clear legal guidelines."}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: NOTICE & INFORMATION PANEL */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Notice Kind of Thing / Information Box */}
          <div className="rounded-lg border border-blue-200/90 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-5 space-y-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <div className="size-7 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <Info className="size-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-blue-950">
                  Auto-Updating Compliance Notice
                </h3>
                <p className="text-[11px] text-blue-900/80 leading-relaxed">
                  This document is synchronized directly with your domain's live configuration. Whenever scanner detects new cookies or you edit details, your published policy updates in real time without republishing code.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-blue-800">
              <Sparkles className="size-3.5 text-blue-600" />
              <span>Live Synced with UpFront CMP</span>
            </div>
          </div>

          {/* 2. Policy Metadata & Status Card */}
          <div className="rounded-lg border border-slate-200/90 bg-white p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Policy Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-slate-400" />
                  Status
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold",
                    isPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", isPublished ? "bg-emerald-500" : "bg-amber-500")} />
                  {isPublished ? "Active & Published" : "Draft Mode"}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Globe className="size-3.5 text-slate-400" />
                  Linked Domain
                </span>
                <span className="font-mono font-medium text-slate-800">{domain}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-slate-400" />
                  Last Updated
                </span>
                <span className="text-slate-700 font-medium">{lastUpdated}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Layers className="size-3.5 text-slate-400" />
                  Version
                </span>
                <span className="font-mono text-slate-700 font-medium">v1.0</span>
              </div>
            </div>
          </div>

          {/* 3. Quick Embed Code Card */}
          <div className="rounded-lg border border-slate-200/90 bg-white p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Embed Container
              </h3>
              <button
                type="button"
                onClick={() => handleCopy(widgetSnippet, "quick_embed")}
                className="text-[11px] font-bold text-[#1868db] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                {copiedType === "quick_embed" ? (
                  <>
                    <Check className="size-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Paste this tag into your website page HTML to embed this policy declaration:
            </p>

            <div className="bg-slate-900 rounded-md p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
              <code>{widgetSnippet}</code>
            </div>
          </div>

          {/* 4. Compliance Scope Checklist */}
          <div className="rounded-lg border border-slate-200/90 bg-white p-5 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Regulatory Coverage
            </h3>

            <div className="space-y-2 text-xs">
              {[
                { name: "EU GDPR & UK GDPR", desc: "Data Controller & Consent Standards" },
                { name: "California CCPA / CPRA", desc: "Notice at Collection & Opt-Out" },
                { name: "ePrivacy Directive", desc: "Cookie Consent & Tracker Disclosure" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-slate-50 border border-slate-100">
                  <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ADD TO WEBSITE MODAL */}
      {isEmbedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-[#1868db]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Add {policy.name} to your Website
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEmbedModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-4 pt-3 border-b border-slate-200 flex items-center gap-3 text-xs font-bold">
              {[
                { id: "widget", label: "Auto-Updating Container (Recommended)" },
                { id: "url", label: "Direct URL Link" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEmbedTab(tab.id as any)}
                  className={cn(
                    "pb-2.5 border-b-2 transition-colors cursor-pointer",
                    embedTab === tab.id
                      ? "border-[#1868db] text-[#1868db]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              {embedTab === "widget" && (
                <div className="space-y-3">
                  <p className="leading-relaxed text-slate-600">
                    Paste this HTML code into your website's <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/{policy.id === "cookies" ? "cookie-policy" : policy.id === "privacy" ? "privacy-policy" : "terms"}</code> page where you want the policy declaration to appear:
                  </p>

                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
                    <code>{widgetSnippet}</code>
                  </div>
                </div>
              )}

              {embedTab === "url" && (
                <div className="space-y-3">
                  <p className="leading-relaxed text-slate-600">
                    Link directly to this hosted legal document from your website footer or application menu:
                  </p>

                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs text-slate-800 break-all">
                    <span>{publicHostedUrl}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEmbedModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    embedTab === "widget" ? widgetSnippet : publicHostedUrl,
                    "modal_copy"
                  )
                }
                className="px-4 py-1.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {copiedType === "modal_copy" ? (
                  <>
                    <Check className="size-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
