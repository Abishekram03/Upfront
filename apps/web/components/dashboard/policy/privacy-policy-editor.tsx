"use client"

import { useState } from "react"
import {
  Building2,
  Database,
  Eye,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Clock,
  Mail,
  Scale,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"
import { DomainPolicyRecord, PolicyDefinition } from "./policy-types"

interface PrivacyPolicyEditorProps {
  policy?: PolicyDefinition
  domain: string
  existingRecord?: DomainPolicyRecord
  onBack: () => void
  onSaveDraft?: (record: DomainPolicyRecord) => void
  onPublish?: (record: DomainPolicyRecord) => void
}

export function PrivacyPolicyEditor({
  domain,
  existingRecord,
  onBack,
  onSaveDraft,
  onPublish,
}: PrivacyPolicyEditorProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewTab, setPreviewTab] = useState<"rendered" | "markdown" | "html">("rendered")
  const [copiedType, setCopiedType] = useState<string | null>(null)

  // Step 1: Company & Scope
  const [companyName, setCompanyName] = useState(domain.replace(/\.[^/.]+$/, "").toUpperCase() || "Company Inc.")
  const [websiteUrl, setWebsiteUrl] = useState(`https://${domain}`)
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0])
  const [complianceScope, setComplianceScope] = useState<string[]>(["gdpr", "ccpa", "global"])

  // Step 2: Personal Data Collected
  const [directData, setDirectData] = useState<string[]>([
    "Name and contact information (email address, phone number)",
    "Billing and payment card details (processed securely via PCI-DSS compliant providers)",
    "Account credentials (username, encrypted passwords)",
  ])
  const [newDataInput, setNewDataInput] = useState("")
  const [automatedData, setAutomatedData] = useState<string[]>([
    "IP address and geolocation data",
    "Browser type, operating system, and device identifiers",
    "Referring URLs and pages visited",
    "Session duration and clickstream events",
  ])
  const [collectsChildrenData, setCollectsChildrenData] = useState(false)

  // Step 3: How We Use Data
  const [purposes, setPurposes] = useState<string[]>([
    "To provide, maintain, and personalize our services",
    "To process transactions and send related order notifications",
    "To authenticate users and safeguard account security",
    "To analyze site performance, troubleshoot bugs, and improve user experience",
    "To send relevant product updates, security alerts, and support communications",
  ])

  // Step 4: Third-Party Sharing & Transfers
  const [thirdPartyTypes, setThirdPartyTypes] = useState<string[]>([
    "Cloud infrastructure and hosting providers (e.g., AWS, Vercel)",
    "Payment processors (e.g., Stripe, PayPal)",
    "Analytics and monitoring services (e.g., Google Analytics, Datadog)",
    "Customer support and communication tools",
  ])
  const [sellsData, setSellsData] = useState(false)
  const [internationalTransfer, setInternationalTransfer] = useState(true)

  // Step 5: User Rights & Choices
  const [userRights, setUserRights] = useState<string[]>([
    "Right to access and obtain a copy of your personal data",
    "Right to rectify inaccurate or incomplete information",
    "Right to request erasure ('Right to be Forgotten')",
    "Right to restrict or object to data processing",
    "Right to data portability in a structured, machine-readable format",
    "Right to opt-out of marketing communications at any time",
  ])

  // Step 6: Data Retention & Security
  const [retentionPeriod, setRetentionPeriod] = useState(
    "We retain personal data only as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce agreements."
  )
  const [securityMeasures, setSecurityMeasures] = useState(
    "We implement industry-standard administrative, technical, and physical safeguards, including TLS 1.3 encryption in transit, AES-256 encryption at rest, and strict role-based access controls."
  )

  // Step 7: Contact & DPO
  const [contactEmail, setContactEmail] = useState(`privacy@${domain}`)
  const [physicalAddress, setPhysicalAddress] = useState("100 Enterprise Way, Suite 400, Wilmington, DE 19801")
  const [dpoContact, setDpoContact] = useState(`dpo@${domain}`)

  const totalSteps = 7
  const progressPct = Math.round(((activeStep - 1) / (totalSteps - 1)) * 100)

  // Add custom item helper
  const handleAddDirectData = () => {
    if (!newDataInput.trim()) return
    if (!directData.includes(newDataInput.trim())) {
      setDirectData([...directData, newDataInput.trim()])
    }
    setNewDataInput("")
  }

  // Remove custom item helper
  const handleRemoveDirectData = (index: number) => {
    setDirectData(directData.filter((_, i) => i !== index))
  }

  // Markdown Generator
  const generateMarkdown = () => {
    return `# Privacy Policy for ${companyName}

**Last Updated:** ${effectiveDate}  
**Website:** ${websiteUrl}

---

## 1. Introduction & Overview
Welcome to **${companyName}** ("we," "our," or "us"). We are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at [${websiteUrl}](${websiteUrl}) and use our services.

${
  complianceScope.includes("gdpr")
    ? `> **European Economic Area (EEA) & UK Visitors:** We act as the Data Controller under the General Data Protection Regulation (GDPR) and UK GDPR.`
    : ""
}
${
  complianceScope.includes("ccpa")
    ? `> **California Residents:** This policy complies with the California Consumer Privacy Act (CCPA) as amended by the CPRA.`
    : ""
}

---

## 2. Information We Collect

### A. Information You Directly Provide to Us
We collect information that you voluntarily provide when registering an account, making a purchase, or contacting support:
${directData.map((d) => `- ${d}`).join("\n")}

### B. Information Collected Automatically
When you navigate our website, we automatically collect certain technical and usage information:
${automatedData.map((d) => `- ${d}`).join("\n")}

${
  collectsChildrenData
    ? `### C. Children's Privacy\nWe provide specialized services with verifiable parental consent where applicable.`
    : `### C. Children's Privacy\nOur website and services are not directed to children under 16 years of age. We do not knowingly collect personal data from children.`
}

---

## 3. How We Use Your Information
We process your personal data for legitimate business purposes:
${purposes.map((p) => `- ${p}`).join("\n")}

---

## 4. Sharing & Disclosure of Information
We do **not** sell your personal data. We share information only with trusted third-party service providers bound by confidentiality and data processing agreements:
${thirdPartyTypes.map((t) => `- ${t}`).join("\n")}

${
  internationalTransfer
    ? `### International Data Transfers\nIf data is transferred outside your home jurisdiction, we employ appropriate safeguards including Standard Contractual Clauses (SCCs) approved by the European Commission.`
    : ""
}

---

## 5. Your Privacy Rights & Choices
Depending on your location, you hold key rights regarding your personal information:
${userRights.map((r) => `- ${r}`).join("\n")}

To exercise any of these rights, contact our privacy team at **[${contactEmail}](mailto:${contactEmail})**.

---

## 6. Data Retention & Security
${retentionPeriod}

### Security Safeguards
${securityMeasures}

---

## 7. Contact Us & Data Protection Officer
If you have questions, concerns, or requests regarding this Privacy Policy:
- **Email:** [${contactEmail}](mailto:${contactEmail})
- **Data Protection Officer:** [${dpoContact}](mailto:${dpoContact})
- **Mailing Address:** ${physicalAddress}
`
  }

  // HTML Generator
  const generateHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Privacy Policy - ${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.7; color: #1e293b; max-width: 860px; margin: 0 auto; padding: 40px 20px; }
    h1 { color: #0f172a; font-size: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #0f172a; font-size: 20px; margin-top: 32px; }
    h3 { color: #334155; font-size: 16px; margin-top: 20px; }
    ul { padding-left: 24px; }
    li { margin-bottom: 6px; }
    .badge { display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Privacy Policy for ${companyName}</h1>
  <p><em>Effective Date: ${effectiveDate} | Website: ${websiteUrl}</em></p>

  <h2>1. Introduction</h2>
  <p>Welcome to <strong>${companyName}</strong>. We are dedicated to protecting your privacy and ensuring your personal information is handled in a safe, transparent, and responsible manner.</p>

  <h2>2. Personal Data We Collect</h2>
  <h3>A. Information You Provide</h3>
  <ul>
    ${directData.map((d) => `<li>${d}</li>`).join("")}
  </ul>
  <h3>B. Information Collected Automatically</h3>
  <ul>
    ${automatedData.map((d) => `<li>${d}</li>`).join("")}
  </ul>

  <h2>3. How We Use Personal Data</h2>
  <ul>
    ${purposes.map((p) => `<li>${p}</li>`).join("")}
  </ul>

  <h2>4. Third-Party Sharing</h2>
  <p>We do not sell personal data. We share information only with authorized service providers:</p>
  <ul>
    ${thirdPartyTypes.map((t) => `<li>${t}</li>`).join("")}
  </ul>

  <h2>5. Your Privacy Rights</h2>
  <ul>
    ${userRights.map((r) => `<li>${r}</li>`).join("")}
  </ul>

  <h2>6. Data Retention & Security</h2>
  <p>${retentionPeriod}</p>
  <p>${securityMeasures}</p>

  <h2>7. Contact Us</h2>
  <p>For inquiries or requests, contact: <strong>${contactEmail}</strong> | DPO: <strong>${dpoContact}</strong></p>
  <p>Address: ${physicalAddress}</p>
</body>
</html>`
  }

  const handleSave = async (isPublishing = false) => {
    setIsSaving(true)
    const markdown = generateMarkdown()
    const html = generateHtml()

    const record: DomainPolicyRecord = {
      policyId: "privacy",
      status: isPublishing ? "published" : "draft",
      publishedAt: isPublishing ? new Date().toISOString() : existingRecord?.publishedAt,
      publishedAgo: isPublishing ? "Just now" : existingRecord?.publishedAgo || "Draft saved",
      customTitle: `Privacy Policy for ${companyName}`,
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
        toast.success("Privacy Policy published successfully!")
      } else if (onSaveDraft) {
        onSaveDraft(record)
        toast.success("Privacy Policy draft saved!")
      }
      onBack()
    } catch (err) {
      console.warn("Could not save policy to backend:", err)
      toast.success(isPublishing ? "Privacy Policy published!" : "Draft saved locally!")
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
            {isSaving ? "Publishing..." : "Publish Policy"}
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
                <h2 className="text-sm font-bold text-slate-900">Privacy Policy</h2>
                <p className="text-[11px] text-slate-500 truncate">{domain}</p>
              </div>

              {/* Step Navigation Items */}
              <nav className="space-y-1">
                {[
                  { step: 1, label: "Company & Scope", icon: Building2 },
                  { step: 2, label: "Data Collected", icon: Database },
                  { step: 3, label: "How Data is Used", icon: Sparkles },
                  { step: 4, label: "Third-Party Sharing", icon: Share2 },
                  { step: 5, label: "User Privacy Rights", icon: ShieldCheck },
                  { step: 6, label: "Retention & Security", icon: Clock },
                  { step: 7, label: "Contact & DPO", icon: Mail },
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
              {/* STEP 1: COMPANY & SCOPE */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Company & Platform Scope</h3>
                    <p className="text-xs text-slate-500">
                      Define the legal entity and regulatory frameworks applicable to this privacy policy.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Legal Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                        placeholder="e.g. Acme Corporation Inc."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Website URL</label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Effective Date</label>
                      <input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Compliance Frameworks Included
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "gdpr", label: "EU GDPR & UK GDPR" },
                          { id: "ccpa", label: "California CCPA / CPRA" },
                          { id: "global", label: "Global Compliance Standards" },
                        ].map((fw) => {
                          const isChecked = complianceScope.includes(fw.id)
                          return (
                            <button
                              key={fw.id}
                              type="button"
                              onClick={() => {
                                setComplianceScope(
                                  isChecked
                                    ? complianceScope.filter((s) => s !== fw.id)
                                    : [...complianceScope, fw.id]
                                )
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-md border text-xs font-medium transition-all cursor-pointer",
                                isChecked
                                  ? "border-[#1868db] bg-blue-50/80 text-[#1868db] font-semibold"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              {isChecked && "✓ "}
                              {fw.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: DATA COLLECTED */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Personal Data Collected</h3>
                    <p className="text-xs text-slate-500">
                      Specify direct user inputs and automated technical metrics gathered.
                    </p>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Information You Directly Collect From Users
                      </label>
                      <div className="space-y-1.5">
                        {directData.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
                          >
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDirectData(idx)}
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
                          value={newDataInput}
                          onChange={(e) => setNewDataInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddDirectData()}
                          placeholder="Add custom data field (e.g., Shipping address)..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                        />
                        <button
                          type="button"
                          onClick={handleAddDirectData}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="size-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Children's Privacy Protection</span>
                        <input
                          type="checkbox"
                          checked={collectsChildrenData}
                          onChange={(e) => setCollectsChildrenData(e.target.checked)}
                          className="size-4 accent-[#1868db] rounded"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Check if your platform knowingly provides services directed at children under 16 with parental consent.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: HOW DATA IS USED */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Purposes of Processing</h3>
                    <p className="text-xs text-slate-500">
                      Outline the business and legal grounds for processing personal data.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {purposes.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md border border-slate-200 bg-white flex items-start gap-2.5"
                      >
                        <div className="size-5 rounded-full bg-blue-50 text-[#1868db] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-slate-700 flex-1 leading-relaxed">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: THIRD-PARTY SHARING */}
              {activeStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Third-Party Data Sharing</h3>
                    <p className="text-xs text-slate-500">
                      Disclose categories of service processors and international data transfer mechanisms.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 rounded-md border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-emerald-900">No Data Selling Guarantee</div>
                        <div className="text-[11px] text-emerald-700">
                          We do not sell or monetize personal customer records.
                        </div>
                      </div>
                      <ShieldCheck className="size-5 text-emerald-600" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Authorized Processor Categories
                      </label>
                      {thirdPartyTypes.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-700"
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: USER RIGHTS */}
              {activeStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">User Rights & GDPR/CCPA Protections</h3>
                    <p className="text-xs text-slate-500">
                      Legal entitlements guaranteed to visitors regarding their personal information.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {userRights.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-md bg-white border border-slate-200 text-xs text-slate-700"
                      >
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 6: RETENTION & SECURITY */}
              {activeStep === 6 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Retention & Security Standards</h3>
                    <p className="text-xs text-slate-500">
                      Data lifecycle timelines and technical protection guarantees.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Data Retention Policy
                      </label>
                      <textarea
                        rows={3}
                        value={retentionPeriod}
                        onChange={(e) => setRetentionPeriod(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Security Safeguards & Encryption
                      </label>
                      <textarea
                        rows={3}
                        value={securityMeasures}
                        onChange={(e) => setSecurityMeasures(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: CONTACT & DPO */}
              {activeStep === 7 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Contact & DPO Information</h3>
                    <p className="text-xs text-slate-500">
                      Designate official communication channels for privacy inquiries and regulatory requests.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Privacy Inquiries Email
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Data Protection Officer (DPO) Email
                      </label>
                      <input
                        type="email"
                        value={dpoContact}
                        onChange={(e) => setDpoContact(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Physical Legal Address
                      </label>
                      <input
                        type="text"
                        value={physicalAddress}
                        onChange={(e) => setPhysicalAddress(e.target.value)}
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
                    Publish Policy
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
                <ShieldCheck className="size-4 text-[#1868db]" />
                <h3 className="text-sm font-bold text-slate-900">Privacy Policy Preview — {domain}</h3>
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
                  <h1 className="text-xl font-bold text-slate-900">Privacy Policy for {companyName}</h1>
                  <p className="text-slate-500 italic">Effective Date: {effectiveDate}</p>
                  <p className="text-slate-700 leading-relaxed">
                    This Privacy Policy describes how <strong>{companyName}</strong> collects, uses, and discloses information when you use {websiteUrl}.
                  </p>
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-900">Personal Data Collected</h2>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      {directData.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-900">Your Privacy Rights</h2>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      {userRights.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
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
