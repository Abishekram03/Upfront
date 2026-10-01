"use client"

import React, { useState, useEffect } from "react"
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
  Copy,
  Check,
  ExternalLink,
  Terminal,
  FileCode,
  Zap,
} from "lucide-react"
import { LandingNavbar } from "../landing/navbar"
import { LandingFooter } from "../landing/footer"
import { cn } from "@workspace/ui/lib/utils"

export function DocumentationView() {
  const [copiedScript, setCopiedScript] = useState(false)
  const [activeSection, setActiveSection] = useState("getting-started")

  const sections = [
    { id: "getting-started", title: "Getting Started & Quickstart", icon: Zap },
    { id: "installation", title: "Manual Script Installation", icon: Code2 },
    { id: "analytics-guide", title: "Cookieless Web Analytics", icon: Layers },
    { id: "banner-studio", title: "Banner Studio & Layouts", icon: Sliders },
    { id: "script-rules", title: "Script Rules & Auto-Blocking", icon: FileCode },
    { id: "gcm-v2", title: "Google Consent Mode v2", icon: Globe },
    { id: "gpc-tcf", title: "GPC & IAB TCF v2.3 Framework", icon: Shield },
    { id: "cookie-scanner", title: "Cookie Scanner & Scheduled Audits", icon: Search },
    { id: "proof-of-consent", title: "Proof-of-Consent Audit Trail", icon: Lock },
    { id: "billing-plans", title: "Billing & Plan Entitlements", icon: CreditCard },
    { id: "faq-troubleshooting", title: "Troubleshooting & FAQs", icon: HelpCircle },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [sections])

  const copyScriptCode = () => {
    navigator.clipboard.writeText('<script defer data-domain="yourdomain.com" src="https://upfront.io/script.js"></script>')
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <LandingNavbar />

      {/* Header Banner */}
      <div className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white pt-12 pb-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <ChevronRight className="size-3 text-slate-400" />
            <span className="text-[#1868db]">Developer & Product Docs</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <BookOpen className="size-8 text-[#1868db]" />
            UpFront Documentation
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Everything you need to integrate UpFront cookieless analytics, configure privacy banners, manage cookie policies, and automate compliance workflows.
          </p>
        </div>
      </div>

      {/* Main Documentation Container */}
      <div className="mx-auto max-w-6xl px-6 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Navigation Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 pb-6">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider px-3 pb-1">
                Guides & Specifications
              </div>
              <nav className="space-y-0.5">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" })
                        setActiveSection(section.id)
                      }}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                        isActive
                          ? "bg-blue-50 text-[#1868db] font-bold border border-blue-200/80 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <Icon className={cn("size-3.5 shrink-0", isActive ? "text-[#1868db]" : "text-slate-400")} />
                      <span className="truncate">{section.title}</span>
                    </a>
                  )
                })}
              </nav>

              <div className="pt-4 border-t border-slate-200 mt-4 px-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Terminal className="size-3.5 text-[#1868db]" />
                    Need Support?
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Questions about your integration? Reach out to <a href="mailto:support@upfront.io" className="text-[#1868db] font-semibold hover:underline">support@upfront.io</a>.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Docs Content */}
          <main className="lg:col-span-8 space-y-14">
            {/* 1. GETTING STARTED */}
            <section id="getting-started" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <Zap className="size-3.5" />
                  Quickstart
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">1. Getting Started</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                UpFront is an integrated privacy and web telemetry platform. You can install a single lightweight snippet (&lt; 4KB) on your website to power both <strong>privacy-first cookieless analytics</strong> and a customizable <strong>Consent Management banner</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="size-7 rounded-lg bg-blue-100 text-[#1868db] flex items-center justify-center font-bold text-xs">1</div>
                  <h4 className="text-xs font-bold text-slate-900 pt-1">Create Workspace</h4>
                  <p className="text-[11px] text-slate-500">Add your domain and organize team permissions.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="size-7 rounded-lg bg-blue-100 text-[#1868db] flex items-center justify-center font-bold text-xs">2</div>
                  <h4 className="text-xs font-bold text-slate-900 pt-1">Embed Script</h4>
                  <p className="text-[11px] text-slate-500">Paste the manual snippet into your site&apos;s &lt;head&gt; tag.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="size-7 rounded-lg bg-blue-100 text-[#1868db] flex items-center justify-center font-bold text-xs">3</div>
                  <h4 className="text-xs font-bold text-slate-900 pt-1">Verify & Launch</h4>
                  <p className="text-[11px] text-slate-500">Run instant verification and start capturing telemetry.</p>
                </div>
              </div>
            </section>

            {/* 2. MANUAL SCRIPT INSTALLATION */}
            <section id="installation" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <Code2 className="size-3.5" />
                  Integration
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">2. Manual Script Installation</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Add the following script tag to your website HTML immediately before the closing <code>&lt;/head&gt;</code> tag. Replace <code>yourdomain.com</code> with your actual domain name configured in your UpFront workspace.
              </p>

              {/* Code Snippet Box */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-900 text-slate-100 p-4 shadow-md">
                <button
                  type="button"
                  onClick={copyScriptCode}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
                >
                  {copiedScript ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-slate-300" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <pre className="font-mono text-xs overflow-x-auto pr-24 py-1 text-slate-200 select-all">
                  <code>&lt;script defer data-domain=&quot;yourdomain.com&quot; src=&quot;https://upfront.io/script.js&quot;&gt;&lt;/script&gt;</code>
                </pre>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Script Attributes:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                  <li><code>defer</code>: Ensures the script loads asynchronously without blocking page rendering.</li>
                  <li><code>data-domain</code>: Specifies the domain key associated with your UpFront workspace.</li>
                  <li><code>src</code>: The edge-optimized CDN runtime serving your CMP and telemetry collector.</li>
                </ul>
              </div>
            </section>

            {/* 3. COOKIELESS ANALYTICS */}
            <section id="analytics-guide" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <Layers className="size-3.5" />
                  Analytics Engine
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">3. Cookieless Web Analytics</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                UpFront Web Analytics operates completely without cookies, persistent identifiers, or cross-site tracking. 
                Metrics are aggregated in real-time and provide deep insights into traffic without invading user privacy:
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-1">
                <li><strong>Pageviews & Unique Visitors:</strong> Calculated using daily salted cryptographic hashes that rotate every 24 hours.</li>
                <li><strong>Referrers & Sources:</strong> Identifies search engines, social channels, campaigns, and direct navigation.</li>
                <li><strong>Geographic Heatmap:</strong> Country and city distribution derived in-memory without logging raw IP addresses.</li>
                <li><strong>Devices, OS & Browsers:</strong> Parsed client-side from standard User-Agent headers.</li>
              </ul>
            </section>

            {/* 4. BANNER STUDIO */}
            <section id="banner-studio" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <Sliders className="size-3.5" />
                  Consent Studio
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">4. Banner Studio & Layouts</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                The Banner Studio allows you to customize the layout, legal framework templates, color palettes, typography, and category controls of your cookie notice:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Bottom Bar Layout</h4>
                  <p className="text-[11px] text-slate-500">Unobtrusive full-width bottom bar with quick Accept/Customise buttons.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Floating Box Layout</h4>
                  <p className="text-[11px] text-slate-500">Clean corner badge floating in the bottom-left or bottom-right corner.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Center Modal Popup</h4>
                  <p className="text-[11px] text-slate-500">High-focus centered modal with backdrop blur for strict consent gates.</p>
                </div>
              </div>
            </section>

            {/* 5. SCRIPT RULES */}
            <section id="script-rules" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <FileCode className="size-3.5" />
                  Script Auto-Blocking
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">5. Script Rules & Auto-Blocking</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                UpFront includes dynamic script interception. You can wrap third-party tracking scripts with custom MIME types to prevent them from executing until explicit category consent is granted:
              </p>
              <div className="rounded-xl border border-slate-800 bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-slate-400">// Example: Holding Google Tag Manager until Marketing consent</p>
                <p className="text-blue-300">&lt;script <span className="text-emerald-300">type=&quot;text/plain&quot;</span> <span className="text-purple-300">data-upfront-category=&quot;advertisement&quot;</span> src=&quot;https://www.googletagmanager.com/gtag/js&quot;&gt;&lt;/script&gt;</p>
              </div>
              <p className="text-xs text-slate-500">
                When the visitor clicks &ldquo;Accept All&rdquo; or enables the Advertisement category, the script rule immediately activates the script tag without requiring a page refresh.
              </p>
            </section>

            {/* 6. GOOGLE CONSENT MODE V2 */}
            <section id="gcm-v2" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <Globe className="size-3.5" />
                  Google Ecosystem
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">6. Google Consent Mode v2</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                UpFront natively communicates with Google&apos;s Consent Mode v2 API. When enabled in your Banner Studio, the script automatically manages default states and sends dynamic updates to <code>gtag(&apos;consent&apos;, &apos;update&apos;, ...)</code>:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                <li><code>ad_storage</code>: Tied to the Advertisement category.</li>
                <li><code>analytics_storage</code>: Tied to the Analytics category.</li>
                <li><code>ad_user_data</code>: Signals consent for sending user data to Google for advertising.</li>
                <li><code>ad_personalization</code>: Controls remarketing and personalized ad delivery.</li>
              </ul>
            </section>

            {/* 7. GPC & TCF V2.3 */}
            <section id="gpc-tcf" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <Shield className="size-3.5" />
                  Legal Frameworks
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">7. GPC & IAB TCF v2.3 Framework</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong>Global Privacy Control (GPC):</strong> When enabled on Growth and Business plans, UpFront automatically detects the <code>Sec-GPC</code> header and <code>navigator.globalPrivacyControl</code> signal, ensuring California and global opt-out signals are respected by default.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong>IAB TCF v2.3 CMP Stub:</strong> For publishers monetizing with programmatic advertising, UpFront exposes the standardized <code>window.__tcfapi</code> stub, generating TC Strings for compliant ad exchanges.
              </p>
            </section>

            {/* 8. COOKIE SCANNER */}
            <section id="cookie-scanner" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <Search className="size-3.5" />
                  Auditing Engine
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">8. Cookie Scanner & Scheduled Audits</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our hybrid scanner audits your website to detect HTTP cookies, Local Storage objects, and third-party tracking beacons:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                <li><strong>Manual On-Demand Scan:</strong> Trigger an immediate crawl from the Cookie Scanner tab.</li>
                <li><strong>Scheduled Scans:</strong> On Growth (monthly) and Business (weekly/daily) plans, configure automated recurring audits with timezone and day clamping.</li>
                <li><strong>Manual Overrides:</strong> Custom category reclassifications are preserved across subsequent scans.</li>
              </ul>
            </section>

            {/* 9. PROOF OF CONSENT */}
            <section id="proof-of-consent" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <Lock className="size-3.5" />
                  Audit Trail
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">9. Proof-of-Consent Audit Receipts</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every consent interaction generates an immutable audit receipt in your dashboard. You can search, filter by country, and export proof-of-consent logs to CSV for regulatory audits.
              </p>
            </section>

            {/* 10. BILLING & PLANS */}
            <section id="billing-plans" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <CreditCard className="size-3.5" />
                  Subscriptions
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">10. Billing & Plan Entitlements</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                UpFront offers Free ($0), Growth ($19/mo), and Business ($49/mo) plans processed securely via Paddle. All plans include unlimited website domains with metered monthly pageviews. 
                Upgrade, downgrade, or manage invoices directly in your dashboard <strong>Settings &gt; Billing</strong>.
              </p>
            </section>

            {/* 11. TROUBLESHOOTING */}
            <section id="faq-troubleshooting" className="scroll-mt-24 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1868db] uppercase tracking-wider">
                  <HelpCircle className="size-3.5" />
                  Support
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">11. Troubleshooting & FAQs</h2>
              </div>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <h4 className="font-bold text-slate-900">Why does installation verification fail?</h4>
                  <p>Ensure your site is publicly accessible over HTTPS and that the script is placed inside the <code>&lt;head&gt;</code> tag before any redirect scripts.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <h4 className="font-bold text-slate-900">Can I use UpFront on multiple domains in the same workspace?</h4>
                  <p>Yes! All UpFront plans support unlimited websites. Simply click &ldquo;Add Website&rdquo; in the top navigation bar.</p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
