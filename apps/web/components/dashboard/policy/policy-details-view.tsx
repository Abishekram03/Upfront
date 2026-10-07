"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Code2,
  Edit3,
  Check,
  Copy,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"
import { useEntitlements } from "@/lib/entitlements-context"
import { PolicyDefinition, DomainPolicyRecord } from "./policy-types"
import { useCMPCookiePolicy } from "./use-cmp-cookie-policy"
import {
  generatePrivacyPolicyMarkdown,
  generatePrivacyPolicyHtml,
  generateTermsOfServiceMarkdown,
  generateTermsOfServiceHtml,
} from "./policy-generator-template"

function renderGenericMarkdown(
  md: string,
  domain: string = "example.com",
  companyName?: string,
  fallbackTitle?: string
) {
  const normalized = md
    .replace(/\r\n/g, "\n")
    .replace(/(^|\n)(#{1,3}\s+[^\n]+)/g, "\n\n$2\n\n")

  const rawSections = normalized.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
  if (rawSections.length === 0) return null

  let title = fallbackTitle || ""
  let lastUpdated = ""
  let startIdx = 0

  if (rawSections[0] && rawSections[0].startsWith("# ")) {
    const extractedTitle = rawSections[0].replace(/^# /, "").trim()
    if (fallbackTitle === "Terms of Service" && extractedTitle.toLowerCase().includes("privacy")) {
      title = "Terms of Service"
    } else if (fallbackTitle === "Privacy Policy" && extractedTitle.toLowerCase().includes("terms")) {
      title = "Privacy Policy"
    } else {
      title = extractedTitle || fallbackTitle || ""
    }
    startIdx = 1
    const second = rawSections[1]
    if (
      second &&
      (second.startsWith("*Last updated") ||
        second.startsWith("**Last updated") ||
        second.toLowerCase().startsWith("last updated"))
    ) {
      lastUpdated = second.replace(/^\*+|\*+$/g, "").replace(/^Last updated:\s*/i, "").trim()
      startIdx = 2
    }
  }

  const effectiveCompany = companyName?.trim() || domain
  const isPrivacy = title.toLowerCase().includes("privacy")
  const isTerms = title.toLowerCase().includes("terms") || title.toLowerCase().includes("agreement") || title.toLowerCase().includes("condition") || title.toLowerCase().includes("use")
  const isCookies = title.toLowerCase().includes("cookie")

  const subtitle = isPrivacy
    ? `How ${effectiveCompany} handles personal data across the ${domain} website and service.`
    : isCookies
    ? `How ${effectiveCompany} uses cookies and tracking technologies across the ${domain} website.`
    : isTerms
    ? `The agreement between you and ${effectiveCompany} for use of the ${domain} service.`
    : `Legal policies and guidelines governing the use of ${effectiveCompany} across ${domain}.`

  return (
    <div className="text-slate-700">
      {/* Landing Page Style PageHero Header */}
      {title && (
        <div className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/50 -mx-6 -mt-6 sm:-mx-10 sm:-mt-10 mb-8 px-6 py-12 sm:py-16 text-center">
          <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
          <div className="relative max-w-2xl mx-auto space-y-3">
            <p className="text-xs sm:text-sm font-medium text-primary">Legal</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-normal text-slate-900 text-balance">
              {title}
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Main Document Body */}
      <div className="max-w-3xl mx-auto space-y-8 px-1">
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        )}

        <div className="space-y-8">
          {rawSections.slice(startIdx).map((section, idx) => {
            if (!section || section === "---") return null

            if (section.startsWith("# ")) {
              return (
                <div key={idx} className="pt-4 border-b border-slate-200 pb-2">
                  <h1 className="text-2xl font-medium tracking-normal text-slate-900">{section.replace(/^# /, "")}</h1>
                </div>
              )
            }

            if (section.startsWith("## ")) {
              return (
                <div key={idx} className="pt-4">
                  <h2 className="text-xl font-medium tracking-normal text-slate-900 mb-3">
                    {section.replace(/^## /, "")}
                  </h2>
                </div>
              )
            }

            if (section.startsWith("### ")) {
              return (
                <h3 key={idx} className="text-base font-semibold text-slate-900 mt-5 mb-2">
                  {section.replace(/^### /, "")}
                </h3>
              )
            }

            if (section.startsWith("- ")) {
              const items = section.split("\n").map((line) => line.replace(/^- /, "").trim())
              return (
                <ul key={idx} className="list-disc space-y-2.5 pl-5 text-[15px] leading-relaxed text-slate-600">
                  {items.map((item, i) => (
                    <li
                      key={i}
                      dangerouslySetInnerHTML={{
                        __html: item
                          .replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold text-slate-900'>$1</strong>")
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
                className="text-[15px] leading-relaxed text-slate-600 font-normal"
                dangerouslySetInnerHTML={{
                  __html: section
                    .replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold text-slate-900'>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>")
                    .replace(/\`(.*?)\`/g, "<code class='bg-slate-100 px-1.5 py-0.5 rounded text-primary text-xs font-mono font-medium border border-slate-200/70'>$1</code>")
                    .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' class='text-primary font-medium hover:underline' target='_blank' rel='noopener noreferrer'>$1</a>"),
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface PolicyDetailsViewProps {
  policy: PolicyDefinition
  record?: DomainPolicyRecord | null
  domain: string
  sharedCompanyName?: string
  onBack: () => void
  onEdit: () => void
  onPublish: (record: DomainPolicyRecord) => void
}

export function PolicyDetailsView({
  policy,
  record,
  domain,
  sharedCompanyName,
  onBack,
  onEdit,
  onPublish,
}: PolicyDetailsViewProps) {
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false)
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [embedTab, setEmbedTab] = useState<"html" | "widget">("html")
  const [isPublishing, setIsPublishing] = useState(false)

  // Entitlements
  let isGrowthPlus = false
  let openUpgradeModal: ((plan?: any, feat?: string) => void) | undefined
  try {
    const entitlements = useEntitlements()
    isGrowthPlus = entitlements.plan === "growth" || entitlements.plan === "business" || Boolean(entitlements.isPaid)
    openUpgradeModal = entitlements.openUpgradeModal
  } catch {
    isGrowthPlus = false
  }

  const isCookiePolicy = policy.id === "cookies"
  const isPrivacyPolicy = policy.id === "privacy"
  const isTermsPolicy = policy.id === "terms"
  const configuredCompany =
    record?.config?.companyName?.trim() ||
    (record?.config as any)?.dbaName?.trim() ||
    sharedCompanyName?.trim() ||
    ""

  // Live CMP cookie policy data for cookies
  const cmpData = useCMPCookiePolicy(isCookiePolicy ? domain : "", configuredCompany)

  const isPublished = record?.status === "published"
  const policyTitle = record?.customTitle || policy.name
  const lastUpdated = (() => {
    if (isCookiePolicy && (cmpData.lastSyncedDate || cmpData.lastScanDate)) {
      return cmpData.lastSyncedDate || cmpData.lastScanDate
    }
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

  // Full HTML snippet for policy
  const fullHtmlSnippet = isCookiePolicy
    ? cmpData.generatedHtml
    : isPrivacyPolicy
    ? generatePrivacyPolicyHtml(record?.config || {}, domain)
    : isTermsPolicy
    ? generateTermsOfServiceHtml(record?.config || {}, domain)
    : record?.contentHtml || ""

  // Div / Script container embed
  const widgetSnippet = isCookiePolicy
    ? `<div id="usrly-cookie-declaration" data-domain="${domain}"></div>\n<script defer src="https://usrly-five.vercel.app/script.js"></script>`
    : `<div id="usrly-${policy.id}-policy" data-domain="${domain}"></div>\n<script defer src="https://usrly-five.vercel.app/script.js"></script>`

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
          {/* Sync Button on Free Tier / Green Border Auto Sync on Growth+ Tier */}
          {isCookiePolicy && (
            cmpData.isGrowthPlus ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-emerald-800 bg-emerald-50 border-2 border-emerald-500 shadow-2xs">
                <Zap className="size-3.5 text-emerald-600 animate-pulse" />
                <span>Auto Sync</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={cmpData.syncCookies}
                disabled={cmpData.isSyncing}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-2xs border",
                  cmpData.hasPendingSync
                    ? "bg-[#1868db] hover:bg-blue-700 text-white border-transparent"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                )}
              >
                <RefreshCw className={cn("size-3.5", cmpData.isSyncing && "animate-spin", cmpData.hasPendingSync ? "text-white" : "text-[#1868db]")} />
                <span>{cmpData.isSyncing ? "Syncing..." : "Sync Cookies"}</span>
              </button>
            )
          )}

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
          <div className="text-slate-700">
            {/* Landing Page Style PageHero Header */}
            <div className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/50 -mx-6 -mt-6 sm:-mx-10 sm:-mt-10 mb-8 px-6 py-12 sm:py-16 text-center">
              <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
              <div className="relative max-w-2xl mx-auto space-y-3">
                <p className="text-xs sm:text-sm font-medium text-primary">Legal</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-normal text-slate-900 text-balance">
                  {policyTitle}
                </h1>
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                  How {configuredCompany || domain} uses cookies and tracking technologies across the {domain} website.
                </p>
              </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-8 px-1">
              {lastUpdated && (
                <p className="text-sm text-muted-foreground">
                  Last updated: {lastUpdated}
                </p>
              )}

              {/* Section 1 */}
              <div>
                <h2 className="text-xl font-medium tracking-normal text-slate-900 mb-3">{cmpData.aboutHeading}</h2>
                <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                  {cmpData.aboutDescription.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-xl font-medium tracking-normal text-slate-900 mb-3">{cmpData.useHeading}</h2>
                <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                  {cmpData.useDescription.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>

              {/* Section 3: Cookie Table & Manual Sync Controls */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-xl font-medium tracking-normal text-slate-900">{cmpData.typesHeading}</h2>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmpData.isGrowthPlus ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-emerald-500 bg-emerald-50 text-emerald-800 text-xs font-semibold shadow-2xs">
                        <Zap className="size-3.5 text-emerald-600 animate-pulse" />
                        <span>Auto Sync</span>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={cmpData.syncCookies}
                          disabled={cmpData.isSyncing}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs border",
                            cmpData.hasPendingSync
                              ? "bg-primary hover:bg-brand-dark text-white border-transparent"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                          )}
                        >
                          <RefreshCw className={cn("size-3.5", cmpData.isSyncing && "animate-spin", cmpData.hasPendingSync ? "text-white" : "text-primary")} />
                          <span>{cmpData.isSyncing ? "Syncing..." : "Sync Cookies"}</span>
                        </button>

                        <span className="text-xs font-medium text-muted-foreground bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                          {cmpData.cookies.length} Cookies
                        </span>
                      </>
                    )}
                  </div>
                </div>

              {/* Free Tier Unsynced Alert Banner */}
              {!cmpData.isGrowthPlus && cmpData.hasPendingSync && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">
                        Scan updates pending synchronization ({cmpData.pendingCount} detected cookies)
                      </p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Your scanner found new cookies. Click <strong>Sync Cookies</strong> to update your policy table.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={cmpData.syncCookies}
                    disabled={cmpData.isSyncing}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md text-xs shadow-2xs transition-colors shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className={cn("size-3", cmpData.isSyncing && "animate-spin")} />
                    <span>Sync Now</span>
                  </button>
                </div>
              )}

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
                                : "bg-blue-50 text-blue-700 border border-blue-200"
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
              <div className="space-y-4">
                <h2 className="text-xl font-medium tracking-normal text-slate-900 mb-3">{cmpData.prefHeading}</h2>

                <div>
                  <button
                    type="button"
                    onClick={() => toast.info("Opens CMP Cookie Preferences modal for website visitors.")}
                    className="px-4 py-2 rounded-md bg-primary hover:bg-brand-dark text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Consent Preferences</span>
                  </button>
                </div>

                <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                  {cmpData.prefDescription.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {/* Browser Links */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {cmpData.browserLinks.map((b) => (
                    <a
                      key={b.name}
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 text-xs font-medium flex items-center justify-between transition-colors"
                    >
                      <span>{b.name}</span>
                      <ExternalLink className="size-3 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRIVACY POLICY PREVIEW (Full 13 Sections) */}
        {isPrivacyPolicy && (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700">
            {renderGenericMarkdown(generatePrivacyPolicyMarkdown(record?.config || {}, domain), domain, configuredCompany, "Privacy Policy")}
          </div>
        )}

        {/* TERMS OF SERVICE PREVIEW (Full 21 Sections) */}
        {isTermsPolicy && (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700">
            {renderGenericMarkdown(generateTermsOfServiceMarkdown(record?.config || {}, domain), domain, configuredCompany, "Terms of Service")}
          </div>
        )}

        {/* OTHER POLICIES PREVIEW */}
        {!isCookiePolicy && !isPrivacyPolicy && !isTermsPolicy && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {renderGenericMarkdown(record?.contentMarkdown || policy.defaultSampleText || `# ${policyTitle}\n\nThis policy statement protects your platform, ensures consumer compliance, and defines clear legal guidelines.`, domain, configuredCompany)}
          </div>
        )}
      </div>

      {/* 3. ADD TO WEBSITE MODAL (HTML & Div Script Only) */}
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

            {/* Modal Tabs (HTML & Embed Script) */}
            <div className="px-4 pt-3 border-b border-slate-200 flex items-center gap-3 text-xs font-bold">
              {[
                { id: "html", label: "HTML Code" },
                { id: "widget", label: "Embed Script" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEmbedTab(tab.id as any)}
                  className={cn(
                    "pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
                    embedTab === tab.id
                      ? "border-[#1868db] text-[#1868db]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  )}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              {embedTab === "html" && (
                <div className="space-y-3">
                  <p className="leading-relaxed text-slate-600">
                    Copy and paste this HTML document directly into your CMS or webpage:
                  </p>

                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-[11px] text-slate-200 max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
                    <pre className="whitespace-pre-wrap break-all">{fullHtmlSnippet}</pre>
                  </div>
                </div>
              )}

              {embedTab === "widget" && (
                <div className="space-y-3">
                  <p className="leading-relaxed text-slate-600">
                    Paste this script tag into your website page where you want the policy to display:
                  </p>

                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                    <code>{widgetSnippet}</code>
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
                    embedTab === "html" ? fullHtmlSnippet : widgetSnippet,
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
                    <span>Copy {embedTab === "html" ? "HTML" : "Script"}</span>
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
