"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import {
  BookOpen,
  Code2,
  Sliders,
  Search,
  Shield,
  Layers,
  Globe,
  Lock,
  CreditCard,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  FileCode,
  Zap,
  Info,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Command,
  FileText,
  Share2,
  Menu,
  X,
  Compass,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { LandingNavbar } from "../landing/navbar"
import { LandingFooter } from "../landing/footer"
import { cn } from "@workspace/ui/lib/utils"

// ---------------------------------------------------------------------------
// DOCS NAVIGATION STRUCTURE & CONTENT MODEL
// ---------------------------------------------------------------------------

interface DocArticle {
  id: string
  title: string
  category: string
  description: string
  badge?: string
}

interface NavGroup {
  id: string
  title: string
  icon: any
  articles: DocArticle[]
}

const DOCS_NAV_GROUPS: NavGroup[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    articles: [
      { id: "overview", title: "Introduction & Architecture", category: "Getting Started", description: "Learn how Upfront delivers cookieless analytics, CMP, and legal policies via a single script." },
      { id: "quickstart", title: "Quickstart Guide", category: "Getting Started", description: "Get Upfront installed and verified on your website in under 2 minutes." },
      { id: "installation", title: "Script Installation", category: "Getting Started", description: "Embed script.js on plain HTML, Next.js, React, WordPress, Webflow, and Shopify.", badge: "script.js" },
      { id: "verification", title: "Domain Verification", category: "Getting Started", description: "Test and verify your snippet connection to start receiving live telemetry." },
    ],
  },
  {
    id: "consent-cmp",
    title: "Consent Management (CMP)",
    icon: Shield,
    articles: [
      { id: "banner-studio", title: "Banner Studio & Layouts", category: "Consent Management", description: "Configure bottom bars, floating corner boxes, and center modal dialogs." },
      { id: "legal-frameworks", title: "Legal Frameworks (GDPR, CCPA, LGPD)", category: "Consent Management", description: "Preset compliance templates tailored for EU, US California, and Brazil laws." },
      { id: "google-consent-mode", title: "Google Consent Mode v2", category: "Consent Management", description: "Native integration for ad_storage, analytics_storage, ad_user_data, and ad_personalization.", badge: "v2 Ready" },
      { id: "gpc-tcf", title: "GPC & IAB TCF v2.3", category: "Consent Management", description: "Automated Global Privacy Control detection and standardized TCF v2.3 CMP stubs." },
      { id: "script-rules", title: "Script Auto-Blocking Rules", category: "Consent Management", description: "Prevent third-party tracking scripts from running until explicit category consent is given." },
      { id: "geo-targeting", title: "Geo-Targeting & Regional Delivery", category: "Consent Management", description: "Display banners only to EU/US visitors while disabling for exempt jurisdictions." },
    ],
  },
  {
    id: "cookie-scanner",
    title: "Cookie Scanner & Audits",
    icon: Search,
    articles: [
      { id: "scanner-overview", title: "Automated Cookie Scanner", category: "Cookie Scanner", description: "Deep-crawls HTTP cookies, Local Storage, Session Storage, and tracking pixels." },
      { id: "categorization", title: "Cookie Categorization & Overrides", category: "Cookie Scanner", description: "Manage Necessary, Analytics, Functional, Performance, and Advertisement categories." },
      { id: "scheduled-scans", title: "Scheduled Audits & Auto-Sync", category: "Cookie Scanner", description: "Automate weekly and monthly audit crawls to stay compliant with new scripts." },
    ],
  },
  {
    id: "legal-policies",
    title: "Legal Policies Suite",
    icon: FileText,
    articles: [
      { id: "policy-generator", title: "Policy Generator Overview", category: "Legal Policies", description: "Interactive questionnaire wizards for all required website legal policies." },
      { id: "cookie-policy-embed", title: "Cookie Policy Dynamic Embed", category: "Legal Policies", description: "Self-updating cookie declarations rendered automatically via script.js.", badge: "Auto-sync" },
      { id: "privacy-policy", title: "Privacy Policy Builder", category: "Legal Policies", description: "Comprehensive GDPR/CCPA multi-jurisdictional privacy policy generator." },
      { id: "terms-of-service", title: "Terms of Service & EULA", category: "Legal Policies", description: "Standard business terms, acceptable use policies, and software agreements." },
    ],
  },
  {
    id: "web-analytics",
    title: "Cookieless Web Analytics",
    icon: Layers,
    articles: [
      { id: "analytics-overview", title: "Privacy-First Analytics Engine", category: "Web Analytics", description: "Real-time metrics with zero cookies, zero IP logging, and 24h cryptographic salts." },
      { id: "custom-events", title: "Custom Events & Conversions", category: "Web Analytics", description: "Track button clicks, signups, purchases, and custom metadata properties." },
      { id: "metrics-definitions", title: "Metrics & Definitions", category: "Web Analytics", description: "Detailed guide on unique visitors, pageviews, bounce rate, and visit duration." },
    ],
  },
  {
    id: "developer-api",
    title: "Developer API & SDK",
    icon: Code2,
    articles: [
      { id: "javascript-sdk", title: "JavaScript SDK API", category: "Developer API", description: "Programmatic methods on window.Upfront (showBanner, openPreferences, trackEvent)." },
      { id: "collector-api", title: "Edge Event Collector API", category: "Developer API", description: "Direct REST endpoint specifications for /api/v1/event and /api/v1/consent/log." },
      { id: "webhooks-exports", title: "Webhooks & Audit Log Exports", category: "Developer API", description: "Stream consent receipts and telemetry data to external warehouses or webhooks." },
    ],
  },
  {
    id: "billing-support",
    title: "Billing & Resources",
    icon: CreditCard,
    articles: [
      { id: "plans-entitlements", title: "Plans & Feature Matrix", category: "Billing", description: "Overview of Free, Growth, and Business plan capabilities." },
      { id: "troubleshooting", title: "Troubleshooting & FAQs", category: "Support", description: "Common installation questions, ad-blocker guidance, and debugging steps." },
    ],
  },
]

export function DocumentationView() {
  const [activeArticleId, setActiveArticleId] = useState("overview")
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "getting-started": true,
    "consent-cmp": true,
    "cookie-scanner": false,
    "legal-policies": false,
    "web-analytics": false,
    "developer-api": false,
    "billing-support": false,
  })

  // Installation code tab switcher state
  const [installTab, setInstallTab] = useState<"html" | "nextjs" | "react" | "wordpress" | "webflow">("html")

  // Search Dialog State (Cmd+K)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(0)

  // Mobile sidebar drawer
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  // Feedback State
  const [feedbackGiven, setFeedbackGiven] = useState<"yes" | "no" | null>(null)

  // Table of Contents Headings on current page
  const [tocHeadings, setTocHeadings] = useState<{ id: string; title: string; level: number }[]>([])
  const [activeTocId, setActiveTocId] = useState<string>("")

  // Flattened articles for previous / next navigation
  const allArticles = useMemo(() => {
    return DOCS_NAV_GROUPS.flatMap((group) => group.articles)
  }, [])

  const currentArticleIndex = allArticles.findIndex((a) => a.id === activeArticleId)
  const currentArticle = allArticles[currentArticleIndex] || allArticles[0]
  const prevArticle = currentArticleIndex > 0 ? allArticles[currentArticleIndex - 1] : null
  const nextArticle = currentArticleIndex < allArticles.length - 1 ? allArticles[currentArticleIndex + 1] : null

  // Toggle Nav Group Collapse
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  // Keyboard shortcut for Cmd+K Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      } else if (e.key === "Escape") {
        setIsSearchOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Filter articles in search dialog
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return allArticles.slice(0, 8)
    const q = searchQuery.toLowerCase().trim()
    return allArticles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    )
  }, [searchQuery, allArticles])

  // Copy Code Helper
  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeKey(key)
    setTimeout(() => setCopiedCodeKey(null), 2000)
  }

  // Parse Headings inside main content for TOC
  useEffect(() => {
    const articleContainer = document.getElementById("docs-article-body")
    if (articleContainer) {
      const headingElements = articleContainer.querySelectorAll("h2, h3")
      const headings: { id: string; title: string; level: number }[] = []
      headingElements.forEach((el, index) => {
        if (!el.id) {
          el.id = `heading-${index}`
        }
        headings.push({
          id: el.id,
          title: el.textContent || "",
          level: el.tagName === "H2" ? 2 : 3,
        })
      })
      setTocHeadings(headings)
      if (headings[0]) {
        setActiveTocId(headings[0].id)
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
    setFeedbackGiven(null)
  }, [activeArticleId])

  // Scrollspy for TOC
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120
      for (const h of tocHeadings) {
        const el = document.getElementById(h.id)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height + 200) {
            setActiveTocId(h.id)
            break
          }
        }
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [tocHeadings])

  const selectArticle = (id: string) => {
    setActiveArticleId(id)
    setIsMobileNavOpen(false)
    setIsSearchOpen(false)
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col selection:bg-[#1868db]/15 selection:text-[#1868db] font-sans antialiased text-slate-800">
      {/* Top Navbar */}
      <LandingNavbar />

      {/* Nextra-Style Secondary Sub-Header / Breadcrumb Bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/85 backdrop-blur-md">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 h-13 flex items-center justify-between gap-4">
          {/* Left: Mobile Nav Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-1.5 -ml-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation"
            >
              <Menu className="size-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/" className="hover:text-slate-900 transition-colors hidden sm:inline">
                Home
              </Link>
              <ChevronRight className="size-3 text-slate-400 hidden sm:inline" />
              <span className="text-slate-400">Docs</span>
              <ChevronRight className="size-3 text-slate-400" />
              <span className="text-slate-600 font-medium hidden md:inline">{currentArticle?.category}</span>
              <ChevronRight className="size-3 text-slate-400 hidden md:inline" />
              <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs">{currentArticle?.title}</span>
            </div>
          </div>

          {/* Right: Quick Search & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="group flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50 hover:bg-white hover:border-slate-300 text-xs text-slate-500 hover:text-slate-800 transition-all shadow-2xs"
            >
              <Search className="size-3.5 text-slate-400 group-hover:text-[#1868db] transition-colors" />
              <span className="hidden sm:inline">Search documentation...</span>
              <span className="sm:hidden">Search</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>



            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold shadow-2xs transition-all"
            >
              Dashboard
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main 3-Column Nextra Layout */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 flex-1 w-full flex">
        {/* =========================================================================
            LEFT COLUMN: Collapsible Sidebar Tree Navigation
           ========================================================================= */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 lg:bg-transparent lg:static lg:block lg:w-64 xl:w-72 shrink-0 pt-16 lg:pt-8 pb-12 overflow-y-auto transition-transform duration-200 ease-in-out",
            isMobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none"
          )}
        >
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between px-4 pb-4 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Navigation</span>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-3 space-y-5">
            {DOCS_NAV_GROUPS.map((group) => {
              const Icon = group.icon
              const isExpanded = expandedGroups[group.id] ?? true
              const hasActiveChild = group.articles.some((a) => a.id === activeArticleId)

              return (
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                      hasActiveChild ? "text-slate-900 font-extrabold" : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("size-3.5", hasActiveChild ? "text-[#1868db]" : "text-slate-400")} />
                      <span>{group.title}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-3 text-slate-400 transition-transform duration-150",
                        isExpanded ? "transform rotate-0" : "transform -rotate-90"
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="ml-3 pl-2.5 border-l border-slate-200/90 space-y-0.5 pt-0.5">
                      {group.articles.map((article) => {
                        const isActive = activeArticleId === article.id
                        return (
                          <button
                            key={article.id}
                            type="button"
                            onClick={() => selectArticle(article.id)}
                            className={cn(
                              "w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer",
                              isActive
                                ? "bg-blue-50/80 text-[#1868db] font-bold border-l-2 -ml-[11px] pl-[19px] border-[#1868db]"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
                            )}
                          >
                            <span className="truncate">{article.title}</span>
                            {article.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-[#1868db]">
                                {article.badge}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Quick Links Footer in Sidebar */}
            <div className="pt-6 mt-6 border-t border-slate-200 px-2 space-y-2">
              <a
                href="/api/v1/consent/config?domain=example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-xs text-slate-500 hover:text-slate-900 group"
              >
                <span>Live API Sandbox</span>
                <ExternalLink className="size-3 text-slate-400 group-hover:text-slate-700" />
              </a>
              <Link
                href="/privacy"
                className="flex items-center justify-between text-xs text-slate-500 hover:text-slate-900 group"
              >
                <span>Privacy & Security</span>
                <ChevronRight className="size-3 text-slate-400 group-hover:text-slate-700" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop overlay */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* =========================================================================
            CENTER COLUMN: Main Documentation Article
           ========================================================================= */}
        <main className="flex-1 min-w-0 py-8 lg:py-10 lg:px-10 xl:px-12">
          <div className="max-w-3xl" id="docs-article-body">
            {/* Article Header */}
            <div className="pb-6 border-b border-slate-200/90 mb-8 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1868db] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                  {currentArticle?.category}
                </span>
                {currentArticle?.badge && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    {currentArticle.badge}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                {currentArticle?.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-1">
                {currentArticle?.description}
              </p>
            </div>

            {/* Render Active Article Content */}
            {activeArticleId === "overview" && (
              <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                <h2 id="core-architecture" className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Core Architecture: The Single-Script Engine</span>
                </h2>
                <p>
                  UpFront is an integrated web privacy, consent management, and cookieless telemetry platform.
                  Instead of embedding multiple heavy vendor libraries that degrade Core Web Vitals, Upfront unifies:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <Layers className="size-4 text-[#1868db]" />
                      Cookieless Web Analytics
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      Ultra-lightweight real-time visitor metrics without cookies, personal data collection, or cross-site tracking.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <Shield className="size-4 text-emerald-600" />
                      Consent Banner (CMP)
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      Automated GDPR, CCPA/CPRA, LGPD notice banners with Google Consent Mode v2 and IAB TCF v2.3 framework support.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <Search className="size-4 text-purple-600" />
                      Automated Cookie Scanner
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      Continuous browser crawler that categorizes first and third-party trackers with automatic policy synchronization.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <FileText className="size-4 text-amber-600" />
                      Self-Updating Legal Policies
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">
                      Dynamic cookie policies and legal declarations that automatically update on your website with zero code changes.
                    </p>
                  </div>
                </div>

                {/* Callout Box (Nextra style) */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 space-y-1 flex gap-3">
                  <Info className="size-4 text-[#1868db] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-blue-950 block mb-0.5">High Performance & Zero Lag</strong>
                    The entire runtime script is under 4KB compressed, executes asynchronously with the <code>defer</code> attribute, and caches globally across 300+ edge points of presence.
                  </div>
                </div>

                <h2 id="how-it-works" className="text-xl font-bold text-slate-900 pt-4">
                  How It Works in 3 Steps
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 pl-1">
                  <li><strong>Add Your Domain:</strong> Create an Upfront workspace and configure your website domain name.</li>
                  <li><strong>Paste the Snippet:</strong> Drop <code>&lt;script defer src=&quot;https://upfront.io/script.js&quot; data-domain=&quot;yourdomain.com&quot;&gt;&lt;/script&gt;</code> into your site&apos;s <code>&lt;head&gt;</code>.</li>
                  <li><strong>Publish from Studio:</strong> Customize banner styling, legal frameworks, and policy wizards from the dashboard—live visitors automatically receive your updates!</li>
                </ol>
              </div>
            )}

            {activeArticleId === "installation" && (
              <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                <h2 id="install-snippet" className="text-xl font-bold text-slate-900">
                  Universal Script Tag
                </h2>
                <p>
                  Select your framework or platform below to view the recommended integration code:
                </p>

                {/* Framework Tabs Switcher */}
                <div className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                  <div className="flex items-center gap-1 p-1 bg-slate-100/80 border-b border-slate-200 text-xs overflow-x-auto">
                    {[
                      { id: "html", label: "HTML / Static" },
                      { id: "nextjs", label: "Next.js (App Router)" },
                      { id: "react", label: "React / Vite" },
                      { id: "wordpress", label: "WordPress" },
                      { id: "webflow", label: "Webflow / Shopify" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setInstallTab(tab.id as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap",
                          installTab === tab.id
                            ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Code Area */}
                  <div className="relative bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const codeMap: Record<string, string> = {
                          html: '<script defer data-domain="yourdomain.com" src="https://upfront.io/script.js"></script>',
                          nextjs: `// app/layout.tsx\nimport Script from "next/script"\n\nexport default function RootLayout({ children }) {\n  return (\n    <html>\n      <head>\n        <Script\n          defer\n          data-domain="yourdomain.com"\n          src="https://upfront.io/script.js"\n          strategy="afterInteractive"\n        />\n      </head>\n      <body>{children}</body>\n    </html>\n  )\n}`,
                          react: `// index.html\n<head>\n  <script defer data-domain="yourdomain.com" src="https://upfront.io/script.js"></script>\n</head>`,
                          wordpress: `// Add to your active theme functions.php:\nadd_action('wp_head', function() {\n  echo '<script defer data-domain="yourdomain.com" src="https://upfront.io/script.js"></script>';\n});`,
                          webflow: `<!-- Go to Project Settings > Custom Code > Head Code -->\n<script defer data-domain="yourdomain.com" src="https://upfront.io/script.js"></script>`,
                        }
                        copyCode(codeMap[installTab] || "", `install-${installTab}`)
                      }}
                      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
                    >
                      {copiedCodeKey === `install-${installTab}` ? (
                        <>
                          <Check className="size-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 text-slate-300" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {installTab === "html" && (
                      <pre>
                        <code>&lt;script defer data-domain=&quot;yourdomain.com&quot; src=&quot;https://upfront.io/script.js&quot;&gt;&lt;/script&gt;</code>
                      </pre>
                    )}
                    {installTab === "nextjs" && (
                      <pre className="text-slate-300">
                        <code>{`// app/layout.tsx
import Script from "next/script"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          defer
          data-domain="yourdomain.com"
          src="https://upfront.io/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}`}</code>
                      </pre>
                    )}
                    {installTab === "react" && (
                      <pre>
                        <code>{`<!-- index.html -->
<head>
  <script defer data-domain="yourdomain.com" src="https://upfront.io/script.js"></script>
</head>`}</code>
                      </pre>
                    )}
                    {installTab === "wordpress" && (
                      <pre>
                        <code>{`// functions.php
add_action('wp_head', function() {
  echo '<script defer data-domain="yourdomain.com" src="https://upfront.io/script.js"></script>';
});`}</code>
                      </pre>
                    )}
                    {installTab === "webflow" && (
                      <pre>
                        <code>{`<!-- Project Settings > Custom Code > Head Code -->
<script defer data-domain="yourdomain.com" src="https://upfront.io/script.js"></script>`}</code>
                      </pre>
                    )}
                  </div>
                </div>

                <h2 id="script-attributes" className="text-xl font-bold text-slate-900 pt-4">
                  Supported Script Attributes
                </h2>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
                      <tr>
                        <th className="p-3">Attribute</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Required</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="p-3 font-mono font-bold text-[#1868db]">data-domain</td>
                        <td className="p-3 font-mono text-slate-500">string</td>
                        <td className="p-3 text-emerald-600 font-bold">Recommended</td>
                        <td className="p-3">Your registered domain (e.g. <code>acme.com</code>). Defaults to <code>window.location.hostname</code> if omitted.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-[#1868db]">data-api</td>
                        <td className="p-3 font-mono text-slate-500">url</td>
                        <td className="p-3 text-slate-400">Optional</td>
                        <td className="p-3">Custom proxy or telemetry ingestion endpoint URL for first-party tracking setups.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-[#1868db]">defer</td>
                        <td className="p-3 font-mono text-slate-500">boolean</td>
                        <td className="p-3 text-emerald-600 font-bold">Yes</td>
                        <td className="p-3">Ensures non-blocking asynchronous execution without slowing down First Contentful Paint.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeArticleId === "google-consent-mode" && (
              <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                <h2 id="gcm-overview" className="text-xl font-bold text-slate-900">
                  Google Consent Mode v2 Integration
                </h2>
                <p>
                  UpFront provides native, zero-configuration support for Google Consent Mode v2. When activated in the Banner Studio, the script automatically manages default consent states before Google tags execute, and dispatches updates when visitors make selections.
                </p>

                {/* Callout */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 flex gap-3">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-emerald-950 block mb-0.5">EU User Consent Policy Mandatory Compliance</strong>
                    Google requires Consent Mode v2 for all websites running Google Ads, Google Analytics 4, and Floodlight tags targeting European Economic Area (EEA) visitors.
                  </div>
                </div>

                <h2 id="consent-signals" className="text-xl font-bold text-slate-900 pt-4">
                  Mapped Consent Parameters
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <code className="text-xs font-bold text-slate-900">ad_storage</code>
                    <p className="text-[11px] text-slate-500">Controls cookie storage related to advertising.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <code className="text-xs font-bold text-slate-900">analytics_storage</code>
                    <p className="text-[11px] text-slate-500">Controls cookie storage related to analytics.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <code className="text-xs font-bold text-slate-900">ad_user_data</code>
                    <p className="text-[11px] text-slate-500">Signals consent for sending user data to Google for online advertising.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                    <code className="text-xs font-bold text-slate-900">ad_personalization</code>
                    <p className="text-[11px] text-slate-500">Controls remarketing and personalized advertising delivery.</p>
                  </div>
                </div>
              </div>
            )}

            {activeArticleId === "cookie-policy-embed" && (
              <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                <h2 id="policy-embed" className="text-xl font-bold text-slate-900">
                  Dynamic Self-Updating Cookie Declarations
                </h2>
                <p>
                  Instead of copying and pasting static cookie tables that quickly become outdated, Upfront allows you to embed a dynamic container tag on your <code>/cookie-policy</code> page.
                </p>

                <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto space-y-1 border border-slate-800">
                  <p className="text-slate-400">&lt;!-- Upfront Dynamic Cookie Declaration --&gt;</p>
                  <p className="text-emerald-300">&lt;div id=&quot;usrly-cookie-declaration&quot; data-domain=&quot;yourdomain.com&quot;&gt;&lt;/div&gt;</p>
                  <p className="text-blue-300">&lt;script defer src=&quot;https://upfront.io/script.js&quot;&gt;&lt;/script&gt;</p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex gap-3">
                  <Sparkles className="size-4 text-[#1868db] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-blue-950 block mb-0.5">Automated Monthly Sync</strong>
                    Whenever the automated scanner detects new cookies or modified tracking beacons, the live table on your website updates automatically with zero code editing required.
                  </div>
                </div>
              </div>
            )}

            {/* Fallback for other sections */}
            {!["overview", "installation", "google-consent-mode", "cookie-policy-embed"].includes(activeArticleId) && (
              <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                <h2 id="details" className="text-xl font-bold text-slate-900">
                  {currentArticle?.title} Guide
                </h2>
                <p>
                  {currentArticle?.description}
                </p>

                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Configuration Highlights:</h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-1">
                    <li>Zero dependencies or heavy external frameworks required.</li>
                    <li>Full support for multi-language localization and automated jurisdiction routing.</li>
                    <li>Enterprise-grade cryptographic proof-of-consent ledger with immutable audit timestamps.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Next / Previous Article Pagination Bar (Nextra Style) */}
            <div className="pt-10 mt-12 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevArticle ? (
                <button
                  type="button"
                  onClick={() => selectArticle(prevArticle.id)}
                  className="group flex flex-col items-start p-4 rounded-xl border border-slate-200/90 bg-white hover:border-[#1868db]/60 hover:bg-blue-50/20 text-left transition-all cursor-pointer shadow-2xs"
                >
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#1868db] flex items-center gap-1">
                    <ArrowLeft className="size-3" />
                    Previous
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 pt-1 group-hover:text-[#1868db]">
                    {prevArticle.title}
                  </span>
                </button>
              ) : (
                <div />
              )}

              {nextArticle ? (
                <button
                  type="button"
                  onClick={() => selectArticle(nextArticle.id)}
                  className="group flex flex-col items-end p-4 rounded-xl border border-slate-200/90 bg-white hover:border-[#1868db]/60 hover:bg-blue-50/20 text-right transition-all cursor-pointer shadow-2xs"
                >
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#1868db] flex items-center gap-1">
                    Next
                    <ArrowRight className="size-3" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 pt-1 group-hover:text-[#1868db]">
                    {nextArticle.title}
                  </span>
                </button>
              ) : (
                <div />
              )}
            </div>

            {/* Feedback & GitHub footer */}
            <div className="pt-8 mt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>Was this page helpful?</span>
                {feedbackGiven ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="size-3.5" />
                    Thank you for your feedback!
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFeedbackGiven("yes")}
                      className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center gap-1"
                    >
                      <ThumbsUp className="size-3" />
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackGiven("no")}
                      className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center gap-1"
                    >
                      <ThumbsDown className="size-3" />
                      No
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-slate-400">Upfront Developer Docs</span>
            </div>
          </div>
        </main>

        {/* =========================================================================
            RIGHT COLUMN: "On This Page" / Table of Contents
           ========================================================================= */}
        <aside className="hidden xl:block w-56 shrink-0 pt-10 pb-12">
          <div className="sticky top-20 space-y-3 pr-2">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              On This Page
            </div>
            {tocHeadings.length > 0 ? (
              <nav className="space-y-1 text-xs">
                {tocHeadings.map((h) => {
                  const isActive = activeTocId === h.id
                  return (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" })
                        setActiveTocId(h.id)
                      }}
                      className={cn(
                        "block transition-colors py-0.5 truncate",
                        h.level === 3 ? "pl-3 text-[11px]" : "",
                        isActive
                          ? "text-[#1868db] font-bold"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      {h.title}
                    </a>
                  )
                })}
              </nav>
            ) : (
              <p className="text-xs text-slate-400">Overview</p>
            )}

            <div className="pt-4 border-t border-slate-200/80 space-y-2">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-xs text-slate-500 hover:text-[#1868db] transition-colors flex items-center gap-1"
              >
                <span>Scroll to top</span>
                <ArrowRight className="size-3 transform -rotate-90" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* =========================================================================
          QUICK SEARCH MODAL (Cmd+K)
         ========================================================================= */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSearchOpen(false)}
          />

          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 border-b border-slate-200 bg-slate-50/50">
              <Search className="size-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSearchSelectedIndex(0)
                }}
                placeholder="Search documentation, guides, and API..."
                className="w-full py-3.5 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                autoFocus
              />
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shadow-2xs">
                ESC
              </kbd>
            </div>

            {/* Search Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredSearchResults.length > 0 ? (
                filteredSearchResults.map((article, idx) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => selectArticle(article.id)}
                    onMouseEnter={() => setSearchSelectedIndex(idx)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl flex items-start justify-between gap-3 transition-colors cursor-pointer",
                      searchSelectedIndex === idx ? "bg-blue-50 text-[#1868db]" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{article.title}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {article.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{article.description}</p>
                    </div>
                    <ChevronRight className="size-4 text-slate-300 shrink-0 mt-1" />
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  No documentation found matching &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Navigate: <strong>↑ ↓</strong></span>
                <span>Select: <strong>↵</strong></span>
              </div>
              <span>Upfront Docs v2.4</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
