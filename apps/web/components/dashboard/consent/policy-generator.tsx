"use client"

import React, { useState, useEffect } from "react"
import { useDomain } from "@/lib/domain-context"
import {
  FileText,
  CheckCircle2,
  Copy,
  Download,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Code2,
  Globe,
  Mail,
  Building,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"

export function PolicyGenerator() {
  const { activeDomain } = useDomain()
  const [currentStep, setCurrentStep] = useState(1)
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedMd, setCopiedMd] = useState(false)

  // Policy Form State
  const [companyName, setCompanyName] = useState("Acme Corporation")
  const [websiteUrl, setWebsiteUrl] = useState(`https://${activeDomain || "example.com"}`)
  const [contactEmail, setContactEmail] = useState("privacy@example.com")
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10))
  const [enableGPCMention, setEnableGPCMention] = useState(true)
  const [enableGCMv2Mention, setEnableGCMv2Mention] = useState(true)

  useEffect(() => {
    if (activeDomain) {
      setWebsiteUrl(`https://${activeDomain}`)
    }
  }, [activeDomain])

  const generatedHtml = `<!-- Cookie Policy -->
<div class="cookie-policy-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Cookie Policy</h1>
  <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">Effective Date: <strong>${effectiveDate}</strong> | Last Updated: <strong>${effectiveDate}</strong></p>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">1. Introduction</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    This Cookie Policy explains how <strong>${companyName}</strong> ("we", "us", or "our") uses cookies and similar tracking technologies on <strong>${websiteUrl}</strong>. It describes what these technologies are, why we use them, and your rights to control our use of them.
  </p>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">2. What Are Cookies?</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    Cookies are small data files placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work efficiently, as well as to provide reporting and analytics information.
  </p>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">3. Cookies Used on Our Website</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    Below is a live, automated audit of the cookies currently detected and classified on our website:
  </p>
  
  <!-- Live Dynamic Cookie Table -->
  <div id="usrly-cookie-declaration" style="margin: 20px 0;"></div>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">4. Managing Your Consent Preferences</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    You can customize or withdraw your cookie consent preferences at any time by clicking the floating <strong>"🍪 Consent"</strong> button located at the bottom of our website. Essential cookies cannot be disabled as they are strictly necessary to deliver core website functionality.
  </p>
  ${
    enableGPCMention
      ? `<p style="font-size: 14px; margin-bottom: 16px;">
    <strong>Global Privacy Control (GPC):</strong> Our website automatically honors Global Privacy Control signals broadcast by your browser, opting you out of non-essential tracking by default.
  </p>`
      : ""
  }

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">5. Contact Us</h2>
  <p style="font-size: 14px;">
    If you have any questions about our use of cookies or privacy practices, please contact our Data Protection Officer at: <a href="mailto:${contactEmail}" style="color: #1868db; text-decoration: underline;">${contactEmail}</a>.
  </p>
</div>`

  const copyHtml = () => {
    navigator.clipboard.writeText(generatedHtml)
    setCopiedHtml(true)
    setTimeout(() => setCopiedHtml(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-[#1868db]" />
          <h2 className="text-base font-bold text-slate-900">Dynamic Cookie Policy Generator</h2>
          <span className="text-xs px-2 py-0.5 rounded-[4px] bg-blue-50 text-[#1868db] font-bold border border-blue-200">
            GDPR & CCPA Compliant
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Generate an auto-updating legal Cookie Policy for <strong className="text-slate-700">{activeDomain || "your site"}</strong> with live embedded audit tables.
        </p>

        {/* Wizard Steps */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          {[
            { step: 1, label: "1. Company Info" },
            { step: 2, label: "2. Compliance Rules" },
            { step: 3, label: "3. Policy Preview & Embed" },
          ].map((s) => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={cn(
                "flex-1 py-2 px-3 text-xs font-bold rounded-[4px] border text-center transition-all cursor-pointer",
                currentStep === s.step
                  ? "bg-[#1868db] text-white border-[#1868db]"
                  : currentStep > s.step
                  ? "bg-slate-50 text-slate-700 border-slate-200"
                  : "bg-white text-slate-400 border-slate-200"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Company Info */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="size-4 text-[#1868db]" />
            Organization & Website Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company / Organization Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Website URL</label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Privacy / DPO Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={() => setCurrentStep(2)}
              className="bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-2 rounded-[4px] flex items-center gap-1.5 cursor-pointer"
            >
              Next: Compliance Rules <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Compliance Rules */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#1868db]" />
            Regulatory Disclosure Standards
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 p-3 rounded border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={enableGPCMention}
                onChange={(e) => setEnableGPCMention(e.target.checked)}
                className="size-4 mt-0.5 rounded text-[#1868db]"
              />
              <div>
                <span className="font-bold text-slate-800 block">Global Privacy Control (GPC) Clause</span>
                <span className="text-slate-500 text-[11px]">
                  Explicitly states that your website respects the browser-level GPC opt-out signal as required under CCPA/CPRA.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={enableGCMv2Mention}
                onChange={(e) => setEnableGCMv2Mention(e.target.checked)}
                className="size-4 mt-0.5 rounded text-[#1868db]"
              />
              <div>
                <span className="font-bold text-slate-800 block">Google Consent Mode v2 Transparency</span>
                <span className="text-slate-500 text-[11px]">
                  Discloses that Google tags dynamically adjust parameter collection based on granular category decisions.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-bold rounded-[4px]"
            >
              <ArrowLeft className="size-3.5 mr-1" /> Back
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              className="bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-2 rounded-[4px] flex items-center gap-1.5 cursor-pointer"
            >
              Generate Policy Preview <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Policy Preview & Embed */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Cookie Policy is Ready</h3>
              <p className="text-xs text-slate-500">
                Copy the HTML or embed the snippet on your <code>/cookie-policy</code> page.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-bold rounded-[4px] h-8"
              >
                Edit Details
              </Button>
              <Button
                onClick={copyHtml}
                className="bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold rounded-[4px] h-8 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedHtml ? <CheckCircle2 className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
                {copiedHtml ? "Copied HTML!" : "Copy Full HTML"}
              </Button>
            </div>
          </div>

          {/* Policy Preview Sandbox */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-2xs">
            <div
              className="prose prose-sm max-w-none text-slate-800"
              dangerouslySetInnerHTML={{ __html: generatedHtml }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
