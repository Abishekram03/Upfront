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
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"
import { PolicyDefinition, DomainPolicyRecord } from "./policy-types"
import { useCMPCookiePolicy } from "./use-cmp-cookie-policy"
import { generatePrivacyPolicyMarkdown } from "./policy-generator-template"

function renderGenericMarkdown(md: string) {
  const normalized = md
    .replace(/\r\n/g, "\n")
    .replace(/(^|\n)(#{1,3}\s+[^\n]+)/g, "\n\n$2\n\n")
    .replace(/(^|\n)(---\s*)/g, "\n\n---\n\n")

  const sections = normalized.split(/\n\s*\n/)
  return (
    <div className="space-y-4 font-normal text-slate-600 font-sans antialiased text-[13px] leading-relaxed">
      {sections.map((section, idx) => {
        const trimmed = section.trim()
        if (!trimmed) return null
        if (trimmed === "---") return <hr key={idx} className="border-t border-slate-200/80 my-4" />

        if (trimmed.startsWith("# ")) {
          return (
            <div key={idx} className="border-b border-slate-100 pb-3 mb-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{trimmed.replace(/^# /, "")}</h1>
            </div>
          )
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-sm font-bold text-slate-900 mt-6 mb-2 tracking-tight">
              {trimmed.replace(/^## /, "")}
            </h2>
          )
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-xs font-semibold text-slate-800 mt-4 mb-1.5">
              {trimmed.replace(/^### /, "")}
            </h3>
          )
        }

        if (trimmed.startsWith("- ")) {
          const items = trimmed.split("\n").map((line) => line.replace(/^- /, "").trim())
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5 text-slate-600 text-[13px] font-normal">
              {items.map((item, i) => (
                <li
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: item
                      .replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold text-slate-800'>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>"),
                  }}
                />
              ))}
            </ul>
          )
        }

        return (
          <p
            key={idx}
            className="text-[13px] text-slate-600 font-normal leading-relaxed mb-2"
            dangerouslySetInnerHTML={{
              __html: trimmed
                .replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold text-slate-800'>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>")
                .replace(/\`(.*?)\`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-blue-700 text-[11px] font-mono'>$1</code>")
                .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' class='text-[#1868db] hover:underline' target='_blank' rel='noopener noreferrer'>$1</a>"),
            }}
          />
        )
      })}
    </div>
  )
}

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
  const lastUpdated = (() => {
    if (isCookiePolicy && cmpData.lastScanDate) return cmpData.lastScanDate
    if (record?.publishedAt) {
      try {
        return new Date(record.publishedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      } catch {
        return record.publishedAt
      }
    }
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  })()

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

      {/* 2. POLICY PREVIEW CONTAINER */}
      <div className="w-full bg-white rounded-lg border border-slate-200/90 shadow-2xs p-6 sm:p-10 space-y-6 text-slate-800">
        {/* COOKIE POLICY PREVIEW */}
        {isCookiePolicy && (
          <div className="space-y-6 text-xs leading-relaxed text-slate-700">
            <div className="border-b border-slate-100 pb-3">
              <h1 className="text-xl font-medium text-slate-900 tracking-tight">{policyTitle}</h1>
              <p className="text-xs text-slate-400 italic mt-1">Last updated: {lastUpdated}</p>
            </div>
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

        {/* PRIVACY POLICY PREVIEW (Full 13 Sections) */}
        {isPrivacyPolicy && (
          <div className="space-y-4 text-xs leading-relaxed text-slate-700">
            {renderGenericMarkdown(generatePrivacyPolicyMarkdown(record?.config || {}, domain))}
          </div>
        )}

        {/* TERMS OF SERVICE PREVIEW */}
        {isTermsPolicy && (
          <div className="space-y-6 text-xs leading-relaxed text-slate-700">
            <div className="border-b border-slate-100 pb-3">
              <h1 className="text-xl font-medium text-slate-900 tracking-tight">{policyTitle}</h1>
              <p className="text-xs text-slate-400 italic mt-1">Last updated: {lastUpdated}</p>
            </div>
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
