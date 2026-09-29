import Link from "next/link"
import Image from "next/image"
import { Shield, Lock, FileText, Cookie, Server, BookOpen, ExternalLink, HelpCircle } from "lucide-react"

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200/80 bg-slate-50 text-slate-600 text-xs">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-slate-200">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="inline-block">
              <Image
                src="/UpFront-Logo-Blue-600.svg"
                alt="UpFront Logo"
                width={120}
                height={32}
                className="h-7 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Privacy-first consent management and cookieless web analytics platform designed to support global privacy compliance without compromising user experience.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-semibold">
                <Shield className="size-3 text-[#1868db]" />
                GDPR & CCPA Ready
              </span>
              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-semibold">
                <Lock className="size-3 text-emerald-600" />
                No Cookies Placed
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#features" className="hover:text-slate-900 transition-colors">
                  Web Analytics
                </Link>
              </li>
              <li>
                <Link href="/#consent" className="hover:text-slate-900 transition-colors">
                  Consent Management (CMP)
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                  Pricing & Plans
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-slate-900 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-slate-900 transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Documentation Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="hover:text-slate-900 transition-colors inline-flex items-center gap-1">
                  Documentation Hub
                </Link>
              </li>
              <li>
                <Link href="/docs#installation" className="hover:text-slate-900 transition-colors">
                  Script Installation
                </Link>
              </li>
              <li>
                <Link href="/docs#gcm-v2" className="hover:text-slate-900 transition-colors">
                  Google Consent Mode v2
                </Link>
              </li>
              <li>
                <Link href="/docs#gpc" className="hover:text-slate-900 transition-colors">
                  Global Privacy Control (GPC)
                </Link>
              </li>
              <li>
                <Link href="/docs#scanner" className="hover:text-slate-900 transition-colors">
                  Cookie Scanner Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Legal & Trust</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-slate-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-slate-900 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/subprocessors" className="hover:text-slate-900 transition-colors">
                  Subprocessors
                </Link>
              </li>
              <li>
                <a href="mailto:privacy@upfront.io" className="hover:text-slate-900 transition-colors">
                  Contact Privacy Team
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimers and Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>
            &copy; {currentYear} UpFront Technologies Inc. All rights reserved.
          </p>
          <p className="text-center md:text-right max-w-lg leading-tight">
            <strong>Disclaimer:</strong> UpFront provides software tools for website analytics and consent management. Use of the Service does not constitute legal advice and does not guarantee regulatory compliance.
          </p>
        </div>
      </div>
    </footer>
  )
}
