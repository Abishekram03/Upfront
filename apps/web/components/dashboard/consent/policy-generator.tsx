"use client"

import React, { useState, useEffect, useCallback } from "react"
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
  RefreshCw,
  Eye,
  Check,
  Layers,
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

export function PolicyGenerator() {
  const { activeDomain } = useDomain()
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
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10))
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
        setEffectiveDate(pol.effective_date || new Date().toISOString().slice(0, 10))
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
        setCookies(Array.isArray(cData) ? cData : [])
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
    } finally {
      setLoading(false)
    }
  }, [activeDomain])

  useEffect(() => {
    loadPolicyAndInventory()
  }, [loadPolicyAndInventory])

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

  // 4. Multi-Framework Localized Document Content
  const isLGPD = lawTemplate === "lgpd"
  const isDPDP = lawTemplate === "dpdp"
  const isCCPA = lawTemplate === "ccpa"
  const isNoticeOnly = lawTemplate === "notice_only"

  const policyTitle = isLGPD
    ? `Política de Cookies de ${activeDomain || "nosso site"}`
    : `Cookie Policy for ${activeDomain || "example.com"}`

  const generatedEmbedCode = `<!-- UpFront CMP Dynamic Cookie Declaration -->
<div id="usrly-cookie-declaration" data-domain="${activeDomain || "yourdomain.com"}"></div>
<script defer src="https://syftanalytics.com/userly.js" data-domain="${activeDomain || "yourdomain.com"}"></script>`

  const generatedHtml = isLGPD
    ? `<!-- Política de Cookies (LGPD Brasil) -->
<div class="cookie-policy-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Política de Cookies</h1>
  <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">Data de Vigência: <strong>${effectiveDate}</strong> | Versão: <strong>${policyVersion}</strong></p>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">1. Introdução</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    Esta Política de Cookies explica como a <strong>${companyName}</strong> utiliza cookies e tecnologias semelhantes no site <strong>${websiteUrl}</strong>, em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
  </p>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">2. O Que São Cookies?</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    Cookies são pequenos arquivos de texto armazenados no seu computador ou dispositivo móvel para assegurar a operação correta do site, memorizar preferências e fornecer relatórios agregados de desempenho.
  </p>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">3. Inventário e Declaração de Cookies</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    Abaixo encontra-se a auditoria em tempo real das categorias e cookies ativos detectados em nosso website:
  </p>
  
  <div id="usrly-cookie-declaration" style="margin: 20px 0;"></div>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">4. Gerenciamento e Revogação do Consentimento</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    Você pode revisar, modificar ou revogar seu consentimento a qualquer momento clicando no botão flutuante <strong>"🍪 Preferências"</strong> no canto inferior da página. Cookies essenciais não podem ser desativados por serem estritamente necessários ao funcionamento básico.
  </p>
  ${
    enableGPCMention
      ? `<p style="font-size: 14px; margin-bottom: 16px;">
    <strong>Controle Global de Privacidade (GPC):</strong> Nosso site respeita automaticamente o sinal GPC transmitido pelo seu navegador, desativando o rastreamento opcional por padrão.
  </p>`
      : ""
  }

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">5. Contato e Encarregado (DPO)</h2>
  <p style="font-size: 14px;">
    Em caso de dúvidas sobre esta política ou o tratamento de dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados: <a href="mailto:${contactEmail}" style="color: #1868db; text-decoration: underline;">${contactEmail}</a>.
  </p>
</div>`
    : `<!-- Cookie Policy -->
<div class="cookie-policy-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Cookie Policy</h1>
  <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">Effective Date: <strong>${effectiveDate}</strong> | Version: <strong>${policyVersion}</strong></p>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">1. Introduction</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    This Cookie Policy explains how <strong>${companyName}</strong> ("we", "us", or "our") uses cookies and similar tracking technologies on <strong>${websiteUrl}</strong>. ${
      isDPDP
        ? "In accordance with the Digital Personal Data Protection (DPDP) Act, we process personal data strictly for specified lawful purposes."
        : isCCPA
        ? "In compliance with CCPA/CPRA, this notice provides transparency regarding data collection and Do Not Sell/Share rights."
        : "It describes what these technologies are, why we use them, and your rights to control our use of them."
    }
  </p>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">2. What Are Cookies?</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    Cookies are small data files placed on your computer or mobile device when you visit a website to maintain session integrity, remember visitor preferences, and provide analytical measurements.
  </p>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">3. Cookies Used on Our Website</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    Below is a live, automated audit of the cookies and purpose categories currently active on our website:
  </p>
  
  <!-- Live Dynamic Cookie Table -->
  <div id="usrly-cookie-declaration" style="margin: 20px 0;"></div>

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">4. Managing Your Consent Preferences</h2>
  <p style="font-size: 14px; margin-bottom: 16px;">
    You can customize or withdraw your cookie consent preferences at any time by clicking the floating <strong>"🍪 Consent"</strong> button located at the bottom of our website. Essential cookies cannot be disabled as they are strictly necessary to deliver core services.
  </p>
  ${
    enableGPCMention
      ? `<p style="font-size: 14px; margin-bottom: 16px;">
    <strong>Global Privacy Control (GPC):</strong> Our website automatically honors Global Privacy Control signals broadcast by your browser, opting you out of non-essential tracking by default.
  </p>`
      : ""
  }
  ${
    enableGCMv2Mention
      ? `<p style="font-size: 14px; margin-bottom: 16px;">
    <strong>Google Consent Mode v2:</strong> Google services dynamically adjust data collection parameters based on your granular category choices.
  </p>`
      : ""
  }

  <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 24px;">5. Contact Us</h2>
  <p style="font-size: 14px;">
    If you have questions regarding this Cookie Policy or our privacy practices, please contact our Data Protection Officer at: <a href="mailto:${contactEmail}" style="color: #1868db; text-decoration: underline;">${contactEmail}</a>.
  </p>
</div>`

  const generatedMarkdown = `# ${policyTitle}
*Effective Date: ${effectiveDate} | Version: ${policyVersion}*

## 1. Introduction
This Cookie Policy explains how **${companyName}** uses cookies and tracking technologies on [${websiteUrl}](${websiteUrl}).

## 2. What Are Cookies?
Cookies are small data files placed on your computer or mobile device when you visit a website.

## 3. Cookie Inventory
*Audit inventory embedded dynamically via UpFront CMP tag.*

## 4. Managing Preferences
You can review, modify, or withdraw consent at any time via the floating cookie preferences badge.

## 5. Contact Information
Contact our Data Protection Officer: [${contactEmail}](mailto:${contactEmail})`

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
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
                type="date"
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
                ? "Paste this container tag into your /cookie-policy page. userly.js will automatically inject the live declaration table and synchronize status with visitor consent in real time."
                : "Full standalone document export ready to paste into WordPress, Webflow, Shopify, or static docs."}
            </p>
          </div>

          {/* Realistic Live Policy Preview */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-[#1868db]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Live Policy Preview</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {cookies.length} Discovered Cookies in Database
              </span>
            </div>

            <div className="p-8 space-y-6 bg-white text-slate-800 max-w-4xl mx-auto">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{policyTitle}</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Effective Date: <strong>{effectiveDate}</strong> | Policy Version: <strong>{policyVersion}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">1. Introduction</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This Cookie Policy explains how <strong>{companyName}</strong> uses cookies and similar tracking technologies on <strong>{websiteUrl}</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">2. What Are Cookies?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cookies are small data files placed on your computer or mobile device when you visit a website. They ensure site security, remember preferences, and provide analytical measurements.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">3. Live Cookie Audit Inventory</h3>
                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-3.5">Cookie</th>
                        <th className="py-2.5 px-3.5">Category</th>
                        <th className="py-2.5 px-3.5">Provider</th>
                        <th className="py-2.5 px-3.5">Duration</th>
                        <th className="py-2.5 px-3.5">Purpose</th>
                        <th className="py-2.5 px-3.5">Live Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cookies.length > 0 ? (
                        cookies.map((c, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">{c.name}</td>
                            <td className="py-2.5 px-3.5 capitalize text-slate-700">{c.category}</td>
                            <td className="py-2.5 px-3.5 text-slate-600">{c.service_name || "First Party"}</td>
                            <td className="py-2.5 px-3.5 text-slate-500">{c.duration || "Session"}</td>
                            <td className="py-2.5 px-3.5 text-slate-600">{c.description || "Maintains site operation."}</td>
                            <td className="py-2.5 px-3.5 font-bold text-emerald-600">
                              {c.category === "necessary" ? "Always Active" : "Gated by Consent"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 px-3.5 text-center text-slate-400 italic">
                            No custom cookies discovered yet. Canonical baseline categories active.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">4. Managing & Withdrawing Consent</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Visitors can modify or revoke their cookie consent preferences at any time by clicking the floating cookie badge at the bottom of the page.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">5. Contact Information</h3>
                <p className="text-xs text-slate-600">
                  Contact our Data Protection Officer:{" "}
                  <a href={`mailto:${contactEmail}`} className="text-[#1868db] font-semibold underline">
                    {contactEmail}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
