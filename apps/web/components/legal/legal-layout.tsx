"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Shield, ChevronRight, FileText, Lock, Cookie, Server, BookOpen, ArrowLeft } from "lucide-react"
import { LandingNavbar } from "../landing/navbar"
import { LandingFooter } from "../landing/footer"
import { cn } from "@workspace/ui/lib/utils"

interface LegalSection {
  id: string
  title: string
}

interface LegalLayoutProps {
  title: string
  subtitle: string
  lastUpdated: string
  effectiveDate: string
  sections: LegalSection[]
  currentSlug: "privacy" | "terms" | "cookies" | "subprocessors"
  children: React.ReactNode
}

export function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  effectiveDate,
  sections,
  currentSlug,
  children,
}: LegalLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || "")

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120
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

  const navLinks = [
    { slug: "privacy", label: "Privacy Policy", icon: Lock, href: "/privacy" },
    { slug: "terms", label: "Terms of Service", icon: FileText, href: "/terms" },
    { slug: "cookies", label: "Cookie Policy", icon: Cookie, href: "/cookies" },
    { slug: "subprocessors", label: "Subprocessors", icon: Server, href: "/subprocessors" },
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <LandingNavbar />

      {/* Hero Header */}
      <div className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50/70 to-white pt-12 pb-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <ChevronRight className="size-3 text-slate-400" />
            <span className="text-[#1868db]">Legal & Compliance</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              <span className="text-slate-400">Last updated:</span> {lastUpdated}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              <span className="text-slate-400">Effective date:</span> {effectiveDate}
            </span>
          </div>

          {/* Quick tab switcher */}
          <div className="mt-8 flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
            {navLinks.map((tab) => {
              const Icon = tab.icon
              const isActive = currentSlug === tab.slug
              return (
                <Link
                  key={tab.slug}
                  href={tab.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    isActive
                      ? "bg-[#1868db] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  )}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content & Table of Contents */}
      <div className="mx-auto max-w-6xl px-6 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Table of Contents Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 pb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <FileText className="size-3.5 text-[#1868db]" />
                Contents
              </div>
              <nav className="space-y-1">
                {sections.map((section) => {
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
                        "block px-3 py-1.5 rounded-md text-xs font-medium transition-colors border-l-2 leading-snug",
                        isActive
                          ? "border-[#1868db] bg-blue-50/70 text-[#1868db] font-semibold"
                          : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      {section.title}
                    </a>
                  )
                })}
              </nav>

              <div className="pt-4 border-t border-slate-200">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Shield className="size-3.5 text-[#1868db]" />
                    Legal Notice
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    UpFront provides software tools for privacy consent management and cookieless web analytics. The Service does not constitute legal advice.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Document Content */}
          <main className="lg:col-span-8 prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-xl prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 prose-h2:mt-10 prose-h3:text-base prose-h3:mt-6 prose-p:text-sm prose-p:leading-relaxed prose-p:text-slate-600 prose-li:text-sm prose-li:text-slate-600 prose-strong:text-slate-900 prose-a:text-[#1868db] prose-a:no-underline hover:prose-a:underline">
            {children}
          </main>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
