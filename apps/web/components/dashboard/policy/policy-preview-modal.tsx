"use client"

import { useState } from "react"
import {
  X,
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  Info,
} from "lucide-react"
import { PolicyDefinition, DomainPolicyRecord } from "./policy-types"
import { useCMPCookiePolicy } from "./use-cmp-cookie-policy"
import {
  generatePrivacyPolicyMarkdown,
  generatePrivacyPolicyHtml,
  generateTermsOfServiceMarkdown,
  generateTermsOfServiceHtml,
} from "./policy-generator-template"
import { cn } from "@/lib/utils"

interface PolicyPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  policy: PolicyDefinition | null
  record?: DomainPolicyRecord | null
  domain: string
  onEdit?: (policy: PolicyDefinition) => void
}

export function PolicyPreviewModal({
  isOpen,
  onClose,
  policy,
  record,
  domain,
  onEdit,
}: PolicyPreviewModalProps) {
  const [copiedType, setCopiedType] = useState<"html" | "markdown" | "link" | null>(null)
  const [activeTab, setActiveTab] = useState<"rendered" | "html" | "markdown">("rendered")

  // Load live CMP cookie policy data if this is the Cookie Policy
  const isCookiePolicy = policy?.id === "cookies"
  const cmpData = useCMPCookiePolicy(isCookiePolicy && isOpen ? domain : "")

  if (!isOpen || !policy) return null

  const policyTitle = record?.customTitle || policy.name
  const cfg = record?.config || {}

  const effectiveDate =
    cfg.effectiveDate ||
    (isCookiePolicy && cmpData.lastScanDate
      ? cmpData.lastScanDate
      : new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }))

  // Configuration values for Privacy Policy
  const companyName = cfg.companyName || "Acme Technologies Inc."
  const websiteUrl = cfg.websiteUrl || `https://${domain || "example.com"}`
  const supportEmail = cfg.supportEmail || `privacy@${domain || "example.com"}`
  const dpoEmail = cfg.dpoEmail || `dpo@${domain || "example.com"}`
  const country = cfg.country || "United States"
  const stateRegion = cfg.stateRegion || "California"
  const platforms: string[] = cfg.platforms || ["Website", "Mobile App (iOS/Android)"]
  const directData: string[] = cfg.directData || [
    "Names",
    "Email addresses",
    "Phone numbers",
    "Billing addresses",
    "Usernames",
    "Contact preferences",
  ]
  const autoData: string[] = cfg.autoData || [
    "IP address and device geolocation",
    "Browser type, version, and operating system",
    "Log files, timestamps, and page engagement data",
  ]
  const purposes: string[] = cfg.purposes || [
    "To facilitate account creation and logon process",
    "To fulfill and manage orders, payments, and subscriptions",
    "To deliver administrative, security, and service notices",
    "To protect our services from malicious activities, spam, and fraud",
    "To analyze web metrics and improve platform performance",
  ]
  const disclosures: string[] = cfg.disclosures || [
    "Cloud hosting and database infrastructure (AWS, Vercel, Google Cloud)",
    "Payment processors (Stripe, PayPal, Paddle)",
    "Web analytics engines (Cookieless Analytics)",
    "Customer support and live ticketing desks",
  ]
  const includeGdpr = cfg.includeGdpr !== false
  const includeCcpa = cfg.includeCcpa !== false
  const includeCoppa = cfg.includeCoppa !== false
  const minAge = cfg.minAge || "13"

  // Configuration values for Terms of Service
  const tosUserAge = cfg.tosUserAge || "13"
  const accountRequired = cfg.accountRequired !== false
  const prohibitedList: string[] = cfg.prohibitedList || [
    "Automated scraping, crawling, or extracting data without authorization",
    "Reverse engineering, decompiling, or attempting to discover source code",
    "Transmitting viruses, malware, or attempting denial-of-service attacks",
    "Impersonating other users or misrepresenting entity affiliations",
    "Harassing, defaming, or abusing other members or staff",
    "Commercial reselling or exploiting services without permission",
  ]
  const refundPolicySummary =
    cfg.refundPolicySummary || "30-day money-back guarantee for subscription fees upon written request."
  const liabilityLimit = cfg.liabilityLimit || "Amount paid by user in preceding 12 months"
  const arbitrationClause = cfg.arbitrationClause !== false

  // Sample or live markdown content
  const activeMarkdown =
    isCookiePolicy && cmpData.generatedMarkdown
      ? cmpData.generatedMarkdown
      : policy.id === "privacy"
      ? generatePrivacyPolicyMarkdown(cfg, domain)
      : policy.id === "terms"
      ? generateTermsOfServiceMarkdown(cfg, domain)
      : record?.contentMarkdown ||
        `# ${policyTitle} for ${domain}
**Effective Date:** ${effectiveDate}  
**Website:** https://${domain || "example.com"}

## 1. Agreement & Terms
This ${policyTitle} sets forth the legal policies and guidelines for **${domain || "example.com"}**.
`

  // Sample or live HTML content
  const activeHtml =
    isCookiePolicy && cmpData.generatedHtml
      ? cmpData.generatedHtml
      : policy.id === "privacy"
      ? generatePrivacyPolicyHtml(cfg, domain)
      : policy.id === "terms"
      ? generateTermsOfServiceHtml(cfg, domain)
      : record?.contentHtml ||
        `<div class="legal-policy-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 20px;">
  <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">${policyTitle} for ${domain}</h1>
  <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;"><strong>Effective Date:</strong> ${effectiveDate} | <strong>Website:</strong> https://${domain || "example.com"}</p>
  <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 10px;">1. Introduction & Scope</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">This ${policyTitle} sets forth the legal policies and guidelines for <strong>${domain || "example.com"}</strong>.</p>
</div>`

  const handleCopy = (type: "html" | "markdown" | "link") => {
    let textToCopy = ""
    if (type === "html") textToCopy = activeHtml
    else if (type === "markdown") textToCopy = activeMarkdown
    else if (type === "link") textToCopy = `https://${domain || "example.com"}/policy/${policy.id}`

    navigator.clipboard.writeText(textToCopy)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2500)
  }

  // Generic Markdown renderer for any markdown text
  const renderGenericMarkdown = (md: string) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={cn("size-9 rounded-full flex items-center justify-center border shadow-2xs", policy.iconBg, policy.iconColor)}>
              <policy.icon className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{policyTitle}</h2>
                {isCookiePolicy && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80"
                    title="This policy is automatically synchronized from your CMP tool scans."
                  >
                    <Info className="size-3 text-blue-600 shrink-0" />
                    <span>Synced from CMP tool</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close Preview"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* View Mode Switcher Toolbar */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("rendered")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                activeTab === "rendered"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Document View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("html")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                activeTab === "html"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              HTML Code
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("markdown")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                activeTab === "markdown"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Markdown
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy("html")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              {copiedType === "html" ? <Check className="size-3.5 text-emerald-600" /> : <FileCode className="size-3.5 text-slate-500" />}
              <span>{copiedType === "html" ? "Copied HTML!" : "Copy HTML"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy("markdown")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-[#1868db] bg-blue-50/70 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
            >
              {copiedType === "markdown" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-[#1868db]" />}
              <span>{copiedType === "markdown" ? "Copied MD!" : "Copy Markdown"}</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEdit(policy)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-white bg-[#1868db] hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
              >
                <span>Edit Policy</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          {activeTab === "rendered" && (
            <div className="mx-auto max-w-3xl rounded-xl border border-slate-200/90 bg-white p-8 sm:p-12 shadow-sm space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed">
              {/* ======================================================= */}
              {/* 1. COOKIE POLICY (Live CMP Cookies Integration) */}
              {/* ======================================================= */}
              {isCookiePolicy ? (
                <div className="space-y-6 text-slate-800 leading-relaxed text-xs">
                  <div className="border-b border-slate-100 pb-4">
                    <h1 className="text-xl font-bold text-slate-900">Cookie Policy for {domain || "onconnect.one"}</h1>
                    <p className="text-slate-500 text-[11px] mt-1">
                      <strong>Effective Date:</strong> {effectiveDate} | <strong>Domain:</strong> https://{domain || "onconnect.one"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900">{cmpData.aboutHeading}</h2>
                    {cmpData.aboutDescription.split("\n\n").map((p, i) => (
                      <p key={i} className="text-slate-600">{p}</p>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900">{cmpData.useHeading}</h2>
                    {cmpData.useDescription.split("\n\n").map((p, i) => (
                      <p key={i} className="text-slate-600">{p}</p>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900">{cmpData.typesHeading}</h2>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Live Cookie Table</span>
                        <span className="text-[#1868db]">{cmpData.cookies.length} active cookies</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Automatically rendered and synchronized from your website scans.
                      </p>

                      {cmpData.cookies.length > 0 && (
                        <div className="mt-2 rounded border border-slate-200 overflow-hidden bg-white">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                              <tr>
                                <th className="p-2">Cookie Name</th>
                                <th className="p-2">Category</th>
                                <th className="p-2">Provider</th>
                                <th className="p-2">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {cmpData.cookies.map((c, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60">
                                  <td className="p-2 font-mono font-semibold text-[#1868db]">{c.name}</td>
                                  <td className="p-2 capitalize">{c.category}</td>
                                  <td className="p-2 text-slate-600">{c.service_name || domain}</td>
                                  <td className="p-2 text-slate-500">{c.duration || "Session"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-1 border-t border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900">{cmpData.prefHeading}</h2>
                    <div>
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-md bg-[#1868db] text-white font-bold text-xs shadow-2xs cursor-pointer hover:bg-blue-700 transition-colors"
                      >
                        Consent Preferences
                      </button>
                    </div>
                    {cmpData.prefDescription.split("\n\n").map((p, i) => (
                      <p key={i} className="text-slate-600 leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>
              ) : policy.id === "privacy" ? (
                /* ======================================================= */
                /* 2. PRIVACY POLICY (Full 13 Sections) */
                /* ======================================================= */
                <div className="space-y-4 text-slate-800 leading-relaxed text-xs">
                  {renderGenericMarkdown(activeMarkdown)}
                </div>
              ) : policy.id === "terms" ? (
                /* ======================================================= */
                /* 3. TERMS OF SERVICE (Matches 8-Step Questionnaire) */
                /* ======================================================= */
                <div className="space-y-6 text-slate-800 leading-relaxed text-xs">
                  <div className="border-b border-slate-100 pb-4">
                    <h1 className="text-xl font-bold text-slate-900">Terms and Conditions for {domain}</h1>
                    <p className="text-slate-500 text-[11px] mt-1">
                      <strong>Effective Date:</strong> {effectiveDate} | <strong>Domain:</strong> https://{domain}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900">1. Agreement to Terms</h2>
                    <p className="text-slate-600">
                      These Terms constitute a legally binding contract between you and <strong>{companyName}</strong>. By accessing <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] text-blue-700 font-mono">{websiteUrl}</code> across <strong>{(cfg.tosPlatforms || ["Website", "SaaS Web Application"]).join(", ")}</strong>, you confirm that you are at least {tosUserAge} years old and agree to comply with these terms.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900">2. User Accounts & Registration</h2>
                    <p className="text-slate-600">
                      {accountRequired ? "Users are required to register an account to access core platform features and are responsible for safeguarding login credentials." : "Public access does not require registration."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900">3. User-Generated Content & Contributions</h2>
                    <p className="text-slate-600">
                      {cfg.allowUgc !== false ? `Users may submit, post, or upload content (including comments, reviews, or media). You grant ${companyName} a worldwide, royalty-free, non-exclusive license to host and distribute such contributions.` : "Users are not permitted to submit or publish user-generated content on the platform."}
                      {cfg.ugcModeration !== false ? " We reserve the unilateral right to monitor, edit, or remove any content that violates these Terms without prior notice." : ""}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900">4. Prohibited Activities</h2>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      {prohibitedList.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900">5. Intellectual Property & DMCA Notice</h2>
                    <p className="text-slate-600">
                      All proprietary source code, architecture, software, trademarks, and design assets are owned by <strong>{companyName}</strong>. For copyright takedown inquiries under the DMCA, contact our designated agent at <strong className="text-[#1868db]">{cfg.dmcaEmail || `legal@${domain}`}</strong>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900">6. Subscriptions, Billing & Cancellations</h2>
                    <p className="text-slate-600">
                      {cfg.monetizationType === "paid_subscriptions" ? `We offer recurring subscription plans billed on a ${(cfg.billingCycle || "monthly_annual").replace("_", " & ")} basis.` : cfg.monetizationType === "one_time" ? "We offer paid one-time products and digital purchases." : "Our services are provided on a complimentary free basis."} {cfg.autoRenewalNotice !== false ? "Subscriptions automatically renew at the end of each billing cycle unless cancelled prior to renewal." : ""} {refundPolicySummary}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <h2 className="text-sm font-bold text-slate-900">7. Warranty Disclaimer, Limitation of Liability & Dispute Resolution</h2>
                    <p className="text-slate-600">
                      {cfg.warrantyDisclaimer !== false ? `Services are provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind.` : ""} Our aggregate liability shall not exceed <strong>{liabilityLimit}</strong>. {arbitrationClause ? `Any legal disputes shall be resolved through binding arbitration in ${country}${stateRegion ? `, ${stateRegion}` : ""}.` : ""} Inquiries should be sent to <strong className="text-[#1868db]">{supportEmail}</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                /* ======================================================= */
                /* 4. GENERIC / OTHER POLICIES (Parsed Structured Document) */
                /* ======================================================= */
                <div className="space-y-4 text-slate-800 leading-relaxed text-xs">
                  {renderGenericMarkdown(record?.contentMarkdown || activeMarkdown)}
                </div>
              )}
            </div>
          )}

          {activeTab === "html" && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs font-mono text-emerald-400 overflow-x-auto">
              <pre className="whitespace-pre-wrap">{activeHtml}</pre>
            </div>
          )}

          {activeTab === "markdown" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 font-mono text-xs text-slate-800 overflow-x-auto shadow-2xs">
              <pre className="whitespace-pre-wrap">{activeMarkdown}</pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>{isCookiePolicy ? "Directly synchronized with CMP cookies" : "Ready for embed or public hosting"}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
