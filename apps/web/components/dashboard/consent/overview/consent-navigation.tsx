"use client"

import Link from "next/link"
import { Palette, Cookie, Radar, FileCheck, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModuleCardProps {
  title: string
  description: string
  href: string
  icon: any
  iconBg: string
  iconColor: string
}

function ConsentModuleCard({ title, description, href, icon: Icon, iconBg, iconColor }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border border-slate-200 bg-white p-4.5 shadow-2xs hover:border-[#1868db] hover:shadow-md transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1868db]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("flex size-9 items-center justify-center rounded-[6px] transition-transform group-hover:scale-105", iconBg, iconColor)}>
          <Icon className="size-4.5" />
        </div>
        <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1868db] transition-all" />
      </div>
      <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#1868db] transition-colors">{title}</h3>
      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
        {description}
      </p>
    </Link>
  )
}

export function ConsentNavigation() {
  const cards: ModuleCardProps[] = [
    {
      title: "Banner Studio",
      description: "Customize layouts, colors, copy presets, and live preview your banner.",
      href: "/consent/studio",
      icon: Palette,
      iconBg: "bg-blue-50",
      iconColor: "text-[#1868db]",
    },
    {
      title: "Cookie Manager",
      description: "Review cookie classifications, expiration durations, and script blocking rules.",
      href: "/consent/scanner",
      icon: Cookie,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Automated Scanner",
      description: "Discover active tracking scripts and audit for pre-consent data leaks.",
      href: "/consent/scanner",
      icon: Radar,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Proof Vault",
      description: "Search and export cryptographic consent decision receipts for compliance audits.",
      href: "/consent/logs",
      icon: FileCheck,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <ConsentModuleCard key={card.title} {...card} />
      ))}
    </div>
  )
}
