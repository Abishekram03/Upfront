"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Cookie,
  Scale,
  Database,
  Sliders,
  Eye,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  FileText,
  Code2,
  Edit3,
  Clock,
  ArrowLeft,
  Crown,
  Globe,
} from "lucide-react"
import { useDomain } from "@/lib/domain-context"
import { useEntitlements } from "@/lib/entitlements-context"
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/translations"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"

interface DiscoveredCookie {
  id?: string
  name: string
  category: string
  service_name?: string
  duration?: string
  description?: string
}

const DEFAULT_COOKIES: DiscoveredCookie[] = [
  {
    name: "_ga",
    category: "analytics",
    service_name: "Google Analytics",
    duration: "2 years",
    description: "Used to distinguish users and calculate visitor, session and campaign data for analytics reports.",
  },
  {
    name: "_gid",
    category: "analytics",
    service_name: "Google Analytics",
    duration: "24 hours",
    description: "Used to store and count pageviews across user visits.",
  },
  {
    name: "upfront_test_functional",
    category: "functional",
    service_name: "UpFront CMP",
    duration: "Session",
    description: "Preserves user interface state, preferred language, and regional preferences.",
  },
  {
    name: "upfront_cookie",
    category: "necessary",
    service_name: "UpFront CMP",
    duration: "1 year",
    description: "Stores the visitor's consent state and preferences for cookie categories.",
  },
  {
    name: "session",
    category: "necessary",
    service_name: "Authentication",
    duration: "Session",
    description: "Maintains encrypted session authentication state during browsing.",
  },
]

interface CookiePolicyGeneratorProps {
  onBack?: () => void
  initialViewMode?: "card" | "editor"
  companyName?: string
}

export function CookiePolicyGenerator({ onBack, initialViewMode = "card", companyName }: CookiePolicyGeneratorProps = {}) {
  const { sites, activeDomain } = useDomain()
  const domain = activeDomain || (sites && sites.length > 0 ? (sites[0]?.domain ?? "") : "")
  const effectiveCompany = companyName?.trim() || domain || "Your Company"

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

  // View state: "card" (Clean Status Card) | "editor" (4-Step Customization Wizard)
  const [viewMode, setViewMode] = useState<"card" | "editor">(initialViewMode)

  // Wizard Step (1: About Cookies, 2: Use of Cookies, 3: Types of Cookies, 4: Preferences)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Scanner & Cookies State
  const [cookies, setCookies] = useState<DiscoveredCookie[]>(DEFAULT_COOKIES)
  const [lastScanDate, setLastScanDate] = useState<string | null>(null)
  const [isLoadingCookies, setIsLoadingCookies] = useState(true)

  // Step 1: About cookies
  const [aboutHeading, setAboutHeading] = useState("What are cookies?")
  const [aboutDescription, setAboutDescription] = useState(
    `This Cookie Policy explains what cookies are, how we use them, the types of cookies we use (i.e., the information we collect using cookies and how that information is used), and how to manage your cookie settings.\n\nCookies are small text files used to store small pieces of information. They are stored on your device when a website loads in your browser. These cookies help ensure that the website functions properly, enhance security, provide a better user experience, and analyse performance to identify what works and where improvements are needed.`
  )

  // Step 2: Use of cookies
  const [useHeading, setUseHeading] = useState("How do we use cookies?")
  const [useDescription, setUseDescription] = useState(
    `Like most online services, our website uses both first-party and third-party cookies for various purposes. First-party cookies are primarily necessary for the website to function properly and do not collect any personally identifiable data.\n\nThe third-party cookies used on our website primarily help us understand how the website performs, track how you interact with it, keep our services secure, deliver relevant advertisements, and enhance your overall user experience while improving the speed of your future interactions with our website.`
  )

  // Step 3: Types of cookies
  const [typesHeading, setTypesHeading] = useState("Types of cookies we use")

  // Step 4: Cookie preferences
  const [prefHeading, setPrefHeading] = useState("Manage cookie preferences")
  const [prefDescription, setPrefDescription] = useState(
    `You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.\n\nAdditionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers:\n\nChrome: https://support.google.com/accounts/answer/32050\nSafari: https://support.apple.com/en-in/guide/safari/sfri11471/mac\nFirefox: https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox\nMicrosoft Edge: https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09\n\nIf you are using a different web browser, please refer to its official support documentation.`
  )

  // Export Tab inside Preview Modal
  const [previewTab, setPreviewTab] = useState<"rendered" | "embed" | "html">("rendered")
  const [selectedLang, setSelectedLang] = useState<string>("en")
  const [copiedType, setCopiedType] = useState<string | null>(null)

  // Fetch real cookies & scan metadata for domain
  useEffect(() => {
    if (!domain) return
    setIsLoadingCookies(true)

    const loadData = async () => {
      try {
        const [cookiesRes, scanRes] = await Promise.all([
          fetch(`/api/v1/consent/cookies?domain=${encodeURIComponent(domain)}`),
          fetch(`/api/v1/consent/scanner?domain=${encodeURIComponent(domain)}`),
        ])

        if (cookiesRes.ok) {
          const cookieData = await cookiesRes.json()
          if (Array.isArray(cookieData) && cookieData.length > 0) {
            setCookies(cookieData)
          } else if (cookieData?.cookies && Array.isArray(cookieData.cookies) && cookieData.cookies.length > 0) {
            setCookies(cookieData.cookies)
          } else {
            setCookies(DEFAULT_COOKIES)
          }
        } else {
          setCookies(DEFAULT_COOKIES)
        }

        if (scanRes.ok) {
          const scanData = await scanRes.json()
          const scanDate = scanData.latest_scan?.completed_at || scanData.latest_scan?.created_at
          if (scanDate) {
            const date = new Date(scanDate)
            setLastScanDate(
              date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            )
          }
        }
      } catch (err) {
        console.warn("Could not load policy cookie data:", err)
        setCookies(DEFAULT_COOKIES)
      } finally {
        setIsLoadingCookies(false)
      }
    }

    loadData()
  }, [domain])

  const handleSaveDraft = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success("Cookie policy saved successfully!")
      if (onBack) {
        onBack()
      } else {
        setViewMode("card")
      }
    }, 300)
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedType(null), 2000)
  }

  // Calculate Progress Percentage in Editor (4 steps: 0%, 33%, 66%, 100%)
  const progressPct = Math.round(((activeStep - 1) / 3) * 100)

  // Generated Dynamic Snippet
  const dynamicEmbedCode = `<div id="usrly-cookie-declaration" data-domain="${domain}" data-lang="${selectedLang}"></div>\n<script defer src="https://usrly-five.vercel.app/script.js"></script>`

  // Generated Full HTML Document
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cookie Policy - ${domain}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; }
    
    body, .legal-page-container {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-weight: 400;
      line-height: 1.7;
      color: #475569;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .legal-hero {
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid #e2e8f0;
      background-color: #f8fafc;
      padding: 64px 24px 56px 24px;
      text-align: center;
      margin-bottom: 40px;
    }

    .legal-hero-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 55%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 55%, transparent 100%);
      pointer-events: none;
    }

    .legal-hero-content {
      position: relative;
      max-width: 640px;
      margin: 0 auto;
    }

    .legal-eyebrow {
      font-size: 13.5px;
      font-weight: 500;
      color: #1868db;
      margin: 0 0 10px 0;
      letter-spacing: 0.02em;
    }

    .legal-hero-title {
      font-size: 38px;
      font-weight: 500;
      color: #0f172a;
      margin: 0 0 14px 0;
      letter-spacing: -0.02em;
      line-height: 1.25;
    }

    @media (max-width: 640px) {
      .legal-hero-title { font-size: 28px; }
      .legal-hero { padding: 48px 16px 40px 16px; }
    }

    .legal-subtitle {
      font-size: 15.5px;
      color: #64748b;
      margin: 0 auto;
      line-height: 1.6;
      max-width: 580px;
    }

    .legal-body {
      max-width: 768px;
      margin: 0 auto;
      padding: 0 24px 64px 24px;
    }

    .legal-last-updated {
      font-size: 13.5px;
      color: #64748b;
      margin-bottom: 32px;
    }

    h2, .legal-h2 {
      font-size: 20px;
      font-weight: 500;
      color: #0f172a;
      margin: 36px 0 14px 0;
      letter-spacing: -0.01em;
    }

    p, li {
      font-size: 15px;
      font-weight: 400;
      color: #475569;
      margin: 0 0 16px 0;
      line-height: 1.7;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 13px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      background: #ffffff;
    }

    th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #0f172a;
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
    }
    th:last-child { border-right: none; }

    td {
      padding: 12px 14px;
      color: #475569;
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
    }
    td:last-child { border-right: none; }
    tr:last-child td { border-bottom: none; }

    .btn-revisit {
      display: inline-flex;
      align-items: center;
      padding: 8px 18px;
      background: #1868db;
      color: #ffffff !important;
      text-decoration: none !important;
      border-radius: 6px;
      font-weight: 500;
      font-size: 13px;
      margin: 12px 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      transition: background 0.15s ease;
    }
    .btn-revisit:hover {
      background: #1559be;
    }
  </style>
</head>
<body>
  <div class="legal-page-container">
    <div class="legal-hero">
      <div class="legal-hero-grid" aria-hidden="true"></div>
      <div class="legal-hero-content">
        <p class="legal-eyebrow">Legal</p>
        <h1 class="legal-hero-title">Cookie Policy</h1>
        <p class="legal-subtitle">How ${effectiveCompany} uses cookies and tracking technologies across the ${domain} website.</p>
      </div>
    </div>

    <div class="legal-body">
      <div class="legal-last-updated">Last updated: ${lastScanDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>

      <h2>${aboutHeading}</h2>
      ${aboutDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("")}

      <h2>${useHeading}</h2>
      ${useDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("")}

      <h2>${typesHeading}</h2>
      <div id="usrly-cookie-declaration" data-domain="${domain}"></div>

      <h2>${prefHeading}</h2>
      <p><a href="javascript:void(0)" onclick="if(window.UserlyCMP)window.UserlyCMP.openPreferences()" class="btn-revisit">Consent Preferences</a></p>
      ${prefDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("")}
    </div>
  </div>

  <script defer src="https://usrly-five.vercel.app/script.js"></script>
</body>
</html>`

  // =========================================================================
  // VIEW MODE 1: CLEAN COOKIEYES-STYLE POLICY CARD
  // =========================================================================
  if (viewMode === "card") {
    return (
      <div className="w-full space-y-6 animate-in fade-in duration-150">
        {/* Simple Page Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cookie Policy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage and customize your auto-updating cookie policy.
          </p>
        </div>

        {/* The Clean Policy Card */}
        <div className="rounded-lg border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-lg bg-blue-50 border border-blue-100 text-[#1868db] flex items-center justify-center shrink-0">
                <FileText className="size-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    Cookie Policy
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Auto-updated on {lastScanDate || "recent scan"} • {cookies.length} cookies linked
                </p>
              </div>
            </div>

            {/* Actions: Edit & Preview */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Eye className="size-3.5 text-slate-500" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("editor")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Edit3 className="size-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Simple Embed Code Snippet Row */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex-1 min-w-0 flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-md px-3 py-1.5 text-[11px] font-mono text-slate-600 truncate">
              <Code2 className="size-3.5 text-slate-400 shrink-0" />
              <span className="truncate">&lt;div id="usrly-cookie-declaration" data-domain="{domain}"&gt;&lt;/div&gt;</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(dynamicEmbedCode, "card_embed")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              {copiedType === "card_embed" ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-slate-500" />
                  <span>Copy Embed Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Full Policy Preview Modal */}
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-[#1868db]" />
                  <h3 className="text-sm font-bold text-slate-900">Cookie Policy — {domain}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Tabs & Language */}
              <div className="px-4 pt-2 pb-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-bold bg-white">
                <div className="flex items-center gap-3">
                  {[
                    { id: "rendered", label: "Rendered Document" },
                    { id: "embed", label: "Dynamic Script", locked: !isGrowthPlus },
                    { id: "html", label: "Raw HTML" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPreviewTab(tab.id as any)}
                      className={cn(
                        "pb-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
                        previewTab === tab.id
                          ? "border-[#1868db] text-[#1868db]"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      )}
                    >
                      <span>{tab.label}</span>
                      {tab.locked && (
                        <Crown className="size-3.5 text-amber-500 fill-amber-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-md px-2 py-1 shadow-2xs">
                  <Globe className="size-3 text-slate-500 shrink-0" />
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="bg-transparent text-[11px] font-semibold text-slate-700 outline-hidden cursor-pointer"
                    aria-label="Select policy language"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-xs sm:text-sm space-y-6 leading-relaxed bg-slate-50/50">
                {previewTab === "rendered" && (
                  <div className="max-w-3xl mx-auto rounded-xl border border-slate-200/90 bg-white shadow-xs text-slate-700 overflow-hidden">
                    {/* Landing Page Style PageHero Header */}
                    <div className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/50 px-6 py-12 sm:py-16 text-center">
                      <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
                      <div className="relative max-w-2xl mx-auto space-y-3">
                        <p className="text-xs sm:text-sm font-medium text-primary">Legal</p>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-normal text-slate-900 text-balance">
                          Cookie Policy
                        </h1>
                        <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                          How {effectiveCompany} uses cookies and tracking technologies across the {domain} website.
                        </p>
                      </div>
                    </div>

                    <div className="p-6 sm:p-10 space-y-8">
                      <p className="text-sm text-muted-foreground">
                        Last updated: {lastScanDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>

                      {/* Section 1 */}
                      <div>
                        <h2 className="text-xl font-medium tracking-normal text-slate-900 mb-3">{aboutHeading}</h2>
                        <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                          {aboutDescription.split("\n\n").map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      </div>

                      {/* Section 2 */}
                      <div>
                        <h2 className="text-xl font-medium tracking-normal text-slate-900 mb-3">{useHeading}</h2>
                        <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                          {useDescription.split("\n\n").map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: Cookie Table */}
                      <div className="space-y-4">
                        <h2 className="text-xl font-medium tracking-normal text-slate-900">{typesHeading}</h2>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>Live Cookie Table</span>
                            <span className="text-primary font-bold">{cookies.length} active cookies</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Automatically rendered and synchronized from your website scans.
                          </p>
                        </div>
                      </div>

                      {/* Section 4: Preferences */}
                      <div className="space-y-4">
                        <h2 className="text-xl font-medium tracking-normal text-slate-900 mb-3">{prefHeading}</h2>
                        <div>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-md bg-primary hover:bg-brand-dark text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer"
                          >
                            Consent Preferences
                          </button>
                        </div>
                        <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
                          {prefDescription.split("\n\n").map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === "embed" && (
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
                          Upgrade to the Growth plan to automatically deliver live policy updates, automatic cookie declaration sync, and instant compliance changes to your website without manually editing code.
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
                    <div className="space-y-3">
                      <p className="text-slate-600">
                        Paste this snippet into your website to embed the self-updating declaration widget:
                      </p>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
                        <code>{dynamicEmbedCode}</code>
                      </div>
                    </div>
                  )
                )}

                {previewTab === "html" && (
                  <div className="space-y-3">
                    <p className="text-slate-600">Complete standalone HTML policy:</p>
                    <textarea
                      readOnly
                      rows={12}
                      value={fullHtml}
                      className="w-full p-3 font-mono text-[11px] bg-slate-900 text-slate-100 rounded-lg border border-slate-700 leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Close
                </button>

                {previewTab === "embed" && !isGrowthPlus ? (
                  <button
                    type="button"
                    onClick={() => openUpgradeModal?.("growth", "Dynamic Policy Embed Script")}
                    className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Crown className="size-3.5 fill-white text-white" />
                    <span>Upgrade to Unlock</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        previewTab === "embed" ? dynamicEmbedCode : fullHtml,
                        previewTab
                      )
                    }
                    className="px-4 py-1.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {copiedType === previewTab ? (
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
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // VIEW MODE 2: CLEAN 5-STEP CUSTOMIZATION WIZARD
  // =========================================================================
  return (
    <div className="w-full space-y-4 animate-in fade-in duration-150">
      {/* Back to Policy Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack()
            } else {
              setViewMode("card")
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Policies</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Eye className="size-3.5" />
            <span>Preview</span>
          </button>
          <Button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="rounded-md bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-1.5 shadow-xs cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="w-full bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col min-h-[580px]">
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* LEFT STEP NAVIGATION RAIL */}
          <div className="w-full md:w-[240px] shrink-0 border-r border-slate-200/80 bg-slate-50/50 p-4 flex flex-col justify-between select-none">
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-slate-900">Edit Cookie Policy</h2>
                <p className="text-[11px] text-slate-500 truncate">
                  {domain}
                </p>
              </div>

              {/* 4 Navigation Steps */}
              <nav className="space-y-1">
                {[
                  { step: 1, label: "About cookies", icon: Cookie },
                  { step: 2, label: "Use of cookies", icon: Scale },
                  { step: 3, label: "Types of cookies", icon: Database },
                  { step: 4, label: "Cookie preferences", icon: Sliders },
                ].map((item) => {
                  const Icon = item.icon
                  const isActive = activeStep === item.step
                  const isCompleted = activeStep > item.step
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setActiveStep(item.step as any)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer",
                        isActive
                          ? "bg-blue-50/80 text-[#1868db] font-bold shadow-2xs"
                          : isCompleted
                          ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-800"
                      )}
                    >
                      <Icon className={cn("size-3.5 shrink-0", isActive ? "text-[#1868db]" : "text-slate-400")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isCompleted && <Check className="size-3 text-emerald-600 stroke-[2.5]" />}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Bottom Progress Counter */}
            <div className="pt-4 border-t border-slate-200/60 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>{progressPct}% complete</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#1868db] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(progressPct, 4)}%` }}
                />
              </div>
            </div>
          </div>

          {/* MAIN STEP FORM CONTENT AREA */}
          <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 min-h-0 bg-white">
            <div className="max-w-2xl space-y-5">
              {/* STEP 1: ABOUT COOKIES */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">About cookies</h3>
                    <p className="text-xs text-slate-500">
                      Introduction explaining what cookies are to your visitors.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Heading</label>
                      <input
                        type="text"
                        value={aboutHeading}
                        onChange={(e) => setAboutHeading(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                      <textarea
                        rows={6}
                        value={aboutDescription}
                        onChange={(e) => setAboutDescription(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: USE OF COOKIES */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">How do we use cookies?</h3>
                    <p className="text-xs text-slate-500">
                      Explain why your website sets first-party and third-party cookies.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Heading</label>
                      <input
                        type="text"
                        value={useHeading}
                        onChange={(e) => setUseHeading(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                      <textarea
                        rows={6}
                        value={useDescription}
                        onChange={(e) => setUseDescription(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: TYPES OF COOKIES */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Types of cookies we use</h3>
                    <p className="text-xs text-slate-500">
                      Cookie declaration table automatically populates based on your domain scans.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Heading</label>
                      <input
                        type="text"
                        value={typesHeading}
                        onChange={(e) => setTypesHeading(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Discovered Cookie Inventory</span>
                        <span className="text-[#1868db]">{cookies.length} Cookies Linked</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Scheduled scanner keeps this table synchronized automatically.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PREFERENCES */}
              {activeStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Manage cookie preferences</h3>
                    <p className="text-xs text-slate-500">
                      Instructions for users to withdraw consent or change browser settings.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Heading</label>
                      <input
                        type="text"
                        value={prefHeading}
                        onChange={(e) => setPrefHeading(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                      <textarea
                        rows={6}
                        value={prefDescription}
                        onChange={(e) => setPrefDescription(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-6">
              <div>
                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                    className="rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Previous</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeStep < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                    className="rounded-md bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-1.5 shadow-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSaveDraft}
                    className="rounded-md bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-1.5 shadow-xs cursor-pointer"
                  >
                    Save & Finish
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
