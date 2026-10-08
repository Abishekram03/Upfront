"use client"

import { useState } from "react"
import {
  X,
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  Info,
  Zap,
  RefreshCw,
  AlertCircle,
  Code2,
  Crown,
  Globe,
} from "lucide-react"
import { useEntitlements } from "@/lib/entitlements-context"
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/translations"
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
  sharedCompanyName?: string
  onEdit?: (policy: PolicyDefinition) => void
}

export function PolicyPreviewModal({
  isOpen,
  onClose,
  policy,
  record,
  domain,
  sharedCompanyName,
  onEdit,
}: PolicyPreviewModalProps) {
  const [copiedType, setCopiedType] = useState<"html" | "markdown" | "widget" | null>(null)
  const [activeTab, setActiveTab] = useState<"rendered" | "html" | "widget" | "markdown">("rendered")
  const [selectedLang, setSelectedLang] = useState<string>("en")

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

  const cfg = record?.config || {}
  const configuredCompany =
    record?.config?.companyName?.trim() ||
    cfg?.companyName?.trim() ||
    (cfg as any)?.dbaName?.trim() ||
    sharedCompanyName?.trim() ||
    ""

  // Load live CMP cookie policy data if this is the Cookie Policy
  const isCookiePolicy = policy?.id === "cookies"
  const cmpData = useCMPCookiePolicy(isCookiePolicy && isOpen ? domain : "", configuredCompany, selectedLang)

  if (!isOpen || !policy) return null

  const policyTitle = record?.customTitle || policy.name

  const effectiveDate =
    cfg.effectiveDate ||
    (isCookiePolicy && (cmpData.lastSyncedDate || cmpData.lastScanDate)
      ? cmpData.lastSyncedDate || cmpData.lastScanDate
      : new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }))

  // Sample or live markdown content
  const activeMarkdown =
    isCookiePolicy && cmpData.generatedMarkdown
      ? cmpData.generatedMarkdown
      : policy.id === "privacy"
      ? generatePrivacyPolicyMarkdown(cfg, domain, selectedLang)
      : policy.id === "terms"
      ? generateTermsOfServiceMarkdown(cfg, domain, selectedLang)
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
      ? generatePrivacyPolicyHtml(cfg, domain, selectedLang)
      : policy.id === "terms"
      ? generateTermsOfServiceHtml(cfg, domain, selectedLang)
      : record?.contentHtml ||
        `<div class="legal-policy-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 20px;">
  <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">${policyTitle} for ${domain}</h1>
  <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;"><strong>Effective Date:</strong> ${effectiveDate} | <strong>Website:</strong> https://${domain || "example.com"}</p>
  <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 10px;">1. Introduction & Scope</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">This ${policyTitle} sets forth the legal policies and guidelines for <strong>${domain || "example.com"}</strong>.</p>
</div>`

  const widgetSnippet = isCookiePolicy
    ? `<div id="usrly-cookie-declaration" data-domain="${domain}" data-lang="${selectedLang}"></div>\n<script defer src="https://usrly-five.vercel.app/script.js"></script>`
    : `<div id="usrly-${policy.id}-policy" data-domain="${domain}" data-lang="${selectedLang}"></div>\n<script defer src="https://usrly-five.vercel.app/script.js"></script>`

  const handleCopy = (type: "html" | "markdown" | "widget") => {
    let textToCopy = ""
    if (type === "html") textToCopy = activeHtml
    else if (type === "markdown") textToCopy = activeMarkdown
    else if (type === "widget") textToCopy = widgetSnippet

    navigator.clipboard.writeText(textToCopy)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2500)
  }

  // Generic Markdown renderer for any markdown text
  const renderGenericMarkdown = (
    md: string,
    targetDomain: string = domain || "example.com",
    companyName?: string,
    fallbackTitle?: string
  ) => {
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

    const effectiveCompany = companyName?.trim() || targetDomain
    const isPrivacy = title.toLowerCase().includes("privacy")
    const isTerms = title.toLowerCase().includes("terms") || title.toLowerCase().includes("agreement") || title.toLowerCase().includes("condition") || title.toLowerCase().includes("use")
    const isCookies = title.toLowerCase().includes("cookie")

    const subtitle = isPrivacy
      ? `How ${effectiveCompany} handles personal data across the ${targetDomain} website and service.`
      : isCookies
      ? `How ${effectiveCompany} uses cookies and tracking technologies across the ${targetDomain} website.`
      : isTerms
      ? `The agreement between you and ${effectiveCompany} for use of the ${targetDomain} service.`
      : `Legal policies and guidelines governing the use of ${effectiveCompany} across ${targetDomain}.`

    return (
      <div className="text-slate-700">
        {/* Landing Page Style PageHero Header */}
        {title && (
          <div className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/50 -mx-8 -mt-8 sm:-mx-12 sm:-mt-12 mb-8 px-6 py-12 sm:py-16 text-center">
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

        {/* Document Sections */}
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("size-9 rounded-full flex items-center justify-center border shadow-2xs", policy.iconBg, policy.iconColor)}>
              <policy.icon className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{policyTitle}</h2>
                {isCookiePolicy && (
                  cmpData.isGrowthPlus ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border-2 border-emerald-500 shadow-2xs">
                      <Zap className="size-3 text-emerald-600 animate-pulse" />
                      <span>Auto Sync</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      <Info className="size-3 text-slate-500" />
                      <span>Sync</span>
                    </span>
                  )
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

        {/* View Mode Switcher Toolbar (Document | HTML | Container Script | Markdown) */}
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
              onClick={() => setActiveTab("widget")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "widget"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Code2 className="size-3 text-[#1868db]" />
              <span>Dynamic Script</span>
              {!isGrowthPlus && (
                <Crown className="size-3 text-amber-500 fill-amber-400 shrink-0" />
              )}
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
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-lg px-2 py-1 shadow-2xs">
              <Globe className="size-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer pr-1"
                aria-label="Select policy language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

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
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-2xs border",
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
              onClick={() => {
                if (!isGrowthPlus) {
                  openUpgradeModal?.("growth", "Dynamic Policy Embed Script")
                  return
                }
                handleCopy("widget")
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-2xs border",
                !isGrowthPlus
                  ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                  : "text-[#1868db] bg-blue-50/70 border-blue-200 hover:bg-blue-100"
              )}
            >
              {!isGrowthPlus ? (
                <>
                  <Crown className="size-3.5 fill-amber-500 text-amber-600" />
                  <span>Upgrade for Script</span>
                </>
              ) : copiedType === "widget" ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span>Copied Script!</span>
                </>
              ) : (
                <>
                  <Code2 className="size-3.5 text-[#1868db]" />
                  <span>Copy Script</span>
                </>
              )}
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
                <div className="space-y-6 text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {/* Landing Page Style PageHero Header */}
                  <div className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/50 -mx-8 -mt-8 sm:-mx-12 sm:-mt-12 mb-8 px-6 py-12 sm:py-16 text-center">
                    <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
                    <div className="relative max-w-2xl mx-auto space-y-3">
                      <p className="text-xs sm:text-sm font-medium text-primary">Legal</p>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-normal text-slate-900 text-balance">
                        Cookie Policy
                      </h1>
                      <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                        How {configuredCompany || domain || "example.com"} uses cookies and tracking technologies across the {domain || "example.com"} website.
                      </p>
                    </div>
                  </div>

                  <div className="max-w-3xl mx-auto space-y-8 px-1">
                    <p className="text-sm text-muted-foreground">
                      Last updated: {cmpData.lastSyncedDate || cmpData.lastScanDate || effectiveDate}
                    </p>

                    {/* Section 1 */}
                    <div>
                      <h2 className="text-xl font-medium tracking-normal text-slate-900 mb-3">{cmpData.aboutHeading}</h2>
                      <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                        {cmpData.aboutDescription.split("\n\n").map((p: string, i: number) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div>
                      <h2 className="text-xl font-medium tracking-normal text-slate-900 mb-3">{cmpData.useHeading}</h2>
                      <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                        {cmpData.useDescription.split("\n\n").map((p: string, i: number) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>

                    {/* Section 3: Cookie Table */}
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
                            <button
                              type="button"
                              onClick={cmpData.syncCookies}
                              disabled={cmpData.isSyncing}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer border",
                                cmpData.hasPendingSync
                                  ? "bg-primary hover:bg-brand-dark text-white border-transparent"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                              )}
                            >
                              <RefreshCw className={cn("size-3", cmpData.isSyncing && "animate-spin", cmpData.hasPendingSync ? "text-white" : "text-primary")} />
                              <span>{cmpData.isSyncing ? "Syncing..." : "Sync Cookies"}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {!cmpData.isGrowthPlus && cmpData.hasPendingSync && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="size-4 text-amber-600 shrink-0" />
                            <span>Scan changes detected. Click <strong>Sync Cookies</strong> to update table.</span>
                          </div>
                          <button
                            type="button"
                            onClick={cmpData.syncCookies}
                            className="font-semibold underline text-amber-900 hover:text-amber-950 shrink-0 cursor-pointer"
                          >
                            Sync Now
                          </button>
                        </div>
                      )}

                      {cmpData.cookies.length > 0 && (
                        <div className="mt-2 rounded-lg border border-slate-200 overflow-hidden bg-white shadow-2xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                              <tr>
                                <th className="p-2.5">Cookie Name</th>
                                <th className="p-2.5">Category</th>
                                <th className="p-2.5">Provider</th>
                                <th className="p-2.5">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                              {cmpData.cookies.map((c: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
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
                                  <td className="p-2.5 text-slate-600">{c.service_name || domain}</td>
                                  <td className="p-2.5 text-slate-500">{c.duration || "Session"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Section 4: Manage Cookie Preferences */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-medium tracking-normal text-slate-900 mb-3">{cmpData.prefHeading}</h2>
                      <div>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-md bg-primary hover:bg-brand-dark text-white font-medium text-xs shadow-2xs cursor-pointer transition-colors"
                        >
                          Consent Preferences
                        </button>
                      </div>
                      <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                        {cmpData.prefDescription.split("\n\n").map((p: string, i: number) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : policy.id === "privacy" ? (
                /* ======================================================= */
                /* 2. PRIVACY POLICY */
                /* ======================================================= */
                <div className="space-y-4 text-slate-800 leading-relaxed text-xs">
                  {renderGenericMarkdown(activeMarkdown, domain, configuredCompany, "Privacy Policy")}
                </div>
              ) : policy.id === "terms" ? (
                /* ======================================================= */
                /* 3. TERMS OF SERVICE */
                /* ======================================================= */
                <div className="space-y-4 text-slate-800 leading-relaxed text-xs">
                  {renderGenericMarkdown(activeMarkdown, domain, configuredCompany, "Terms of Service")}
                </div>
              ) : (
                /* ======================================================= */
                /* 4. GENERIC / OTHER POLICIES (Parsed Structured Document) */
                /* ======================================================= */
                <div className="space-y-4 text-slate-800 leading-relaxed text-xs">
                  {renderGenericMarkdown(record?.contentMarkdown || activeMarkdown, domain, configuredCompany)}
                </div>
              )}
            </div>
          )}

          {activeTab === "html" && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs font-mono text-emerald-400 overflow-x-auto">
              <pre className="whitespace-pre-wrap">{activeHtml}</pre>
            </div>
          )}

          {activeTab === "widget" && (
            !isGrowthPlus ? (
              <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-8 text-center space-y-4 max-w-xl mx-auto my-6">
                <div className="size-11 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                  <Crown className="size-5 fill-amber-400 text-amber-600" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-sm font-bold text-slate-900">
                    Dynamic Policy Embedding is Locked
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Upgrade to the Growth plan to automatically deliver live policy updates, automated cookie declaration sync, and instant compliance changes to your website without manually editing code.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => openUpgradeModal?.("growth", "Dynamic Policy Embed Script")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    <Crown className="size-3.5 fill-white text-white" />
                    <span>Upgrade to Growth</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-xs text-slate-800 shadow-2xs">
                <span className="font-bold text-sm text-slate-900">Dynamic Script</span>
                <p className="text-slate-600">
                  Paste this script tag into your website page where you want the policy to display:
                </p>
                <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800">
                  <code>{widgetSnippet}</code>
                </div>
              </div>
            )
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
            <span>{isCookiePolicy ? "Directly synchronized with CMP cookies" : "Ready for HTML embed or manual export"}</span>
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
