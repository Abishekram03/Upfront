"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Shield,
  Layers,
  Search,
  FileText,
  Zap,
  Globe,
  Lock,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sliders,
  Sparkles,
  ChevronDown,
  Star,
  Terminal,
  Code2,
  Check,
  Copy,
  Eye,
  BarChart3,
  TrendingUp,
  Activity,
  MousePointerClick,
  Users,
  Clock,
  CheckCircle,
  Play,
  Award,
  Compass,
} from "lucide-react"
import { LandingNavbar } from "./navbar"
import { LandingFooter } from "./footer"
import { cn } from "@workspace/ui/lib/utils"

export function CourseSpaceLanding() {
  const [activeTab, setActiveTab] = useState<"analytics" | "cmp" | "scanner" | "policy">("analytics")
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual")
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [copiedHeroSnippet, setCopiedHeroSnippet] = useState(false)
  const [bannerPreviewType, setBannerPreviewType] = useState<"bar" | "box" | "modal">("bar")

  const copyHeroSnippet = () => {
    navigator.clipboard.writeText('<script defer data-domain="yourdomain.com" src="https://upfront.io/script.js"></script>')
    setCopiedHeroSnippet(true)
    setTimeout(() => setCopiedHeroSnippet(false), 2000)
  }

  const faqs = [
    {
      q: "How does Upfront deliver analytics without cookies?",
      a: "Upfront generates a secure, 24-hour rotating cryptographic hash based on the visitor's IP address and User-Agent. This hash cannot be reverse-engineered or linked across multiple days, making it 100% compliant with GDPR, ePrivacy, and CCPA regulations without setting a single cookie.",
    },
    {
      q: "Does Upfront support Google Consent Mode v2?",
      a: "Yes! Google Consent Mode v2 is built directly into our single script. It automatically manages default consent states and dispatches real-time updates for ad_storage, analytics_storage, ad_user_data, and ad_personalization to Google tags.",
    },
    {
      q: "How does the self-updating Cookie Policy work?",
      a: "When you embed the `<div id=\"usrly-cookie-declaration\"></div>` tag on your /cookie-policy page, our single script automatically injects your live cookie inventory. Whenever our scanner discovers new tracking cookies, your live policy updates immediately with zero code changes.",
    },
    {
      q: "Can I use one script for multiple websites and subdomains?",
      a: "Yes! All Upfront plans support unlimited websites. You can add each domain to your dashboard and manage their banner designs, scan frequencies, and telemetry individually under one account.",
    },
    {
      q: "Will Upfront slow down my website's loading speed?",
      a: "Not at all. The entire Upfront runtime (analytics, banner, and policy engine) is under 4KB gzipped, executes asynchronously with the defer attribute, and is delivered worldwide in under 15ms via 300+ edge CDN locations.",
    },
  ]

  const reviews = [
    {
      name: "Marcus Vance",
      role: "Head of Engineering at Cloudflow",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      content: "Replacing our heavy Cookiebot banner and Google Analytics with Upfront reduced our page load by 1.8 seconds. The cookieless analytics and automatic policy sync are incredible.",
      rating: 5,
      badge: "Verified SaaS",
    },
    {
      name: "Elena Rostova",
      role: "Lead Growth Marketer at Novatech",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      content: "Google Consent Mode v2 worked out of the box with zero config. Our EU compliance audit passed with flying colors, and our team loves the clean, modern dashboard.",
      rating: 5,
      badge: "E-commerce Agency",
    },
    {
      name: "David Chen",
      role: "CTO at Nexus Platforms",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      content: "We manage 25+ client domains in one Upfront workspace. The Banner Studio customization and instant live previews saved our designers dozens of hours.",
      rating: 5,
      badge: "Digital Studio",
    },
  ]

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col font-[family-name:var(--font-dm-sans),sans-serif] text-slate-800 selection:bg-[#1868db]/15 selection:text-[#1868db] antialiased">
      {/* Top Navbar */}
      <LandingNavbar />

      {/* =========================================================================
          HERO SECTION (CourseSpace 2-Column Layered Aesthetic)
         ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-slate-50/60 to-[#fafbfc]">
        {/* CourseSpace Organic Vector Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-tr from-blue-100/35 via-indigo-50/25 to-transparent blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & Value Proposition */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* CourseSpace Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200/80 bg-blue-50/70 text-[#1868db] text-xs font-bold tracking-wide shadow-2xs">
                <Sparkles className="size-3.5 text-[#1868db]" />
                <span>Next-Gen Web Privacy & Telemetry</span>
                <span className="size-1 rounded-full bg-[#1868db]" />
                <span className="text-slate-600 font-medium">Single 4KB Script</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Cookieless Analytics & Consent Management,{" "}
                <span className="bg-gradient-to-r from-[#1868db] via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Unified in One Script.
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Replace 5 expensive compliance and tracking tools. Get real-time privacy analytics, customizable CMP banners, automated cookie scans, and self-updating legal policies in a single snippet.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1868db] hover:bg-[#1559be] text-white font-bold text-sm shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <span>Start Free 14-Day Trial</span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/docs"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-sm shadow-2xs transition-all"
                >
                  <FileText className="size-4 text-[#1868db]" />
                  <span>Developer Docs</span>
                </Link>
              </div>

              {/* Fast Install Code Box */}
              <div className="pt-2">
                <div className="relative rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 p-3.5 shadow-xl text-left max-w-lg mx-auto lg:mx-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-rose-500" />
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span className="ml-2 font-mono text-[11px] text-slate-400">Paste in &lt;head&gt;</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">3.8 KB</span>
                  </div>

                  <div className="pt-2.5 flex items-center justify-between gap-3 font-mono text-[11px] overflow-x-auto">
                    <code className="text-slate-200 whitespace-nowrap">
                      &lt;script defer data-domain=&quot;yourdomain.com&quot; src=&quot;https://upfront.io/script.js&quot;&gt;&lt;/script&gt;
                    </code>
                    <button
                      type="button"
                      onClick={copyHeroSnippet}
                      className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-2 py-1 text-[11px] font-medium text-white transition-colors cursor-pointer border border-white/10"
                    >
                      {copiedHeroSnippet ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          <span className="text-emerald-300">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3 text-slate-300" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Micro Trust Points */}
              <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  100% GDPR & CCPA
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Google Consent Mode v2
                </span>
              </div>
            </div>

            {/* Right Column: CourseSpace Layered Vector Graphic Canvas */}
            <div className="lg:col-span-6 relative">
              {/* Background Decorative Blob */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-indigo-500/10 to-emerald-500/10 rounded-3xl transform rotate-1 scale-105 filter blur-xl -z-10" />

              {/* Main App Window Card */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xl shadow-slate-300/50 space-y-4">
                {/* Header Window Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-rose-400" />
                    <div className="size-3 rounded-full bg-amber-400" />
                    <div className="size-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 ml-2">Upfront Live Monitor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Feed
                    </span>
                  </div>
                </div>

                {/* Live Real-time Telemetry Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Visitors (24h)</div>
                    <div className="text-xl font-extrabold text-slate-900">14,820</div>
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <TrendingUp className="size-3" /> +24.8%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Consent Rate</div>
                    <div className="text-xl font-extrabold text-[#1868db]">96.2%</div>
                    <div className="text-[10px] text-blue-600 font-bold">GDPR Ready</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Cookies Used</div>
                    <div className="text-xl font-extrabold text-emerald-600">0</div>
                    <div className="text-[10px] text-slate-500">100% Cookieless</div>
                  </div>
                </div>

                {/* SVG Visual Chart Illustration */}
                <div className="rounded-xl border border-slate-100 bg-gradient-to-b from-blue-50/40 to-white p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <BarChart3 className="size-3.5 text-[#1868db]" />
                      Real-time Salted Cryptographic Traffic
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">script.js edge</span>
                  </div>

                  {/* SVG Wave Graph */}
                  <svg className="w-full h-24 stroke-[#1868db] fill-blue-500/10" viewBox="0 0 400 100">
                    <defs>
                      <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1868db" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#1868db" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,80 Q50,40 100,60 T200,30 T300,50 T400,20 L400,100 L0,100 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M0,80 Q50,40 100,60 T200,30 T300,50 T400,20"
                      fill="none"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="200" cy="30" r="4" fill="#1868db" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="400" cy="20" r="4" fill="#1868db" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>

                {/* Live Banner Preview Simulator */}
                <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Shield className="size-3.5 text-[#1868db]" />
                      Active CMP Notice (Bottom Bar)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                      Google Consent Mode v2
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    We use cookies and telemetry to analyze traffic and provide personalized content. You can adjust your consent preferences at any time.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded bg-[#1868db] text-white text-[10px] font-bold shadow-2xs">
                      Accept All
                    </span>
                    <span className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold">
                      Reject Non-Essential
                    </span>
                  </div>
                </div>
              </div>

              {/* CourseSpace Floating Badge 1: 5-Star Compliance Badge */}
              <div className="hidden sm:flex absolute -top-5 -left-5 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="size-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Award className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-3 fill-current" />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-slate-900">100% Privacy Compliant</div>
                  <div className="text-[10px] text-slate-500">GDPR • CCPA • LGPD</div>
                </div>
              </div>

              {/* CourseSpace Floating Badge 2: Fast Edge Script Badge */}
              <div className="hidden sm:flex absolute -bottom-5 -right-5 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-500">
                <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Zap className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">3.8 KB Script Size</div>
                  <div className="text-[10px] text-emerald-600 font-bold">⚡ Zero Page Speed Lag</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LOGO CLOUD / SOCIAL PROOF ("Integrated with Modern Web Platforms")
         ========================================================================= */}
      <section className="py-10 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Works with Every Modern Framework, CMS & Platform
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="font-extrabold text-base tracking-tight text-slate-800">Next.js</span>
            <span className="font-extrabold text-base tracking-tight text-slate-800">React</span>
            <span className="font-extrabold text-base tracking-tight text-slate-800">WordPress</span>
            <span className="font-extrabold text-base tracking-tight text-slate-800">Webflow</span>
            <span className="font-extrabold text-base tracking-tight text-slate-800">Shopify</span>
            <span className="font-extrabold text-base tracking-tight text-slate-800">Vercel</span>
            <span className="font-extrabold text-base tracking-tight text-slate-800">Tailwind CSS</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY NUMBERS / IMPACT STATS (CourseSpace Signature Stat Row)
         ========================================================================= */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1868db]">100%</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">Cookieless Telemetry</div>
              <p className="text-[11px] text-slate-500">Zero tracking cookies or persistent storage</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1868db]">&lt; 4 KB</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">Script Payload</div>
              <p className="text-[11px] text-slate-500">Under 15ms global edge CDN delivery</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1868db]">99.99%</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">Global Uptime</div>
              <p className="text-[11px] text-slate-500">Distributed across 300+ edge locations</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1868db]">5-in-1</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">Consolidated Suite</div>
              <p className="text-[11px] text-slate-500">Analytics, CMP, Scanner, Policies, SDK</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CORE FEATURES GRID (CourseSpace Card Grid Aesthetic)
         ========================================================================= */}
      <section id="features" className="py-20 bg-[#fafbfc] border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1868db]">Features & Capabilities</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything Your Website Needs for Privacy & Telemetry
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Consolidate your entire privacy and tracking stack into one high-performance, developer-friendly suite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md hover:border-blue-200 transition-all space-y-3">
              <div className="size-11 rounded-xl bg-blue-100 text-[#1868db] flex items-center justify-center shadow-2xs">
                <Layers className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cookieless Web Analytics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track visitors, pageviews, referrers, bounce rates, and countries without storing personal data or requiring cookie consent for analytics.
              </p>
              <ul className="text-xs text-slate-500 space-y-1 pt-1">
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  24h cryptographic salted hashing
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  Zero cross-site or fingerprint tracking
                </li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md hover:border-blue-200 transition-all space-y-3">
              <div className="size-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                <Shield className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Banner Studio & CMP</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Design custom banners in real time. Choose from bottom bars, floating boxes, or centered modals with custom colors and legal presets.
              </p>
              <ul className="text-xs text-slate-500 space-y-1 pt-1">
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  GDPR, CCPA & LGPD ready
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  Geo-targeting & regional delivery
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md hover:border-blue-200 transition-all space-y-3">
              <div className="size-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-2xs">
                <Search className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Automated Cookie Scanner</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deep-crawls your website to identify first and third-party cookies, LocalStorage objects, and beacons with automatic category classification.
              </p>
              <ul className="text-xs text-slate-500 space-y-1 pt-1">
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  Weekly and monthly scheduled scans
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  Custom category overrides
                </li>
              </ul>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md hover:border-blue-200 transition-all space-y-3">
              <div className="size-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-2xs">
                <FileText className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Dynamic Legal Policies</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate cookie policies and privacy declarations that auto-synchronize with your scanner results directly through your embed snippet.
              </p>
              <ul className="text-xs text-slate-500 space-y-1 pt-1">
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  Dynamic cookie table embed tag
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  Multi-language declaration support
                </li>
              </ul>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md hover:border-blue-200 transition-all space-y-3">
              <div className="size-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                <Globe className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Google Consent Mode v2</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamlessly relays consent signals for ad_storage, analytics_storage, and ad_personalization to Google Analytics 4 and Google Ads tags.
              </p>
              <ul className="text-xs text-slate-500 space-y-1 pt-1">
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  EEA Google Ads mandatory compliance
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  Zero configuration required
                </li>
              </ul>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md hover:border-blue-200 transition-all space-y-3">
              <div className="size-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
                <Lock className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Proof-of-Consent Ledger</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Immutable audit logs capture every user consent decision, timestamp, jurisdiction, and category selection for complete regulatory safety.
              </p>
              <ul className="text-xs text-slate-500 space-y-1 pt-1">
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  1-click regulatory audit exports
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-600" />
                  Global Privacy Control (GPC) support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE PRODUCT DEEP-DIVE (CourseSpace Tabbed Showcase)
         ========================================================================= */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-10">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1868db]">Interactive Deep Dive</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed for Speed, Privacy, and Conversions
            </h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-xl mx-auto mb-12 text-xs overflow-x-auto">
            {[
              { id: "analytics", label: "Web Analytics", icon: Layers },
              { id: "cmp", label: "Banner Studio", icon: Shield },
              { id: "scanner", label: "Cookie Scanner", icon: Search },
              { id: "policy", label: "Policy Embed", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  )}
                >
                  <Icon className={cn("size-3.5", activeTab === tab.id ? "text-[#1868db]" : "text-slate-400")} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              {activeTab === "analytics" && (
                <>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Real-time traffic telemetry without invasive cookies
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Gain clear visibility into pageviews, unique visitors, top referrers, and conversion goals without annoying cookie prompts for pure analytics tracking.
                  </p>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Zero cookie consent required for basic analytics under GDPR.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Custom conversion goals, buttons, and revenue events.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Daily rotating 24h salts protect visitor privacy permanently.</span>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "cmp" && (
                <>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Live Banner Studio with instant preview updates
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Style your cookie banner to match your exact brand identity. Choose custom color hex codes, button radius, typography, and positions without touching code.
                  </p>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Auto-detects EU, US (CCPA), and Brazil (LGPD) visitors.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Strict script auto-blocking prevents marketing tags before consent.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Built-in Google Consent Mode v2 and IAB TCF v2.3 CMP stubs.</span>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "scanner" && (
                <>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Automated deep scanner that audits tracking scripts
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Never worry about non-compliant tracking scripts slipping into your production site. Our crawler scans your entire domain and categorizes trackers automatically.
                  </p>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Audits cookies, Local Storage, Session Storage, and pixels.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Scheduled weekly and monthly automatic compliance re-scans.</span>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "policy" && (
                <>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Dynamic cookie policy tables that update themselves
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Paste a single container tag on your policy page. Upfront automatically injects your live cookie table and keeps it up to date whenever new cookies are detected.
                  </p>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Zero manual document updates or developer maintenance.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Integrated &quot;Revisit Consent Preferences&quot; button.</span>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs"
                >
                  <span>Try Upfront Today</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Visual Panel */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 shadow-sm">
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-900">Live Active Module</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">script.js (active)</span>
                </div>

                {activeTab === "analytics" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-500">Pageviews</div>
                        <div className="text-lg font-extrabold text-slate-900">42,850</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-500">Unique Users</div>
                        <div className="text-lg font-extrabold text-slate-900">18,340</div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-500">Avg Duration</div>
                        <div className="text-lg font-extrabold text-slate-900">2m 45s</div>
                      </div>
                    </div>
                    <div className="h-28 bg-blue-50/50 rounded-xl border border-blue-100/80 flex items-center justify-center text-xs text-[#1868db] font-semibold">
                      📊 Real-time Salted Cryptographic Traffic Graph
                    </div>
                  </div>
                )}

                {activeTab === "cmp" && (
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                    <div className="text-xs font-bold text-slate-900">Cookie Notice Banner (EU / GDPR)</div>
                    <p className="text-[11px] text-slate-600">
                      We value your privacy. Select which categories of cookies and telemetry you wish to allow.
                    </p>
                    <div className="flex gap-2 pt-2">
                      <span className="px-2.5 py-1 rounded bg-[#1868db] text-white text-[10px] font-bold">Accept All</span>
                      <span className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold">Preferences</span>
                    </div>
                  </div>
                )}

                {activeTab === "scanner" && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-slate-800 pb-1 border-b border-slate-100">
                      <span>Cookie Name</span>
                      <span>Category</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="font-mono">_ga</span>
                      <span className="text-blue-600 font-semibold">Analytics</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="font-mono">usrly_consent</span>
                      <span className="text-emerald-600 font-semibold">Necessary</span>
                    </div>
                  </div>
                )}

                {activeTab === "policy" && (
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1">
                    <p className="text-slate-400">&lt;!-- Dynamic Cookie Declaration --&gt;</p>
                    <p className="text-emerald-300">&lt;div id=&quot;usrly-cookie-declaration&quot;&gt;&lt;/div&gt;</p>
                    <p className="text-blue-300">&lt;script defer src=&quot;https://upfront.io/script.js&quot;&gt;&lt;/script&gt;</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CUSTOMER TESTIMONIALS (CourseSpace Clean Review Cards)
         ========================================================================= */}
      <section className="py-20 bg-[#fafbfc] border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1868db]">Social Proof & Feedback</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Trusted by Engineers, Founders & Marketers Worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="size-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1868db] border border-blue-200/60">
                      {rev.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    &ldquo;{rev.content}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <img
                    src={rev.avatar}
                    alt={rev.name}
                    className="size-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{rev.name}</h4>
                    <p className="text-[11px] text-slate-500">{rev.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          TRANSPARENT PRICING CARDS (CourseSpace Clean Pricing Grid)
         ========================================================================= */}
      <section id="pricing" className="py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1868db]">Simple, Predictable Pricing</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Pick the Perfect Plan for Your Growth
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every plan includes unlimited websites and access to our unified single script.
            </p>

            {/* Annual / Monthly Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3 text-xs font-bold">
              <span className={billingPeriod === "monthly" ? "text-slate-900" : "text-slate-500"}>Monthly</span>
              <button
                type="button"
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
                className="w-12 h-6 rounded-full bg-[#1868db] p-0.5 transition-colors cursor-pointer relative"
              >
                <div
                  className={cn(
                    "size-5 rounded-full bg-white transition-transform duration-150 shadow-xs",
                    billingPeriod === "annual" ? "translate-x-6" : "translate-x-0"
                  )}
                />
              </button>
              <span className={billingPeriod === "annual" ? "text-slate-900" : "text-slate-500"}>
                Annual <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] ml-1">Save 20%</span>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Free Tier</h3>
                  <p className="text-xs text-slate-500">Perfect for side projects and personal blogs.</p>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  $0 <span className="text-xs font-semibold text-slate-400">/ forever</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Up to <strong>10,000</strong> pageviews / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Websites</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Cookieless Web Analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Standard Bottom Bar CMP Notice</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full text-center py-3 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all shadow-2xs"
              >
                Get Started Free
              </Link>
            </div>

            {/* Growth Plan (Most Popular) */}
            <div className="p-8 rounded-2xl border-2 border-[#1868db] bg-white shadow-xl shadow-blue-600/10 space-y-6 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#1868db] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                Most Popular
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Growth</h3>
                  <p className="text-xs text-slate-500">For fast-growing startups and businesses.</p>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {billingPeriod === "annual" ? "$15" : "$19"} <span className="text-xs font-semibold text-slate-400">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Up to <strong>100,000</strong> pageviews / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>All Banner Studio Layouts & Custom Colors</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Google Consent Mode v2 & GPC Signals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Automated Monthly Cookie Scanner</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Dynamic Cookie Policy Embed Tag</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full text-center py-3 rounded-full bg-[#1868db] hover:bg-[#1559be] text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Business Plan */}
            <div className="p-8 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Business</h3>
                  <p className="text-xs text-slate-500">For high-traffic portals and digital agencies.</p>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {billingPeriod === "annual" ? "$39" : "$49"} <span className="text-xs font-semibold text-slate-400">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Up to <strong>1,000,000</strong> pageviews / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Weekly Automated Cookie Audits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>IAB TCF v2.3 CMP Certification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Audit Trail Receipts Export (CSV / API)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Priority Support & Custom SLAs</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full text-center py-3 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all shadow-2xs"
              >
                Start Business Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ ACCORDION SECTION (CourseSpace Clean Accordion Style)
         ========================================================================= */}
      <section className="py-20 bg-[#fafbfc]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center space-y-3 mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1868db]">Frequently Asked Questions</div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Have Questions? We Have Answers.
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-slate-900 hover:text-[#1868db] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-slate-400 transition-transform duration-150 shrink-0 ml-4",
                        isOpen ? "transform rotate-180 text-[#1868db]" : ""
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          BOTTOM HIGH-CONVERTING CTA BANNER (CourseSpace Signature Blue Glow)
         ========================================================================= */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1868db] via-blue-600 to-indigo-700 p-8 sm:p-14 text-white shadow-2xl">
            {/* Decorative Glow Circles */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-2xl -z-0 pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/20 rounded-full blur-2xl -z-0 pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold">
                <Sparkles className="size-3.5 text-blue-200" />
                <span>Get Started in Under 2 Minutes</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Upgrade Your Website&apos;s Privacy & Telemetry Today.
              </h2>

              <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                Join thousands of modern websites protecting visitor privacy while gathering high-accuracy telemetry. Start your free trial with zero risk.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#1868db] font-bold text-sm shadow-lg hover:bg-blue-50 transition-all cursor-pointer"
                >
                  <span>Start Free 14-Day Trial</span>
                  <ArrowRight className="size-4" />
                </Link>

                <span className="text-xs text-blue-100">
                  No credit card required • 2-minute setup
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
