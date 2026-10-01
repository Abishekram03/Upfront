"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Globe,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  BarChart3,
  Search,
  Sliders,
  ExternalLink,
  Code2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWorkspace, Workspace } from "@/lib/workspace-context"
import { useDomain } from "@/lib/domain-context"
import { cn } from "@/lib/utils"

export interface OnboardingWizardProps {
  workspace: Workspace
  onComplete?: () => void
}

type OnboardingStep = "welcome" | "website" | "install" | "verify" | "completed"

function sanitizeUrlToDomain(input: string): { domain: string; url: string; error?: string } {
  let raw = input.trim()
  if (!raw) return { domain: "", url: "", error: "Please enter a website URL." }

  // Add https:// if no protocol supplied for URL parser
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`
  }

  try {
    const parsed = new URL(raw)
    const hostname = parsed.hostname.toLowerCase().trim()

    if (!hostname || hostname.includes(" ") || !hostname.includes(".")) {
      return { domain: "", url: "", error: "Please enter a valid website domain (e.g. example.com)." }
    }

    // Reject localhost / private probes
    if (
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.")
    ) {
      return { domain: "", url: "", error: "Please enter a public website address." }
    }

    return {
      domain: hostname,
      url: `https://${hostname}`,
    }
  } catch (err) {
    return { domain: "", url: "", error: "Please enter a valid URL." }
  }
}

export function OnboardingWizard({ workspace, onComplete }: OnboardingWizardProps) {
  const router = useRouter()
  const { updateOnboardingState, refreshWorkspaces } = useWorkspace()
  const { refreshSites, setActiveDomain } = useDomain()

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    (workspace.onboarding_step as OnboardingStep) || "welcome"
  )

  // Step 2 State
  const [siteName, setSiteName] = useState("")
  const [siteUrl, setSiteUrl] = useState("")
  const [siteDomain, setSiteDomain] = useState("")
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(workspace.first_site_id || null)
  const [isCreatingSite, setIsCreatingSite] = useState(false)
  const [siteError, setSiteError] = useState("")

  // Step 3 State
  const [copied, setCopied] = useState(false)

  // Step 4 Verification State
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    message: string
    detail?: string
  } | null>(null)

  // Sync initial state if workspace has first_site_id
  useEffect(() => {
    async function loadExistingSite() {
      if (workspace.id) {
        try {
          const res = await fetch(`/api/v1/workspaces/${workspace.id}/onboarding`)
          if (res.ok) {
            const data = await res.json()
            if (data.site) {
              setSiteDomain(data.site.domain)
              setSiteName(data.site.name || data.site.domain)
              setCreatedSiteId(data.site.id)
            }
            if (data.onboarding_step && data.onboarding_step !== "welcome") {
              setCurrentStep(data.onboarding_step)
            }
          }
        } catch (err) {
          console.warn("Could not load initial onboarding site:", err)
        }
      }
    }
    loadExistingSite()
  }, [workspace.id])

  const scriptHost = typeof window !== "undefined" ? window.location.origin : "https://usrly-five.vercel.app"
  const scriptSnippet = `<script defer data-domain="${siteDomain || "yourdomain.com"}" src="${scriptHost}/script.js"></script>`

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Advancing steps with DB persistence
  const goToStep = async (step: OnboardingStep) => {
    setCurrentStep(step)
    await updateOnboardingState(workspace.id, {
      step,
      first_site_id: createdSiteId || undefined,
    })
  }

  // Handle Step 2: Add Website
  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSiteError("")

    const { domain, url, error } = sanitizeUrlToDomain(siteUrl)
    if (error || !domain) {
      setSiteError(error || "Invalid website URL")
      return
    }

    setIsCreatingSite(true)

    try {
      const res = await fetch("/api/v1/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          name: siteName.trim() || domain,
          workspace_id: workspace.id,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || "Failed to add website. Please try again.")
      }

      const newSite = await res.json()
      setCreatedSiteId(newSite.id)
      setSiteDomain(newSite.domain)
      setActiveDomain(newSite.domain)
      await refreshSites()

      // Advance to Install step
      await goToStep("install")
    } catch (err: any) {
      setSiteError(err.message || "Failed to add website.")
    } finally {
      setIsCreatingSite(false)
    }
  }

  // Handle Step 4: Verify Installation
  const handleVerifyInstallation = async () => {
    if (!siteDomain) return

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      const res = await fetch("/api/v1/sites/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: createdSiteId || undefined,
          domain: siteDomain,
        }),
      })

      const data = await res.json()

      if (data.success && data.status === "detected") {
        setVerificationResult({
          success: true,
          message: data.message || "Your website is connected.",
        })
        await updateOnboardingState(workspace.id, {
          step: "completed",
          onboarding_completed: true,
          first_site_id: createdSiteId || undefined,
          installation_status: "detected",
        })
        setCurrentStep("completed")
        await refreshSites()
        await refreshWorkspaces()
      } else {
        setVerificationResult({
          success: false,
          message: data.message || "We couldn't detect the UpFront script yet.",
          detail: data.detail,
        })
        await updateOnboardingState(workspace.id, {
          installation_status: "verification_failed",
        })
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: "Verification failed. Please check your internet connection and try again.",
        detail: err.message,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle Skip
  const handleSkipForNow = async () => {
    await updateOnboardingState(workspace.id, {
      step: "install",
      onboarding_completed: true,
      skip: true,
      first_site_id: createdSiteId || undefined,
      installation_status: "pending",
    })
    await refreshSites()
    await refreshWorkspaces()
    if (onComplete) {
      onComplete()
    } else {
      router.push("/analytics")
    }
  }

  // Complete & Navigate
  const handleFinishOnboarding = async (path: string = "/analytics") => {
    await updateOnboardingState(workspace.id, {
      step: "completed",
      onboarding_completed: true,
      first_site_id: createdSiteId || undefined,
    })
    await refreshSites()
    await refreshWorkspaces()
    if (onComplete) {
      onComplete()
    } else {
      router.push(path)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Step Indicator Header */}
        <div className="bg-gradient-to-r from-[#1868db] to-[#114ba3] px-8 py-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <ShieldCheck className="size-4.5 text-white" />
              </div>
              <span className="font-bold text-sm tracking-wide">UpFront Setup</span>
            </div>

            {/* Step badges */}
            <div className="flex items-center gap-1.5 text-xs">
              {(["welcome", "website", "install", "completed"] as const).map((stepName, idx) => {
                const stepOrder = ["welcome", "website", "install", "verify", "completed"]
                const currentIdx = stepOrder.indexOf(currentStep)
                const thisIdx = stepOrder.indexOf(stepName)
                const isPassed = currentIdx > thisIdx || currentStep === "completed"
                const isCurrent = currentStep === stepName || (currentStep === "verify" && stepName === "install")

                return (
                  <div
                    key={stepName}
                    className={cn(
                      "size-2.5 rounded-full transition-all duration-300",
                      isPassed
                        ? "bg-emerald-400"
                        : isCurrent
                        ? "bg-white ring-4 ring-white/20 scale-110"
                        : "bg-white/30"
                    )}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="p-8 flex-1">
          {/* STEP 1: WELCOME */}
          {currentStep === "welcome" && (
            <div className="space-y-6 py-2 text-center animate-in fade-in-50 duration-200">
              <div className="mx-auto size-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs">
                <Globe className="size-8 text-[#1868db]" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome to UpFront
                </h1>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Let&apos;s get your website connected.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  type="button"
                  onClick={() => goToStep("website")}
                  className="w-full h-11 bg-[#1868db] hover:bg-[#1559be] text-white font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: ADD WEBSITE */}
          {currentStep === "website" && (
            <form onSubmit={handleAddWebsite} className="space-y-5 animate-in fade-in-50 duration-200">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Add your Website
                </h2>
                <p className="text-xs text-slate-500">
                  Enter the domain you want to collect privacy-first analytics and consent for.
                </p>
              </div>

              {siteError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                  <XCircle className="size-4 text-rose-500 shrink-0" />
                  <span>{siteError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Website Name
                  </label>
                  <Input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="e.g. My Website or Production Store"
                    className="h-10 text-sm bg-slate-50 border-slate-300 focus:bg-white focus:border-[#1868db]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Website URL <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={siteUrl}
                    onChange={(e) => {
                      setSiteUrl(e.target.value)
                      if (!siteName) {
                        const { domain } = sanitizeUrlToDomain(e.target.value)
                        if (domain) setSiteName(domain)
                      }
                    }}
                    placeholder="https://example.com"
                    required
                    autoFocus
                    className="h-10 text-sm bg-slate-50 border-slate-300 focus:bg-white focus:border-[#1868db]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter your site&apos;s root address. Works seamlessly with subdomains.
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={isCreatingSite || !siteUrl.trim()}
                  className="w-full h-11 bg-[#1868db] hover:bg-[#1559be] text-white font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCreatingSite ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Adding Website...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3 & 4: INSTALL SCRIPT & VERIFY */}
          {(currentStep === "install" || currentStep === "verify") && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Install UpFront Script
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                    {siteDomain}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Add this script to the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px]">&lt;head&gt;</code> of your website, before <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px]">&lt;/head&gt;</code>.
                </p>
              </div>

              {/* Code Snippet Box */}
              <div className="relative rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 shadow-inner">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-slate-300" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <pre className="font-mono text-xs overflow-x-auto pr-18 py-1 leading-relaxed text-slate-200 select-all whitespace-pre-wrap break-all">
                  <code>{scriptSnippet}</code>
                </pre>
              </div>

              {/* Verification Feedback Banner */}
              {verificationResult && (
                <div
                  className={cn(
                    "p-3.5 rounded-xl border text-xs font-medium flex items-start gap-3 animate-in fade-in-50 duration-200",
                    verificationResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  )}
                >
                  {verificationResult.success ? (
                    <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="size-4.5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-bold">{verificationResult.message}</p>
                    {verificationResult.detail && (
                      <p className="text-[11px] opacity-90">{verificationResult.detail}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerifyInstallation}
                  className="w-full h-11 bg-[#1868db] hover:bg-[#1559be] text-white font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Verifying installation...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      {verificationResult && !verificationResult.success ? "Try Again" : "Verify Installation"}
                    </>
                  )}
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleSkipForNow}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer py-1"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETED */}
          {currentStep === "completed" && (
            <div className="space-y-6 text-center animate-in fade-in-50 duration-200 py-2">
              <div className="mx-auto size-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="size-9 text-emerald-600 animate-in zoom-in duration-300" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Your website is connected.
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  UpFront is successfully installed on <span className="font-semibold text-slate-700 font-mono">{siteDomain}</span>. You are ready to manage privacy and analytics.
                </p>
              </div>

              {/* Useful Next Actions Grid */}
              <div className="grid grid-cols-3 gap-3 text-left pt-2">
                <button
                  type="button"
                  onClick={() => handleFinishOnboarding("/analytics")}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-left cursor-pointer group"
                >
                  <div className="size-8 rounded-lg bg-blue-100/80 text-[#1868db] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <BarChart3 className="size-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#1868db]">View Analytics</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Monitor cookieless traffic</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinishOnboarding("/consent")}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50/60 hover:border-purple-200 transition-all text-left cursor-pointer group"
                >
                  <div className="size-8 rounded-lg bg-purple-100/80 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Sliders className="size-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Configure Consent</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Design banner in Studio</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinishOnboarding("/consent/scanner")}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-200 transition-all text-left cursor-pointer group"
                >
                  <div className="size-8 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Search className="size-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Scan Website</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Audit cookies & scripts</p>
                </button>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => handleFinishOnboarding("/analytics")}
                  className="w-full h-11 bg-[#1868db] hover:bg-[#1559be] text-white font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
