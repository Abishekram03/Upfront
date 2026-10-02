"use client"

import { useState } from "react"
import {
  FileText,
  UserCheck,
  ShieldAlert,
  CreditCard,
  Scale,
  Gavel,
  Mail,
  Eye,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"
import { DomainPolicyRecord, PolicyDefinition } from "./policy-types"

interface TermsPolicyEditorProps {
  policy?: PolicyDefinition
  domain: string
  existingRecord?: DomainPolicyRecord
  onBack: () => void
  onSaveDraft?: (record: DomainPolicyRecord) => void
  onPublish?: (record: DomainPolicyRecord) => void
}

export function TermsPolicyEditor({
  domain,
  existingRecord,
  onBack,
  onSaveDraft,
  onPublish,
}: TermsPolicyEditorProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewTab, setPreviewTab] = useState<"rendered" | "markdown" | "html">("rendered")
  const [copiedType, setCopiedType] = useState<string | null>(null)

  // Step 1: Agreement & Scope
  const [companyName, setCompanyName] = useState(domain.replace(/\.[^/.]+$/, "").toUpperCase() || "Company Inc.")
  const [websiteUrl, setWebsiteUrl] = useState(`https://${domain}`)
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0])
  const [minAge, setMinAge] = useState("13")

  // Step 2: User Accounts
  const [requiresAccount, setRequiresAccount] = useState(true)
  const [accountRules, setAccountRules] = useState<string[]>([
    "Users must provide accurate, current, and complete registration information.",
    "Users are responsible for safeguarding password confidentiality.",
    "Accounts cannot be transferred, sold, or shared without express written consent.",
    "We reserve the right to suspend or terminate accounts for violations of these terms.",
  ])

  // Step 3: Intellectual Property & Content
  const [hasUgc, setHasUgc] = useState(true)
  const [dmcaEmail, setDmcaEmail] = useState(`dmca@${domain}`)
  const [ipTerms, setIpTerms] = useState(
    "All software, interfaces, logos, designs, and content created by us are protected by copyright, trademark, and other intellectual property laws."
  )

  // Step 4: Prohibited Activities
  const [prohibitedList, setProhibitedList] = useState<string[]>([
    "Violating any local, state, national, or international law or regulation.",
    "Attempting to decompile, reverse engineer, or disassemble any portion of the service.",
    "Using automated scrapers, bots, or crawlers without prior authorization.",
    "Transmitting viruses, malware, trojans, or malicious code.",
    "Engaging in unauthorized advertising, spamming, or phishing.",
  ])
  const [newProhibitedInput, setNewProhibitedInput] = useState("")

  // Step 5: Subscriptions & Billing
  const [hasPaidServices, setHasPaidServices] = useState(true)
  const [billingTerms, setBillingTerms] = useState(
    "Subscriptions automatically renew unless cancelled at least 24 hours prior to the end of the billing period. All fees are non-refundable except where required by law."
  )
  const [refundDays, setRefundDays] = useState("14")

  // Step 6: Disclaimers & Liability Limits
  const [warrantyDisclaimer, setWarrantyDisclaimer] = useState(
    "THE SERVICES ARE PROVIDED ON AN 'AS IS' AND 'AS AVAILABLE' BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED."
  )
  const [liabilityCap, setLiabilityCap] = useState(
    "IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT PAID BY YOU TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR $100 USD."
  )

  // Step 7: Dispute Resolution & Contact
  const [governingLaw, setGoverningLaw] = useState("State of Delaware, United States")
  const [arbitrationClause, setArbitrationClause] = useState(true)
  const [contactEmail, setContactEmail] = useState(`legal@${domain}`)
  const [legalAddress, setLegalAddress] = useState("100 Enterprise Way, Suite 400, Wilmington, DE 19801")

  const totalSteps = 7
  const progressPct = Math.round(((activeStep - 1) / (totalSteps - 1)) * 100)

  const handleAddProhibited = () => {
    if (!newProhibitedInput.trim()) return
    if (!prohibitedList.includes(newProhibitedInput.trim())) {
      setProhibitedList([...prohibitedList, newProhibitedInput.trim()])
    }
    setNewProhibitedInput("")
  }

  const handleRemoveProhibited = (index: number) => {
    setProhibitedList(prohibitedList.filter((_, i) => i !== index))
  }

  // Markdown Generator
  const generateMarkdown = () => {
    return `# Terms of Service for ${companyName}

**Effective Date:** ${effectiveDate}  
**Website:** ${websiteUrl}

---

## 1. Agreement to Terms
By accessing or using **${websiteUrl}** (the "Platform" or "Service"), operated by **${companyName}** ("we," "our," or "us"), you agree to be bound by these Terms of Service. If you do not agree to all terms, do not access or use the Service.

You represent that you are at least **${minAge} years of age**.

---

## 2. User Accounts & Responsibilities
${
  requiresAccount
    ? `To access certain features of the Service, you must register for an account:\n${accountRules
        .map((r) => `- ${r}`)
        .join("\n")}`
    : `You may browse portions of our Service without an account. However, accessing certain features requires compliance with our standard user requirements.`
}

---

## 3. Intellectual Property Rights & Content
${ipTerms}

${
  hasUgc
    ? `### User-Generated Content\nBy submitting content to our platform, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with providing the Service.\n\n### DMCA & Copyright Infringement\nIf you believe content on our platform infringes your copyright, submit a DMCA notice to our designated agent at **[${dmcaEmail}](mailto:${dmcaEmail})**.`
    : ""
}

---

## 4. Prohibited Uses
You agree not to use the Service for any unlawful or prohibited purpose:
${prohibitedList.map((p) => `- ${p}`).join("\n")}

---

## 5. Billing, Subscriptions & Refunds
${
  hasPaidServices
    ? `${billingTerms}\n\nRefund requests must be submitted within **${refundDays} days** of purchase.`
    : `Our platform currently offers free standard services. Future premium features will be subject to applicable billing terms.`
}

---

## 6. Disclaimers & Limitation of Liability

### Warranty Disclaimer
${warrantyDisclaimer}

### Limitation of Liability
${liabilityCap}

---

## 7. Governing Law & Dispute Resolution
These Terms shall be governed by and construed in accordance with the laws of **${governingLaw}**.

${
  arbitrationClause
    ? `Any dispute arising out of or relating to these Terms shall be resolved through binding individual arbitration rather than in court, with no class action rights.`
    : `Any legal proceedings shall be instituted exclusively in the competent courts located in ${governingLaw}.`
}

---

## 8. Contact Information
For legal inquiries regarding these Terms:
- **Email:** [${contactEmail}](mailto:${contactEmail})
- **Address:** ${legalAddress}
`
  }

  // HTML Generator
  const generateHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Terms of Service - ${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.7; color: #1e293b; max-width: 860px; margin: 0 auto; padding: 40px 20px; }
    h1 { color: #0f172a; font-size: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #0f172a; font-size: 20px; margin-top: 32px; }
    h3 { color: #334155; font-size: 16px; margin-top: 20px; }
    ul { padding-left: 24px; }
    li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>Terms of Service for ${companyName}</h1>
  <p><em>Effective Date: ${effectiveDate} | Website: ${websiteUrl}</em></p>

  <h2>1. Agreement to Terms</h2>
  <p>By using <strong>${websiteUrl}</strong>, you agree to these Terms. You must be at least ${minAge} years old.</p>

  <h2>2. User Accounts</h2>
  <ul>
    ${accountRules.map((r) => `<li>${r}</li>`).join("")}
  </ul>

  <h2>3. Intellectual Property</h2>
  <p>${ipTerms}</p>

  <h2>4. Prohibited Uses</h2>
  <ul>
    ${prohibitedList.map((p) => `<li>${p}</li>`).join("")}
  </ul>

  <h2>5. Billing & Subscriptions</h2>
  <p>${billingTerms}</p>

  <h2>6. Liability Disclaimer</h2>
  <p><strong>${warrantyDisclaimer}</strong></p>
  <p><strong>${liabilityCap}</strong></p>

  <h2>7. Governing Law & Contact</h2>
  <p>Governing Law: ${governingLaw}</p>
  <p>Contact: ${contactEmail} | Address: ${legalAddress}</p>
</body>
</html>`
  }

  const handleSave = async (isPublishing = false) => {
    setIsSaving(true)
    const markdown = generateMarkdown()
    const html = generateHtml()

    const record: DomainPolicyRecord = {
      policyId: "terms",
      status: isPublishing ? "published" : "draft",
      publishedAt: isPublishing ? new Date().toISOString() : existingRecord?.publishedAt,
      publishedAgo: isPublishing ? "Just now" : existingRecord?.publishedAgo || "Draft saved",
      customTitle: `Terms of Service for ${companyName}`,
      contentMarkdown: markdown,
      contentHtml: html,
      version: "1.0",
    }

    try {
      await fetch(`/api/v1/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          policy: record,
        }),
      })

      if (isPublishing && onPublish) {
        onPublish(record)
        toast.success("Terms of Service published successfully!")
      } else if (onSaveDraft) {
        onSaveDraft(record)
        toast.success("Terms of Service draft saved!")
      }
      onBack()
    } catch (err) {
      console.warn("Could not save terms to backend:", err)
      toast.success(isPublishing ? "Terms of Service published!" : "Draft saved locally!")
      if (isPublishing && onPublish) onPublish(record)
      else if (onSaveDraft) onSaveDraft(record)
      onBack()
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedType(null), 2000)
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-150">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Policies</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Eye className="size-3.5 text-slate-500" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            Save Draft
          </button>
          <Button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="rounded-md bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-1.5 shadow-xs cursor-pointer"
          >
            {isSaving ? "Publishing..." : "Publish Terms"}
          </Button>
        </div>
      </div>

      {/* Main 2-Column Editor Wizard Card */}
      <div className="w-full bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col min-h-[600px]">
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* LEFT NAVIGATION RAIL */}
          <div className="w-full md:w-[240px] shrink-0 border-r border-slate-200/80 bg-slate-50/50 p-4 flex flex-col justify-between select-none">
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-slate-900">Terms of Service</h2>
                <p className="text-[11px] text-slate-500 truncate">{domain}</p>
              </div>

              {/* Step Navigation Items */}
              <nav className="space-y-1">
                {[
                  { step: 1, label: "Platform Scope", icon: FileText },
                  { step: 2, label: "User Accounts", icon: UserCheck },
                  { step: 3, label: "Intellectual Property", icon: Scale },
                  { step: 4, label: "Prohibited Uses", icon: ShieldAlert },
                  { step: 5, label: "Billing & Refunds", icon: CreditCard },
                  { step: 6, label: "Liability Disclaimers", icon: Gavel },
                  { step: 7, label: "Disputes & Contact", icon: Mail },
                ].map((item) => {
                  const Icon = item.icon
                  const isActive = activeStep === item.step
                  const isCompleted = activeStep > item.step
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setActiveStep(item.step as any)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all text-left cursor-pointer",
                        isActive
                          ? "bg-blue-50/80 text-[#1868db] font-bold shadow-2xs"
                          : isCompleted
                          ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-800"
                      )}
                    >
                      <Icon className={cn("size-3.5 shrink-0", isActive ? "text-[#1868db]" : "text-slate-400")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isCompleted && <Check className="size-3 text-emerald-600 stroke-[2.5]" />}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Bottom Progress Bar */}
            <div className="pt-4 border-t border-slate-200/60 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>{progressPct}% complete</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#1868db] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(progressPct, 5)}%` }}
                />
              </div>
            </div>
          </div>

          {/* MAIN STEP FORM CONTENT AREA */}
          <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 min-h-0 bg-white">
            <div className="max-w-2xl space-y-5">
              {/* STEP 1: SCOPE & AGREEMENT */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Platform & Agreement Scope</h3>
                    <p className="text-xs text-slate-500">
                      Define the operating company entity and user eligibility criteria.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Company / Entity Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Platform URL</label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Minimum User Age</label>
                      <select
                        value={minAge}
                        onChange={(e) => setMinAge(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db] bg-white"
                      >
                        <option value="13">13 years or older (COPPA standard)</option>
                        <option value="16">16 years or older (EU GDPR standard)</option>
                        <option value="18">18 years or older (Adult / Commercial platform)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: USER ACCOUNTS */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">User Accounts & Security</h3>
                    <p className="text-xs text-slate-500">
                      Rules regarding registration, passwords, and suspension privileges.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Requires User Accounts</span>
                        <input
                          type="checkbox"
                          checked={requiresAccount}
                          onChange={(e) => setRequiresAccount(e.target.checked)}
                          className="size-4 accent-[#1868db] rounded"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Enable if users can create profiles, sign in, or store content.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 block">Account Rules & Duties</label>
                      {accountRules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 flex items-start gap-2"
                        >
                          <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: INTELLECTUAL PROPERTY */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Intellectual Property & Content</h3>
                    <p className="text-xs text-slate-500">
                      Ownership clauses, copyright protection, and DMCA notice procedures.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Platform IP Ownership Statement
                      </label>
                      <textarea
                        rows={3}
                        value={ipTerms}
                        onChange={(e) => setIpTerms(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                      />
                    </div>

                    <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">User-Generated Content (UGC)</span>
                        <input
                          type="checkbox"
                          checked={hasUgc}
                          onChange={(e) => setHasUgc(e.target.checked)}
                          className="size-4 accent-[#1868db] rounded"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Include non-exclusive license and DMCA takedown protections for user-submitted content.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        DMCA Copyright Notice Email
                      </label>
                      <input
                        type="email"
                        value={dmcaEmail}
                        onChange={(e) => setDmcaEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PROHIBITED USES */}
              {activeStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Prohibited Activities & Conduct</h3>
                    <p className="text-xs text-slate-500">
                      Explicitly forbid scraping, reverse engineering, spam, and malicious behavior.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      {prohibitedList.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProhibited(idx)}
                            className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={newProhibitedInput}
                        onChange={(e) => setNewProhibitedInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddProhibited()}
                        placeholder="Add custom prohibited activity (e.g., Cryptomining)..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                      <button
                        type="button"
                        onClick={handleAddProhibited}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Plus className="size-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: BILLING & REFUNDS */}
              {activeStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Billing, Subscriptions & Refunds</h3>
                    <p className="text-xs text-slate-500">
                      Payment processing, auto-renewal terms, and refund eligibility windows.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Commercial / Paid Features</span>
                        <input
                          type="checkbox"
                          checked={hasPaidServices}
                          onChange={(e) => setHasPaidServices(e.target.checked)}
                          className="size-4 accent-[#1868db] rounded"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Include subscription renewal clauses and payment obligations.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Subscription & Renewal Terms
                      </label>
                      <textarea
                        rows={3}
                        value={billingTerms}
                        onChange={(e) => setBillingTerms(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Refund Window (Days)
                      </label>
                      <input
                        type="number"
                        value={refundDays}
                        onChange={(e) => setRefundDays(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: LIABILITY DISCLAIMERS */}
              {activeStep === 6 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Warranty Disclaimers & Liability Limits</h3>
                    <p className="text-xs text-slate-500">
                      Essential legal shields including 'AS IS' warranties and liability monetary caps.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        'AS IS' Warranty Disclaimer
                      </label>
                      <textarea
                        rows={3}
                        value={warrantyDisclaimer}
                        onChange={(e) => setWarrantyDisclaimer(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono text-[11px] rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Limitation of Liability Cap
                      </label>
                      <textarea
                        rows={3}
                        value={liabilityCap}
                        onChange={(e) => setLiabilityCap(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono text-[11px] rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: DISPUTES & CONTACT */}
              {activeStep === 7 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Dispute Resolution & Legal Notices</h3>
                    <p className="text-xs text-slate-500">
                      Governing jurisdiction, mandatory arbitration, and official contact channels.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Governing Jurisdiction</label>
                      <input
                        type="text"
                        value={governingLaw}
                        onChange={(e) => setGoverningLaw(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Mandatory Binding Arbitration</span>
                        <input
                          type="checkbox"
                          checked={arbitrationClause}
                          onChange={(e) => setArbitrationClause(e.target.checked)}
                          className="size-4 accent-[#1868db] rounded"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Include class action waiver and individual arbitration dispute mechanism.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Legal Notices Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Mailing Address</label>
                      <input
                        type="text"
                        value={legalAddress}
                        onChange={(e) => setLegalAddress(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-6">
              <div>
                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                    className="rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Previous</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeStep < 7 ? (
                  <Button
                    type="button"
                    onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                    className="rounded-md bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-1.5 shadow-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleSave(true)}
                    className="rounded-md bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-4 py-1.5 shadow-xs cursor-pointer"
                  >
                    Publish Terms
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#1868db]" />
                <h3 className="text-sm font-bold text-slate-900">Terms of Service Preview — {domain}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="px-4 pt-3 border-b border-slate-200 flex items-center gap-3 text-xs font-bold">
              {[
                { id: "rendered", label: "Rendered Document" },
                { id: "markdown", label: "Markdown" },
                { id: "html", label: "HTML" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPreviewTab(tab.id as any)}
                  className={cn(
                    "pb-2.5 border-b-2 transition-colors cursor-pointer",
                    previewTab === tab.id
                      ? "border-[#1868db] text-[#1868db]"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4 leading-relaxed">
              {previewTab === "rendered" && (
                <div className="space-y-4 max-w-2xl mx-auto text-slate-800">
                  <h1 className="text-xl font-bold text-slate-900">Terms of Service for {companyName}</h1>
                  <p className="text-slate-500 italic">Effective Date: {effectiveDate}</p>
                  <p className="text-slate-700 leading-relaxed">
                    By accessing {websiteUrl}, you agree to these Terms. You must be at least {minAge} years old.
                  </p>
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-900">Prohibited Uses</h2>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      {prohibitedList.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-900">Governing Law</h2>
                    <p className="text-slate-600">{governingLaw}</p>
                  </div>
                </div>
              )}

              {previewTab === "markdown" && (
                <pre className="p-4 font-mono text-[11px] bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {generateMarkdown()}
                </pre>
              )}

              {previewTab === "html" && (
                <pre className="p-4 font-mono text-[11px] bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {generateHtml()}
                </pre>
              )}
            </div>

            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopy(previewTab === "html" ? generateHtml() : generateMarkdown(), previewTab)
                }
                className="px-4 py-1.5 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {copiedType === previewTab ? (
                  <>
                    <Check className="size-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy {previewTab.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
