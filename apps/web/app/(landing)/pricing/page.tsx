import Link from "next/link"
import { Check, Crown, Zap, Shield, ArrowRight, Sparkles } from "lucide-react"
import { LandingNavbar } from "@/components/landing/navbar"

export const metadata = {
  title: "Pricing Plans — UpFront Consent Management & Privacy Analytics",
  description: "Simple, transparent pricing for privacy-first analytics and consent management. Unlimited websites on all plans.",
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <LandingNavbar />

      <main className="flex-1 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Simple, Transparent Packaging</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Privacy analytics & consent management, built to scale.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Unlimited websites on every plan. No surprise quotas, no vendor lock-in.
          </p>
        </div>

        {/* 3-Column Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* 1. Free Plan */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Free</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Starter
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Free</h2>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                Analytics + essential consent management for blogs & startups.
              </p>

              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-sm font-medium text-slate-500 ml-1">/month</span>
              </div>

              <div className="mt-8 space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Analytics & Traffic</div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Unlimited</strong> websites</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>50,000</strong> pageviews/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time privacy analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>3 months analytics history</span>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pt-3 border-t border-slate-100">
                  Consent Management (CMP)
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Consent banner & preference centre</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Banner Studio: Basic customization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cookie scanner (100 pages/scan)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Standard Cookie Policy generator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>30-day Consent Proof history</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/signup"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. Growth Plan */}
          <div className="bg-white rounded-3xl border-2 border-blue-600 p-8 shadow-xl flex flex-col justify-between relative ring-4 ring-blue-600/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-full shadow-sm">
              MOST POPULAR
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Growth</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Growing Teams
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Growth</h2>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                Full consent management and global compliance for growing websites.
              </p>

              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">$19</span>
                <span className="text-sm font-medium text-slate-500 ml-1">/month</span>
              </div>

              <div className="mt-8 space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Everything in Free, plus:</div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span><strong>250,000</strong> pageviews/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>12 months analytics history</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Deep scanner (1,000 pages/scan)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>12-month Consent Proof vault</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Global Privacy Control (GPC) auto-honor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Geo-targeting (EU / UK / Worldwide)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Google Consent Mode v2 integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Full multi-language automatic translations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Monthly scheduled automated scans</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Banner version history & instant rollback</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/signup?plan=growth"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Start with Growth</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 3. Business Plan */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Business</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Enterprise
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Business</h2>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                Advanced compliance, custom design overrides, and higher throughput.
              </p>

              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">$49</span>
                <span className="text-sm font-medium text-slate-500 ml-1">/month</span>
              </div>

              <div className="mt-8 space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Everything in Growth, plus:</div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>1,000,000</strong> pageviews/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>24 months analytics history</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Enterprise scanner (5,000 pages/scan)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>24-month Consent Audit vault</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>IAB TCF v2.3</strong> Framework</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Custom CSS</strong> styling overrides</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Weekly & Daily scheduled scanning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Priority compliance support</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <Link
                href="/signup?plan=business"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Start with Business</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Comparison Highlights */}
        <div className="mt-20 text-center max-w-2xl mx-auto">
          <p className="text-xs text-slate-500">
            🔒 All payments are processed securely via Paddle. Cancel or adjust your subscription anytime from your workspace billing dashboard.
          </p>
        </div>
      </main>
    </div>
  )
}
