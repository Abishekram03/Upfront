"use client"

import { useState } from "react"
import { PolicyDefinition, DomainPolicyRecord } from "./policy-types"
import {
  Sparkles,
  CheckCircle2,
  Shield,
  Eye,
  Copy,
  ArrowRight,
  Check,
  X,
  Sliders,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PolicyWizardModalProps {
  policy: PolicyDefinition | null
  existingRecord?: DomainPolicyRecord
  isOpen: boolean
  onClose: () => void
  onSave: (record: DomainPolicyRecord) => void
}

export function PolicyWizardModal({
  policy,
  existingRecord,
  isOpen,
  onClose,
  onSave,
}: PolicyWizardModalProps) {
  const [activeTab, setActiveTab] = useState<"customize" | "preview">("customize")
  const [copied, setCopied] = useState(false)

  // Form State
  const [companyName, setCompanyName] = useState("Acme Corp")
  const [websiteUrl, setWebsiteUrl] = useState("https://example.com")
  const [supportEmail, setSupportEmail] = useState("legal@example.com")
  const [country, setCountry] = useState("United States")
  const [stateRegion, setStateRegion] = useState("California")
  const [includeGdpr, setIncludeGdpr] = useState(true)
  const [includeCcpa, setIncludeCcpa] = useState(true)
  const [minAge, setMinAge] = useState("13")
  const [returnDays, setReturnDays] = useState("30")

  if (!isOpen || !policy) return null

  const IconComponent = policy.icon

  const generateContent = () => {
    return `# ${policy.name}

**Effective Date:** ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}  
**Website:** [${websiteUrl}](${websiteUrl})  
**Company:** ${companyName} (${country}${stateRegion ? `, ${stateRegion}` : ""})

---

### 1. Overview
Welcome to **${companyName}** ("we," "us," or "our"). This ${policy.name} governs your use of our website located at \`${websiteUrl}\` and all associated applications, services, and digital tools.

${policy.defaultSampleText}

### 2. Information Collection & Usage
We collect information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, or otherwise contact us.
${includeGdpr ? "\n- **GDPR Compliance (EEA/UK):** Under the General Data Protection Regulation, individuals residing in the European Economic Area have the right to access, rectify, port, or erase their personal data." : ""}
${includeCcpa ? "\n- **CCPA / CPRA Compliance (California):** California residents are entitled to request details regarding categories of personal data collected and sold, and have the right to opt-out of data sales." : ""}

### 3. Contact & Inquiries
For any questions, legal requests, or data privacy inquiries regarding this ${policy.name}, please contact our compliance officer at:
- **Email:** ${supportEmail}
- **Website:** ${websiteUrl}
- **Governing Law:** Laws of ${country}${stateRegion ? ` (${stateRegion})` : ""}
`
  }

  const handlePublish = () => {
    const updatedRecord: DomainPolicyRecord = {
      policyId: policy.id,
      status: "published",
      publishedAgo: "Just now",
      publishedAt: new Date().toISOString(),
      version: "v1.0",
      contentMarkdown: generateContent(),
    }
    onSave(updatedRecord)
    onClose()
  }

  const handleSaveDraft = () => {
    const updatedRecord: DomainPolicyRecord = {
      policyId: policy.id,
      status: "draft",
      publishedAgo: "Draft saved",
      publishedAt: new Date().toISOString(),
      version: "v0.1",
      contentMarkdown: generateContent(),
    }
    onSave(updatedRecord)
    onClose()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateContent())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={cn("size-10 rounded-full flex items-center justify-center border shadow-2xs", policy.iconBg, policy.iconColor)}>
              <IconComponent className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {existingRecord?.status === "published" ? "Edit" : "Generate"} {policy.name}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {policy.recommendedFor}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {policy.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-2.5 pb-2 border-b border-slate-100 bg-white flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("customize")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "customize"
                ? "bg-[#1868db] text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Sparkles className="size-3.5" />
            <span>Customize Parameters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "preview"
                ? "bg-[#1868db] text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Eye className="size-3.5" />
            <span>Live Document Preview</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          {activeTab === "customize" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Organization Details */}
              <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Business & Contact Information
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Used to populate legal entity identification and disclosure headers.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Company Legal Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corporation Inc."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Primary Domain / URL</label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Legal Contact Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="privacy@example.com"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="United States"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">State / Region</label>
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="California"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Legal Regulations & Policy Clauses */}
              <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Legal Clauses & Regulatory Provisions
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Include regional privacy frameworks and custom commercial clauses.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeGdpr}
                      onChange={(e) => setIncludeGdpr(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        GDPR & UK DPA Provisions
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Enables DPO contact clauses, lawful basis for processing, and SAR rights for EEA/UK visitors.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeCcpa}
                      onChange={(e) => setIncludeCcpa(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        CCPA / CPRA & US State Disclosures
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Adds "Do Not Sell My Personal Info", notice at collection, and state privacy disclosures.
                      </p>
                    </div>
                  </label>

                  {policy.id === "return" && (
                    <div className="space-y-1 p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                      <label className="text-xs font-semibold text-emerald-900">Refund Window (Days)</label>
                      <input
                        type="number"
                        value={returnDays}
                        onChange={(e) => setReturnDays(e.target.value)}
                        className="w-full px-3 py-1 text-xs rounded border border-emerald-300 bg-white"
                        placeholder="30"
                      />
                    </div>
                  )}

                  {policy.id === "privacy" && (
                    <div className="space-y-1 p-3 rounded-lg bg-blue-50/60 border border-blue-200">
                      <label className="text-xs font-semibold text-blue-900">Minimum User Age Limit (COPPA)</label>
                      <input
                        type="number"
                        value={minAge}
                        onChange={(e) => setMinAge(e.target.value)}
                        className="w-full px-3 py-1 text-xs rounded border border-blue-300 bg-white"
                        placeholder="13"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Document Preview Screen */
            <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 shadow-inner">
              <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md border border-slate-200 font-sans">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-900">
                      {companyName} Legal Document
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    <span>{copied ? "Copied" : "Copy text"}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {generateContent()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Auto-formatted with standard legal templates</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-md bg-[#1868db] hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <span>Publish Policy</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
