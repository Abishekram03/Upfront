import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-white">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f5f5f5_1px,transparent_1px),linear-gradient(to_bottom,#f5f5f5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1 text-xs font-medium text-neutral-800 shadow-xs mb-6">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Privacy Analytics + Integrated Consent Manager</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl text-balance">
            Simple, privacy-friendly website analytics.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg leading-relaxed text-neutral-600 text-balance">
            <strong className="font-[family-name:var(--font-ojuju)] text-xl font-bold text-neutral-900 tracking-tight">Userly</strong> is a lightweight, cookieless Google Analytics alternative. Get an intuitive single-page dashboard for free, and toggle on our built-in <strong className="text-neutral-900 font-semibold">$10/mo Consent Manager</strong> whenever you need to gate marketing scripts.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 px-6 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium shadow-sm w-full sm:w-auto inline-flex items-center justify-center"
              )}
            >
              Start Free Trial <ArrowRight className="ml-2 size-4" />
            </Link>
            <Link
              href="/analytics"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-6 rounded-lg border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-medium w-full sm:w-auto inline-flex items-center justify-center"
              )}
            >
              View Live Demo
            </Link>
          </div>

          {/* Key Value Points */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>No cookies or IP tracking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="size-4 text-amber-500" />
              <span>Under 3KB lightweight script</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-blue-600" />
              <span>Privacy-first & cookieless by design</span>
            </div>
          </div>
        </div>

        {/* Mock Live Dashboard Preview Graphic */}
        <div id="demo" className="mt-16 rounded-2xl border border-neutral-200/90 bg-white p-2 shadow-xl shadow-neutral-200/50">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-6">
            {/* Dashboard Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
              <div className="flex items-center gap-3">
                <div>
                  <span className="font-[family-name:var(--font-ojuju)] text-lg font-bold text-neutral-900 block tracking-tight">
                    Userly
                  </span>
                  <p className="text-xs text-neutral-500">userly.io · Real-time Privacy Analytics</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>24 current visitors</span>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-2xs">
                  Last 30 days
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-neutral-200">
              <div className="space-y-1">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Unique Visitors</span>
                <p className="text-2xl font-bold text-neutral-900">18.4k</p>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+14.2%</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Pageviews</span>
                <p className="text-2xl font-bold text-neutral-900">54.2k</p>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+18.0%</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Bounce Rate</span>
                <p className="text-2xl font-bold text-neutral-900">32.8%</p>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">-4.1%</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Avg Duration</span>
                <p className="text-2xl font-bold text-neutral-900">2m 45s</p>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+12s</span>
              </div>
            </div>

            {/* Drilldown Columns Mock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 pb-3 border-b border-neutral-100">
                  <span>Top Pages</span>
                  <span>Visitors</span>
                </div>
                <div className="space-y-2 mt-3 text-xs">
                  <div className="flex items-center justify-between py-1">
                    <span className="font-mono text-neutral-800">/</span>
                    <span className="font-semibold text-neutral-900">10,420</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-mono text-neutral-800">/pricing</span>
                    <span className="font-semibold text-neutral-900">4,190</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-mono text-neutral-800">/docs/consent</span>
                    <span className="font-semibold text-neutral-900">2,850</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 pb-3 border-b border-neutral-100">
                  <span>Top Sources</span>
                  <span>Visitors</span>
                </div>
                <div className="space-y-2 mt-3 text-xs">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-neutral-800">Direct / None</span>
                    <span className="font-semibold text-neutral-900">7,230</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-neutral-800">Google Search</span>
                    <span className="font-semibold text-neutral-900">5,810</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-neutral-800">Twitter / X</span>
                    <span className="font-semibold text-neutral-900">3,420</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
