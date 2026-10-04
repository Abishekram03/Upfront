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
            <strong className="font-bold text-neutral-900 tracking-tight">UpFront</strong> is a lightweight, cookieless Google Analytics alternative. Get an intuitive single-page dashboard for free, and toggle on our built-in <strong className="text-neutral-900 font-semibold">$10/mo Consent Manager</strong> whenever you need to gate marketing scripts.
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
      </div>
    </section>
  )
}
