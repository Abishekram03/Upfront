"use client"

import { ShieldCheck, Construction, Sparkles } from "lucide-react"
import { useDomain } from "@/lib/domain-context"

interface ConsentViewProps {
  domain?: string
}

export function ConsentView({ domain: propDomain }: ConsentViewProps) {
  const { activeDomain } = useDomain()
  const domain = propDomain || activeDomain || "your website"

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Consent Management (CMP)
          </h1>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            In Progress
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          Privacy-first cookie banner studio, script auto-blocking, and proof-of-consent logs for <strong className="text-neutral-700">{domain}</strong>
        </p>
      </div>

      {/* Implementation In Progress Placeholder Card */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-10 shadow-xs text-center">
        <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 shadow-2xs">
            <Construction className="size-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-neutral-900">
              Consent Tool — Implementation in Progress
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              We are actively building the integrated Consent Management Platform. Soon you will be able to customize cookie banners, gate 3rd-party scripts (Meta Pixel, Google Ads), and export GDPR proof-of-consent logs directly from this overview.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-xs font-medium text-neutral-700">
            <Sparkles className="size-3.5 text-amber-500" />
            Coming soon in the next release
          </div>
        </div>
      </div>
    </div>
  )
}
