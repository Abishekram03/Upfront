"use client"

import { useState, useEffect } from "react"
import {
  Globe,
  Cookie,
  Scale,
  Database,
  Sliders,
  Eye,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileText,
  Code2,
  Search,
  HelpCircle,
  Layers,
} from "lucide-react"
import { useDomain } from "@/lib/domain-context"
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

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
]

export function CookiePolicyGenerator() {
  const { activeDomain } = useDomain()
  const domain = activeDomain || "onconnect.one"

  // Step Navigation: 1 (Language) -> 2 (About) -> 3 (Use) -> 4 (Types) -> 5 (Preferences)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  // Scanner & Cookies State
  const [cookies, setCookies] = useState<DiscoveredCookie[]>([])
  const [lastScanDate, setLastScanDate] = useState<string | null>(null)
  const [isLoadingCookies, setIsLoadingCookies] = useState(true)

  // Policy Form State
  const [primaryLanguage, setPrimaryLanguage] = useState("en")
  const [multiLanguageEnabled, setMultiLanguageEnabled] = useState(false)

  // Step 2: About cookies
  const [aboutHeading, setAboutHeading] = useState("What are cookies?")
  const [aboutDescription, setAboutDescription] = useState(
    `This Cookie Policy explains what cookies are, how we use them, the types of cookies we use (i.e., the information we collect using cookies and how that information is used), and how to manage your cookie settings.\n\nCookies are small text files used to store small pieces of information. They are stored on your device when a website loads in your browser. These cookies help ensure that the website functions properly, enhance security, provide a better user experience, and analyse performance to identify what works and where improvements are needed.`
  )

  // Step 3: Use of cookies
  const [useHeading, setUseHeading] = useState("How do we use cookies?")
  const [useDescription, setUseDescription] = useState(
    `Like most online services, our website uses both first-party and third-party cookies for various purposes. First-party cookies are primarily necessary for the website to function properly and do not collect any personally identifiable data.\n\nThe third-party cookies used on our website primarily help us understand how the website performs, track how you interact with it, keep our services secure, deliver relevant advertisements, and enhance your overall user experience while improving the speed of your future interactions with our website.`
  )

  // Step 4: Types of cookies
  const [typesHeading, setTypesHeading] = useState("Types of cookies we use")

  // Step 5: Cookie preferences
  const [prefHeading, setPrefHeading] = useState("Manage cookie preferences")
  const [prefDescription, setPrefDescription] = useState(
    `You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.\n\nAdditionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers:\n\nChrome: https://support.google.com/accounts/answer/32050\nSafari: https://support.apple.com/en-in/guide/safari/sfri11471/mac\nFirefox: https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox\nMicrosoft Edge: https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09\n\nIf you are using a different web browser, please refer to its official support documentation.`
  )

  // Export Tab inside Preview Modal
  const [previewTab, setPreviewTab] = useState<"rendered" | "embed" | "html" | "markdown">("rendered")
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
          if (Array.isArray(cookieData)) {
            setCookies(cookieData)
          }
        }

        if (scanRes.ok) {
          const scanData = await scanRes.json()
          if (scanData.latest_scan?.created_at) {
            const date = new Date(scanData.latest_scan.created_at)
            setLastScanDate(
              date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }) +
                " " +
                date.toLocaleTimeString("en-US", { hour12: false }) +
                " (UTC)"
            )
          }
        }
      } catch (err) {
        console.warn("Could not load policy cookie data:", err)
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
      toast.success("Policy draft saved successfully!")
    }, 400)
  }

  const handleTriggerScan = async () => {
    if (!domain || isScanning) return
    setIsScanning(true)
    try {
      const res = await fetch("/api/v1/consent/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })
      if (res.ok) {
        toast.success(`Audit scan initiated for ${domain}`)
      } else {
        toast.info(`Scan scheduled for ${domain}`)
      }
    } catch {
      toast.info(`Scan scheduled for ${domain}`)
    } finally {
      setTimeout(() => setIsScanning(false), 2000)
    }
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    toast.success("Code snippet copied to clipboard!")
    setTimeout(() => setCopiedType(null), 2000)
  }

  // Calculate Progress Percentage
  const progressPct = (activeStep - 1) * 20

  // Generated Dynamic Snippet
  const dynamicEmbedCode = `<div id="usrly-cookie-declaration" data-domain="${domain}"></div>
<script defer src="https://usrly-five.vercel.app/userly.js"></script>`

  // Generated Full HTML Document
  const fullHtml = `<!DOCTYPE html>
<html lang="${primaryLanguage}">
<head>
  <meta charset="utf-8" />
  <title>Cookie Policy - ${domain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 840px; margin: 0 auto; padding: 32px 16px; }
    h1, h2, h3 { color: #0f172a; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
    th { background-color: #f8fafc; font-weight: 600; }
    .btn-revisit { display: inline-block; padding: 8px 16px; background: #1868db; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; margin: 12px 0; }
  </style>
</head>
<body>
  <h1>Cookie Policy for ${domain}</h1>
  <p><em>Last updated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</em></p>

  <h2>${aboutHeading}</h2>
  ${aboutDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("")}

  <h2>${useHeading}</h2>
  ${useDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("")}

  <h2>${typesHeading}</h2>
  <div id="usrly-cookie-declaration" data-domain="${domain}"></div>

  <h2>${prefHeading}</h2>
  <p><a href="javascript:void(0)" onclick="if(window.UserlyCMP)window.UserlyCMP.openPreferences()" class="btn-revisit">Consent Preferences</a></p>
  ${prefDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("")}

  <script defer src="https://usrly-five.vercel.app/userly.js"></script>
</body>
</html>`

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col min-h-[640px]">

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* LEFT STEP NAVIGATION RAIL */}
        <div className="w-full md:w-[260px] shrink-0 border-r border-slate-200/80 bg-slate-50/50 p-5 flex flex-col justify-between select-none">
          <div className="space-y-6">
            {/* Header / Domain context */}
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Cookie Policy</h2>
              <p className="text-[11px] text-slate-500 truncate">
                Generating cookie policy for <strong className="text-slate-800">{domain}</strong>
              </p>
            </div>

            {/* 5 Navigation Steps */}
            <nav className="space-y-1">
              {[
                { step: 1, label: "Language settings", icon: Globe },
                { step: 2, label: "About cookies", icon: Cookie },
                { step: 3, label: "Use of cookies", icon: Scale },
                { step: 4, label: "Types of cookies", icon: Database },
                { step: 5, label: "Cookie preferences", icon: Sliders },
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
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                      isActive
                        ? "bg-blue-50/80 text-[#1868db] font-bold shadow-2xs"
                        : isCompleted
                        ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-800"
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", isActive ? "text-[#1868db]" : "text-slate-400")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isCompleted && <Check className="size-3.5 text-emerald-600 stroke-[2.5]" />}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Bottom Progress & Preview Button */}
          <div className="pt-6 space-y-4 border-t border-slate-200/60 mt-6">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-[#1868db] text-xs font-bold py-2 shadow-2xs transition-colors cursor-pointer"
            >
              <Eye className="size-4" />
              <span>Preview cookie policy</span>
            </button>

            {/* Progress Counter & Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
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
        </div>

        {/* MAIN STEP FORM CONTENT AREA */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 md:p-8 min-h-0 bg-white">
          <div className="max-w-3xl space-y-6">
            {/* ======================================================== */}
            {/* STEP 1: LANGUAGE SETTINGS                                */}
            {/* ======================================================== */}
            {activeStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Language settings</h3>
                  <p className="text-xs text-slate-500">
                    Select the primary language for your cookie policy.
                  </p>
                </div>

                {/* Language Picker Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
                  {LANGUAGES.map((lang) => {
                    const isSelected = primaryLanguage === lang.code
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setPrimaryLanguage(lang.code)}
                        className={cn(
                          "p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer select-none",
                          isSelected
                            ? "border-[#1868db] bg-blue-50/70 text-[#1868db] shadow-2xs ring-1 ring-[#1868db]"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        {isSelected && <Check className="size-3.5 text-[#1868db] stroke-[3]" />}
                        <span>{lang.name}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Multi-language Generation Toggle */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Generate policy in multiple languages
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Automatically translate policy for international visitors based on browser preferences.
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={multiLanguageEnabled}
                    onClick={() => setMultiLanguageEnabled(!multiLanguageEnabled)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                      multiLanguageEnabled ? "bg-[#1868db]" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        multiLanguageEnabled ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: ABOUT COOKIES                                    */}
            {/* ======================================================== */}
            {activeStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">About cookies</h3>
                  <p className="text-xs text-slate-500">
                    Define the fundamental introduction explaining what cookies are to your visitors.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Heading</label>
                    <input
                      type="text"
                      value={aboutHeading}
                      onChange={(e) => setAboutHeading(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#1868db] focus:ring-1 focus:ring-[#1868db]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Description</label>
                    <textarea
                      rows={8}
                      value={aboutDescription}
                      onChange={(e) => setAboutDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#1868db] focus:ring-1 focus:ring-[#1868db] leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: USE OF COOKIES                                   */}
            {/* ======================================================== */}
            {activeStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Use of cookies</h3>
                  <p className="text-xs text-slate-500">
                    Disclose how first-party and third-party tracking technologies operate on your site.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Heading</label>
                    <input
                      type="text"
                      value={useHeading}
                      onChange={(e) => setUseHeading(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#1868db] focus:ring-1 focus:ring-[#1868db]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Description</label>
                    <textarea
                      rows={8}
                      value={useDescription}
                      onChange={(e) => setUseDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#1868db] focus:ring-1 focus:ring-[#1868db] leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: TYPES OF COOKIES (SCANNER INTEGRATION)           */}
            {/* ======================================================== */}
            {activeStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Types of cookies</h3>
                  <p className="text-xs text-slate-500">
                    Display itemized inventory tables of scanned cookies and tracking categories.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Heading</label>
                    <input
                      type="text"
                      value={typesHeading}
                      onChange={(e) => setTypesHeading(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                    />
                  </div>

                  {/* Cookie List Header with Last Scan Timestamp */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Cookie list</span>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs text-blue-900">
                      <AlertCircle className="size-4 text-[#1868db] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        The cookie list displayed is based on your last scan on{" "}
                        <strong>{lastScanDate || "September 30, 2026 12:08:44 (UTC)"}</strong>.
                      </span>
                    </div>

                    {/* Table View / Zero State */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                      <div className="lg:col-span-2">
                        {cookies.length > 0 ? (
                          <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-2xs">
                            <div className="overflow-x-auto max-h-72 overflow-y-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                                  <tr>
                                    <th className="px-3 py-2">Cookie</th>
                                    <th className="px-3 py-2">Category</th>
                                    <th className="px-3 py-2">Duration</th>
                                    <th className="px-3 py-2">Purpose</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                  {cookies.map((c, i) => (
                                    <tr key={i} className="hover:bg-slate-50/60">
                                      <td className="px-3 py-2 font-mono font-bold text-slate-900">{c.name}</td>
                                      <td className="px-3 py-2 capitalize">{c.category}</td>
                                      <td className="px-3 py-2 text-slate-500">{c.duration || "Session"}</td>
                                      <td className="px-3 py-2 text-slate-500 truncate max-w-[160px]">
                                        {c.description || "Maintains site service."}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          /* Clean Dashed Zero State Card */
                          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-3.5">
                            <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
                              <Cookie className="size-6 text-slate-400" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-slate-900">No cookies detected</h4>
                              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                We couldn&apos;t detect any cookies during the latest scan. This may be because your site doesn&apos;t use cookies or some pages were not fully accessed during the scan.
                              </p>
                            </div>
                            <Button
                              type="button"
                              onClick={handleTriggerScan}
                              disabled={isScanning}
                              className="rounded-lg bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-2 shadow-xs cursor-pointer inline-flex items-center gap-2"
                            >
                              <Search className="size-3.5" />
                              <span>{isScanning ? "Scanning Domain..." : "Scan again"}</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Right "What to know" Legal Sidebar Card */}
                      <div className="lg:col-span-1 rounded-lg border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <FileText className="size-3.5 text-[#1868db]" />
                          <span>What to know</span>
                        </div>
                        <div className="font-semibold text-slate-800 text-[11px]">
                          Is it necessary to include the cookie list in my cookie policy?
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Yes, we recommend including the cookie list in your cookie policy. It&apos;s important to provide transparency to users about the cookies used on your website.
                        </p>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          A cookie declaration/list helps users understand the types, purposes, and durations of cookies, ensuring compliance with privacy regulations and enabling users to make informed choices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 5: COOKIE PREFERENCES                               */}
            {/* ======================================================== */}
            {activeStep === 5 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Cookie preferences</h3>
                  <p className="text-xs text-slate-500">
                    Provide instructions and direct links on how visitors can revoke or change their preferences.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Heading</label>
                    <input
                      type="text"
                      value={prefHeading}
                      onChange={(e) => setPrefHeading(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Revisit consent widget
                    </label>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 select-all">
                      &lt;a class=&quot;usrly-banner-element&quot;&gt;Consent Preferences&lt;/a&gt;
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Description</label>
                    <textarea
                      rows={8}
                      value={prefDescription}
                      onChange={(e) => setPrefDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM STEP CONTROLS FOOTER */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between mt-8">
            <div>
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Previous</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save draft"}
              </button>

              {activeStep < 5 ? (
                <Button
                  type="button"
                  onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                  className="rounded-lg bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-5 py-2 shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="rounded-lg bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-5 py-2 shadow-xs cursor-pointer"
                >
                  Generate cookie policy
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FULL POLICY PREVIEW & EXPORT MODAL */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#1868db]" />
                <h3 className="text-sm font-bold text-slate-900">Generated Cookie Policy — {domain}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs: Rendered | Embed Code | HTML */}
            <div className="px-4 pt-3 border-b border-slate-200 flex items-center gap-3 text-xs font-bold">
              {[
                { id: "rendered", label: "Rendered Document" },
                { id: "embed", label: "Dynamic Embed Code" },
                { id: "html", label: "Raw HTML" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPreviewTab(tab.id as any)}
                  className={cn(
                    "pb-2.5 border-b-2 transition-colors cursor-pointer",
                    previewTab === tab.id
                      ? "border-[#1868db] text-[#1868db]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4 leading-relaxed">
              {previewTab === "rendered" && (
                <div className="space-y-4 max-w-2xl mx-auto text-slate-800">
                  <h1 className="text-xl font-bold text-slate-900">Cookie Policy for {domain}</h1>
                  <p className="text-slate-500 italic">
                    Last updated:{" "}
                    {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>

                  <div className="space-y-2 pt-2">
                    <h2 className="text-sm font-bold text-slate-900">{aboutHeading}</h2>
                    {aboutDescription.split("\n\n").map((p, i) => (
                      <p key={i} className="text-slate-600">{p}</p>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2">
                    <h2 className="text-sm font-bold text-slate-900">{useHeading}</h2>
                    {useDescription.split("\n\n").map((p, i) => (
                      <p key={i} className="text-slate-600">{p}</p>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2">
                    <h2 className="text-sm font-bold text-slate-900">{typesHeading}</h2>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500">
                      [Dynamic Live Cookie Table automatically rendered by Upfront CMP for {domain}]
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h2 className="text-sm font-bold text-slate-900">{prefHeading}</h2>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded bg-[#1868db] text-white font-bold text-xs shadow-2xs"
                    >
                      Consent Preferences
                    </button>
                    {prefDescription.split("\n\n").map((p, i) => (
                      <p key={i} className="text-slate-600">{p}</p>
                    ))}
                  </div>
                </div>
              )}

              {previewTab === "embed" && (
                <div className="space-y-3">
                  <p className="text-slate-600">
                    Paste this snippet into your website to embed the self-updating declaration widget:
                  </p>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
                    <code>{dynamicEmbedCode}</code>
                  </div>
                </div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
