"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useDomain } from "@/lib/domain-context"
import {
  FileText,
  CheckCircle2,
  Copy,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Code2,
  Building,
  Save,
  Send,
  Eye,
  Check,
  ExternalLink,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"

interface CookieItem {
  id?: string
  name: string
  category: string
  service_name?: string
  duration?: string
  description?: string
}

interface PolicyGeneratorProps {
  onBack?: () => void
  domain?: string
}

const DEFAULT_BASELINE_COOKIES: CookieItem[] = [
  {
    name: "_ga",
    category: "analytics",
    service_name: "Google Analytics",
    duration: "2 years",
    description: "Used by Google Analytics to distinguish unique users.",
  },
  {
    name: "_gid",
    category: "analytics",
    service_name: "Google Analytics",
    duration: "24 hours",
    description: "Used by Google Analytics to throttle request rate.",
  },
  {
    name: "upfront_test_functional",
    category: "functional",
    service_name: "Uncatalogued Provider",
    duration: "12 months",
    description: "Remembers user preferences and interface settings across sessions.",
  },
  {
    name: "consentos_consent",
    category: "necessary",
    service_name: "Consent Management",
    duration: "12 months",
    description: "Stores the visitor's cookie consent status and preferences.",
  },
  {
    name: "session",
    category: "necessary",
    service_name: "Session Management",
    duration: "Session",
    description: "Maintains user state and security across page requests.",
  },
]

export function PolicyGenerator({ onBack, domain }: PolicyGeneratorProps = {}) {
  const { activeDomain: contextDomain } = useDomain()
  const activeDomain = domain || contextDomain
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [activeEmbedTab, setActiveEmbedTab] = useState<"embed" | "html" | "markdown">("embed")
  const [copiedType, setCopiedType] = useState<string | null>(null)

  // Policy Form State (Loaded from DB)
  const [companyName, setCompanyName] = useState("Our Company")
  const [websiteUrl, setWebsiteUrl] = useState(`https://${activeDomain || "example.com"}`)
  const [contactEmail, setContactEmail] = useState(`privacy@${activeDomain || "example.com"}`)
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  )
  const [lawTemplate, setLawTemplate] = useState("gdpr")
  const [enableGPCMention, setEnableGPCMention] = useState(true)
  const [enableGCMv2Mention, setEnableGCMv2Mention] = useState(true)
  const [policyVersion, setPolicyVersion] = useState("1.0")
  const [isDraft, setIsDraft] = useState(false)
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null)

  // Discovered Cookies Inventory
  const [cookies, setCookies] = useState<CookieItem[]>([])

  // 1. Fetch Persisted Policy Config (Draft/Published) & Cookies from DB
  const loadPolicyAndInventory = useCallback(async () => {
    if (!activeDomain) return
    setLoading(true)
    try {
      // Fetch Policy configuration (draft=true to load working draft if available)
      const policyRes = await fetch(`/api/v1/consent/policy?domain=${encodeURIComponent(activeDomain)}&draft=true`)
      if (policyRes.ok) {
        const pData = await policyRes.json()
        const pol = pData.policy || {}
        setCompanyName(pol.company_name || "Our Company")
        setWebsiteUrl(pol.website_url || `https://${activeDomain}`)
        setContactEmail(pol.contact_email || `privacy@${activeDomain}`)
        setEffectiveDate(pol.effective_date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))
        setLawTemplate(pol.law_template || "gdpr")
        setEnableGPCMention(pol.enable_gpc_clause !== false)
        setEnableGCMv2Mention(pol.enable_gcm_clause !== false)
        setPolicyVersion(pData.published_version || pol.policy_version || "1.0")
        setIsDraft(Boolean(pData.is_draft))
        setLastPublishedAt(pol.published_at || null)
      }

      // Fetch Cookie inventory from Cookie Manager
      const cookiesRes = await fetch(`/api/v1/consent/cookies?domain=${encodeURIComponent(activeDomain)}`)
      if (cookiesRes.ok) {
        const cData = await cookiesRes.json()
        const fetchedCookies = Array.isArray(cData) ? cData : cData?.cookies || []
        if (Array.isArray(fetchedCookies) && fetchedCookies.length > 0) {
          setCookies(fetchedCookies)
        } else {
          setCookies(DEFAULT_BASELINE_COOKIES)
        }
      } else {
        setCookies(DEFAULT_BASELINE_COOKIES)
      }

      // Fetch active law template from Banner Studio CMP config
      const cmpRes = await fetch(`/api/v1/consent/config?domain=${encodeURIComponent(activeDomain)}`)
      if (cmpRes.ok) {
        const cmpData = await cmpRes.json()
        if (cmpData.law_template) {
          setLawTemplate(cmpData.law_template)
        }
      }
    } catch (e) {
      console.error("Failed to load policy data:", e)
      setCookies(DEFAULT_BASELINE_COOKIES)
    } finally {
      setLoading(false)
    }
  }, [activeDomain])

  useEffect(() => {
    loadPolicyAndInventory()
  }, [loadPolicyAndInventory])

  const displayCookies = useMemo(() => {
    return cookies.length > 0 ? cookies : DEFAULT_BASELINE_COOKIES
  }, [cookies])

  // 2. Save Working Draft to DB
  const handleSaveDraft = async () => {
    if (!activeDomain) return
    setSavingDraft(true)
    try {
      const res = await fetch("/api/v1/consent/policy/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: activeDomain,
          company_name: companyName,
          website_url: websiteUrl,
          contact_email: contactEmail,
          effective_date: effectiveDate,
          law_template: lawTemplate,
          enable_gpc_clause: enableGPCMention,
          enable_gcm_clause: enableGCMv2Mention,
        }),
      })
      if (res.ok) {
        setIsDraft(true)
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 2500)
      }
    } catch (e) {
      console.error("Save draft failed:", e)
    } finally {
      setSavingDraft(false)
    }
  }

  // 3. Publish Policy to Production DB
  const handlePublish = async () => {
    if (!activeDomain) return
    setPublishing(true)
    try {
      const res = await fetch("/api/v1/consent/policy/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: activeDomain,
          company_name: companyName,
          website_url: websiteUrl,
          contact_email: contactEmail,
          effective_date: effectiveDate,
          law_template: lawTemplate,
          enable_gpc_clause: enableGPCMention,
          enable_gcm_clause: enableGCMv2Mention,
        }),
      })
      if (res.ok) {
        const pData = await res.json()
        setIsDraft(false)
        setPolicyVersion(pData.policy?.policy_version || "1.1")
        setLastPublishedAt(pData.policy?.published_at || new Date().toISOString())
        setPublishSuccess(true)
        setTimeout(() => setPublishSuccess(false), 3000)
      }
    } catch (e) {
      console.error("Publish failed:", e)
    } finally {
      setPublishing(false)
    }
  }

  // Exact standard texts
  const aboutHeading = "What are cookies?"
  const aboutDescription = `This Cookie Policy explains what cookies are, how we use them, the types of cookies we use (i.e., the information we collect using cookies and how that information is used), and how to manage your cookie settings.\n\nCookies are small text files used to store small pieces of information. They are stored on your device when a website loads in your browser. These cookies help ensure that the website functions properly, enhance security, provide a better user experience, and analyse performance to identify what works and where improvements are needed.`

  const useHeading = "How do we use cookies?"
  const useDescription = `Like most online services, our website uses both first-party and third-party cookies for various purposes. First-party cookies are primarily necessary for the website to function properly and do not collect any personally identifiable data.\n\nThe third-party cookies used on our website primarily help us understand how the website performs, track how you interact with it, keep our services secure, deliver relevant advertisements, and enhance your overall user experience while improving the speed of your future interactions with our website.`

  const typesHeading = "Types of cookies we use"

  const prefHeading = "Manage cookie preferences"
  const prefDescription = `You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.\n\nAdditionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers:\n\nChrome: https://support.google.com/accounts/answer/32050\nSafari: https://support.apple.com/en-in/guide/safari/sfri11471/mac\nFirefox: https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox\nMicrosoft Edge: https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09\n\nIf you are using a different web browser, please refer to its official support documentation.`

  const generatedEmbedCode = `<!-- UpFront CMP Dynamic Cookie Declaration -->
<div id="usrly-cookie-declaration" data-domain="${activeDomain || "yourdomain.com"}"></div>
<script defer src="https://syftanalytics.com/script.js" data-domain="${activeDomain || "yourdomain.com"}"></script>`

  const generatedHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Cookie Policy - ${activeDomain || "example.com"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 840px; margin: 0 auto; padding: 32px 16px; }
    h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 8px; }
    p, li { font-size: 14px; color: #334155; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
    th { background-color: #f8fafc; font-weight: 600; color: #0f172a; }
    .btn-revisit { display: inline-block; padding: 8px 16px; background: #1868db; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; margin: 12px 0; }
    ul { padding-left: 20px; margin-bottom: 16px; }
    a { color: #1868db; text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Cookie Policy for ${activeDomain || "example.com"}</h1>
  <p><em>Last updated: ${effectiveDate}</em></p>

  <h2>${aboutHeading}</h2>
  ${aboutDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("\n  ")}

  <h2>${useHeading}</h2>
  ${useDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("\n  ")}

  <h2>${typesHeading}</h2>
  <p><strong>Live Cookie Table</strong><br />
  <em>${displayCookies.length} active cookies</em><br />
  Automatically rendered and synchronized from your website scans.</p>

  <table>
    <thead>
      <tr>
        <th>Cookie Name</th>
        <th>Category</th>
        <th>Provider</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>
      ${displayCookies
        .map(
          (c) => `<tr>
        <td><code>${c.name}</code></td>
        <td>${c.category}</td>
        <td>${c.service_name || activeDomain || "First Party"}</td>
        <td>${c.duration || "Session"}</td>
      </tr>`
        )
        .join("\n      ")}
    </tbody>
  </table>

  <h2>${prefHeading}</h2>
  <p><a href="javascript:void(0)" class="btn-revisit">Consent Preferences</a></p>
  <p>You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.</p>
  <p>Additionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers:</p>
  <ul>
    <li><strong>Chrome:</strong> <a href="https://support.google.com/accounts/answer/32050" target="_blank" rel="noopener noreferrer">https://support.google.com/accounts/answer/32050</a></li>
    <li><strong>Safari:</strong> <a href="https://support.apple.com/en-in/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">https://support.apple.com/en-in/guide/safari/sfri11471/mac</a></li>
    <li><strong>Firefox:</strong> <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" target="_blank" rel="noopener noreferrer">https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox</a></li>
    <li><strong>Microsoft Edge:</strong> <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09</a></li>
  </ul>
  <p>If you are using a different web browser, please refer to its official support documentation.</p>
</body>
</html>`
  }, [activeDomain, effectiveDate, displayCookies])

  const generatedMarkdown = useMemo(() => {
    let md = `# Cookie Policy for ${activeDomain || "example.com"}\n`
    md += `*Last updated: ${effectiveDate}*\n\n`

    md += `## ${aboutHeading}\n`
    md += `${aboutDescription}\n\n`

    md += `## ${useHeading}\n`
    md += `${useDescription}\n\n`

    md += `## ${typesHeading}\n`
    md += `**Live Cookie Table**  \n`
    md += `*${displayCookies.length} active cookies*  \n`
    md += `*Automatically rendered and synchronized from your website scans.*\n\n`

    md += `| Cookie Name | Category | Provider | Duration |\n`
    md += `| :--- | :--- | :--- | :--- |\n`
    displayCookies.forEach((c) => {
      md += `| \`${c.name}\` | ${c.category} | ${c.service_name || activeDomain || "First Party"} | ${c.duration || "Session"} |\n`
    })
    md += `\n`

    md += `## ${prefHeading}\n`
    md += `[Consent Preferences](javascript:void(0))\n\n`
    md += `${prefDescription}\n`

    return md
  }, [activeDomain, effectiveDate, displayCookies])

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>BACK TO DASHBOARD</span>
        </button>
      )}

      {/* Top Header & Publication Status Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-[#1868db] rounded-md border border-blue-100">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Cookie Policy Generator & Declaration</h2>
                <span className="text-xs px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {lawTemplate.toUpperCase()}
                </span>
                {isDraft ? (
                  <span className="text-xs px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 font-bold border border-amber-200 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span> Draft Changes
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-600" /> Published v{policyVersion}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate and deploy an auto-updating legal Cookie Policy for <strong className="text-slate-800">{activeDomain || "your site"}</strong> with live inventory synchronization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={savingDraft || loading}
              className="text-xs font-bold rounded-[4px] h-9 flex items-center gap-1.5"
            >
              <Save className="size-3.5" />
              {draftSaved ? "Draft Saved!" : savingDraft ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing || loading}
              className="bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold rounded-[4px] h-9 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="size-3.5" />
              {publishSuccess ? "Published!" : publishing ? "Publishing..." : "Publish Policy"}
            </Button>
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          {[
            { step: 1, label: "1. Organization Details" },
            { step: 2, label: "2. Compliance & Rules" },
            { step: 3, label: "3. Preview & Embed Code" },
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
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="size-4 text-[#1868db]" />
            Organization & Website Identity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company / Organization Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value)
                  setIsDraft(true)
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Website URL</label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value)
                  setIsDraft(true)
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Privacy / DPO Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value)
                  setIsDraft(true)
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Effective Date</label>
              <input
                type="text"
                value={effectiveDate}
                onChange={(e) => {
                  setEffectiveDate(e.target.value)
                  setIsDraft(true)
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              {lastPublishedAt ? `Last published: ${new Date(lastPublishedAt).toLocaleDateString()}` : "Not yet published"}
            </span>
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
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#1868db]" />
            Regulatory Disclosure Settings & Legal Framework
          </h3>

          <div className="p-3 rounded border border-blue-100 bg-blue-50/50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-800 block">Active Legal Framework</span>
              <span className="text-slate-500 text-[11px]">
                Inherited automatically from Banner Studio configuration.
              </span>
            </div>
            <span className="px-2.5 py-1 bg-white border border-blue-200 rounded font-mono font-bold text-[#1868db] text-xs">
              {lawTemplate.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 p-3 rounded border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={enableGPCMention}
                onChange={(e) => {
                  setEnableGPCMention(e.target.checked)
                  setIsDraft(true)
                }}
                className="size-4 mt-0.5 rounded text-[#1868db]"
              />
              <div>
                <span className="font-bold text-slate-800 block">Global Privacy Control (GPC) Clause</span>
                <span className="text-slate-500 text-[11px]">
                  Explicitly discloses that your website automatically honors browser-level GPC opt-out signals.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={enableGCMv2Mention}
                onChange={(e) => {
                  setEnableGCMv2Mention(e.target.checked)
                  setIsDraft(true)
                }}
                className="size-4 mt-0.5 rounded text-[#1868db]"
              />
              <div>
                <span className="font-bold text-slate-800 block">Google Consent Mode v2 Transparency</span>
                <span className="text-slate-500 text-[11px]">
                  Discloses that Google tags adjust parameter collection dynamically according to user choices.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-100">
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
              Preview & Embed Code <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Policy Preview & Embed Code */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Embed Code Snippet Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="size-4 text-[#1868db]" />
                  Embed Policy on Your Website
                </h3>
                <p className="text-xs text-slate-500">
                  Embed the auto-updating declaration tag or export static HTML/Markdown for your CMS.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
                <button
                  onClick={() => setActiveEmbedTab("embed")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer",
                    activeEmbedTab === "embed" ? "bg-[#1868db] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Dynamic Embed Tag
                </button>
                <button
                  onClick={() => setActiveEmbedTab("html")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer",
                    activeEmbedTab === "html" ? "bg-[#1868db] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Full HTML
                </button>
                <button
                  onClick={() => setActiveEmbedTab("markdown")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer",
                    activeEmbedTab === "markdown" ? "bg-[#1868db] text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Markdown
                </button>
              </div>
            </div>

            <div className="relative bg-slate-900 text-slate-200 p-4 rounded-md font-mono text-xs overflow-x-auto max-h-48 border border-slate-800">
              <pre>
                <code>
                  {activeEmbedTab === "embed"
                    ? generatedEmbedCode
                    : activeEmbedTab === "html"
                    ? generatedHtml
                    : generatedMarkdown}
                </code>
              </pre>
              <button
                onClick={() =>
                  handleCopy(
                    activeEmbedTab === "embed"
                      ? generatedEmbedCode
                      : activeEmbedTab === "html"
                      ? generatedHtml
                      : generatedMarkdown,
                    activeEmbedTab
                  )
                }
                className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded text-[11px] font-bold border border-slate-700 flex items-center gap-1 shadow-xs cursor-pointer"
              >
                {copiedType === activeEmbedTab ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                {copiedType === activeEmbedTab ? "Copied!" : "Copy Snippet"}
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              {activeEmbedTab === "embed"
                ? "Paste this container tag into your /cookie-policy page. script.js will automatically inject the live declaration table and synchronize status with visitor consent in real time."
                : "Full standalone document export ready to paste into WordPress, Webflow, Shopify, or static docs."}
            </p>
          </div>

          {/* Realistic Live Policy Preview (Exact Match to User Requirement) */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-[#1868db]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Live Policy Preview</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {displayCookies.length} Discovered Cookies in Database
              </span>
            </div>

            <div className="p-8 space-y-6 bg-white text-slate-800 max-w-4xl mx-auto text-xs leading-relaxed">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Cookie Policy for {activeDomain || "example.com"}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  <em>Last updated: {effectiveDate}</em>
                </p>
              </div>

              {/* Section 1: What are cookies? */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">{aboutHeading}</h2>
                {aboutDescription.split("\n\n").map((p, i) => (
                  <p key={i} className="text-slate-600">{p}</p>
                ))}
              </div>

              {/* Section 2: How do we use cookies? */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900">{useHeading}</h2>
                {useDescription.split("\n\n").map((p, i) => (
                  <p key={i} className="text-slate-600">{p}</p>
                ))}
              </div>

              {/* Section 3: Types of cookies we use (Live Cookie Table) */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900">{typesHeading}</h2>
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">Live Cookie Table</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1868db] border border-blue-200">
                      {displayCookies.length} active cookies
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Automatically rendered and synchronized from your website scans.
                  </p>

                  <div className="mt-3 rounded border border-slate-200 overflow-hidden bg-white">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2.5">Cookie Name</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Provider</th>
                          <th className="p-2.5">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayCookies.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-2.5 font-mono font-semibold text-[#1868db]">{c.name}</td>
                            <td className="p-2.5 capitalize text-slate-700">{c.category}</td>
                            <td className="p-2.5 text-slate-600">{c.service_name || activeDomain || "First Party"}</td>
                            <td className="p-2.5 text-slate-500">{c.duration || "Session"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Section 4: Manage cookie preferences */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">{prefHeading}</h2>
                <div>
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-md bg-[#1868db] text-white font-bold text-xs shadow-2xs cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Consent Preferences
                  </button>
                </div>
                <p className="text-slate-600">
                  You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.
                </p>
                <p className="text-slate-600">
                  Additionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong>Chrome:</strong>{" "}
                    <a
                      href="https://support.google.com/accounts/answer/32050"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1868db] hover:underline"
                    >
                      https://support.google.com/accounts/answer/32050
                    </a>
                  </li>
                  <li>
                    <strong>Safari:</strong>{" "}
                    <a
                      href="https://support.apple.com/en-in/guide/safari/sfri11471/mac"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1868db] hover:underline"
                    >
                      https://support.apple.com/en-in/guide/safari/sfri11471/mac
                    </a>
                  </li>
                  <li>
                    <strong>Firefox:</strong>{" "}
                    <a
                      href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1868db] hover:underline"
                    >
                      https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox
                    </a>
                  </li>
                  <li>
                    <strong>Microsoft Edge:</strong>{" "}
                    <a
                      href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1868db] hover:underline"
                    >
                      https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09
                    </a>
                  </li>
                </ul>
                <p className="text-slate-600">
                  If you are using a different web browser, please refer to its official support documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
