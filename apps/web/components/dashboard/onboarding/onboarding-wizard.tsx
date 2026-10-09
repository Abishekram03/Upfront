"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
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
  ChevronLeft,
  Lock,
  Zap,
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

const STEPS_NAV = [
  { id: "welcome", label: "Welcome", stepNum: 1 },
  { id: "website", label: "Add Website", stepNum: 2 },
  { id: "install", label: "Install Script", stepNum: 3 },
  { id: "completed", label: "Ready", stepNum: 4 },
] as const

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
          message: data.message || "Your website is connected successfully.",
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
        message: "Verification failed. Please check your connection and try again.",
        detail: err.message,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle Skip / Do it later
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

  const currentStepNumber =
    currentStep === "welcome"
      ? 1
      : currentStep === "website"
      ? 2
      : currentStep === "install" || currentStep === "verify"
      ? 3
      : 4

  return (
    <div className="fixed inset-0 z-[100] min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col overflow-y-auto font-sans selection:bg-blue-100 selection:text-[#1868db]">
      {/* Top ambient soft blue mesh glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-50/80 via-blue-50/20 to-transparent pointer-events-none" />

      {/* Full Page Navigation Header */}
      <header className="relative z-20 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 sm:px-12 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Workspace Tag */}
          <div className="flex items-center gap-3">
            <Image
              src="/UpFront-Logo-Blue-600.svg"
              alt="UpFront Logo"
              width={120}
              height={30}
              className="h-7 w-auto object-contain"
              priority
            />
            {workspace?.name && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-normal text-[#1868db] border border-blue-100/80">
                {workspace.name}
              </span>
            )}
          </div>

          {/* Stepper overview (centered) */}
          <div className="hidden md:flex items-center gap-2 text-xs font-light text-slate-500">
            <span>Setup Guide</span>
            <span>•</span>
            <span className="font-normal text-slate-800">Step {currentStepNumber} of 4</span>
          </div>

          {/* Do It Later Action Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkipForNow}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-normal text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <span>Do it later</span>
              <ArrowRight className="size-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Page Onboarding Container */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-8 sm:py-14">
        <div className="w-full max-w-2xl">
          {/* Horizontal Progress Timeline */}
          <div className="mb-8 sm:mb-10 px-4">
            <div className="flex items-center justify-between relative">
              {/* Timeline Connector Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-10" />
              <div
                className="absolute top-4 left-6 h-0.5 bg-[#1868db] -z-10 transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStepNumber - 1) / (STEPS_NAV.length - 1)) * 100}%`,
                }}
              />

              {STEPS_NAV.map((step) => {
                const isPassed = step.stepNum < currentStepNumber
                const isCurrent = step.stepNum === currentStepNumber

                return (
                  <div key={step.id} className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "size-8 sm:size-9 rounded-full flex items-center justify-center text-xs transition-all duration-300 font-normal",
                        isPassed
                          ? "bg-[#1868db] text-white shadow-xs"
                          : isCurrent
                          ? "bg-white text-[#1868db] border-2 border-[#1868db] ring-4 ring-blue-100 shadow-sm"
                          : "bg-white text-slate-400 border border-slate-300"
                      )}
                    >
                      {isPassed ? (
                        <Check className="size-4 stroke-[2.5]" />
                      ) : (
                        <span>{step.stepNum}</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs sm:text-sm tracking-tight hidden sm:block transition-colors",
                        isCurrent
                          ? "font-normal text-[#1868db]"
                          : isPassed
                          ? "font-normal text-slate-700"
                          : "font-light text-slate-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Full Page Card Component */}
          <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-300">
            {/* Top Blue Highlight Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#1868db] via-blue-500 to-indigo-500" />

            <div className="p-8 sm:p-12">
              {/* ================= STEP 1: WELCOME ================= */}
              {currentStep === "welcome" && (
                <div className="space-y-8 text-center animate-in fade-in-50 duration-300">
                  <div className="mx-auto size-20 rounded-2xl bg-blue-50 border border-blue-100/90 flex items-center justify-center shadow-xs">
                    <Globe className="size-10 text-[#1868db] stroke-[1.5]" />
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
                      Welcome to UpFront
                    </h1>
                    <p className="text-sm sm:text-base font-light text-slate-500 max-w-lg mx-auto leading-relaxed">
                      Let&apos;s get your website connected with privacy-first cookieless analytics and complete consent management.
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                      <div className="size-8 rounded-xl bg-blue-100/70 text-[#1868db] flex items-center justify-center mb-2.5">
                        <BarChart3 className="size-4.5 stroke-[1.75]" />
                      </div>
                      <h4 className="text-xs font-normal text-slate-900">Cookieless Analytics</h4>
                      <p className="text-[11px] font-light text-slate-500 mt-1 leading-normal">
                        No cookies, zero IP storage, GDPR & CCPA safe.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                      <div className="size-8 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mb-2.5">
                        <Sliders className="size-4.5 stroke-[1.75]" />
                      </div>
                      <h4 className="text-xs font-normal text-slate-900">Consent Banner</h4>
                      <p className="text-[11px] font-light text-slate-500 mt-1 leading-normal">
                        Studio banner builder with Google Consent Mode v2.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                      <div className="size-8 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center mb-2.5">
                        <Zap className="size-4.5 stroke-[1.75]" />
                      </div>
                      <h4 className="text-xs font-normal text-slate-900">Single Script Tag</h4>
                      <p className="text-[11px] font-light text-slate-500 mt-1 leading-normal">
                        Unified tag under 4KB with zero performance lag.
                      </p>
                    </div>
                  </div>

                  {/* Big Primary Button & Do it later */}
                  <div className="pt-4 space-y-3">
                    <Button
                      type="button"
                      onClick={() => goToStep("website")}
                      className="w-full h-13 sm:h-14 text-base font-normal bg-[#1868db] hover:bg-[#1559be] text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2.5"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="size-4.5" />
                    </Button>

                    <button
                      type="button"
                      onClick={handleSkipForNow}
                      className="text-xs sm:text-sm font-light text-slate-500 hover:text-slate-900 transition-colors cursor-pointer py-1 block mx-auto"
                    >
                      Do it later
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: ADD WEBSITE ================= */}
              {currentStep === "website" && (
                <form onSubmit={handleAddWebsite} className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="text-center sm:text-left space-y-2">
                    <div className="inline-flex sm:hidden mx-auto size-14 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center mb-2">
                      <Globe className="size-7 text-[#1868db]" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">
                      Add your website
                    </h2>
                    <p className="text-sm font-light text-slate-500">
                      Enter the domain you want to collect privacy-first analytics and consent for.
                    </p>
                  </div>

                  {siteError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-normal text-rose-700 flex items-center gap-2.5">
                      <XCircle className="size-4 text-rose-500 shrink-0" />
                      <span>{siteError}</span>
                    </div>
                  )}

                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="text-xs font-normal text-slate-600 block mb-1.5 uppercase tracking-wider">
                        Website Name <span className="text-slate-400 font-light lowercase">(optional)</span>
                      </label>
                      <Input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        placeholder="e.g. My Website or Production Store"
                        className="h-12 text-sm font-light bg-slate-50/80 border-slate-200 rounded-xl focus:bg-white focus:border-[#1868db] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-normal text-slate-600 block mb-1.5 uppercase tracking-wider">
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
                        className="h-12 text-sm font-light bg-slate-50/80 border-slate-200 rounded-xl focus:bg-white focus:border-[#1868db] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                      <p className="text-[11px] font-light text-slate-400 mt-1.5">
                        Enter your site root or primary domain. Works seamlessly with subdomains.
                      </p>
                    </div>
                  </div>

                  {/* Big Primary Button & Actions */}
                  <div className="pt-4 space-y-3">
                    <Button
                      type="submit"
                      disabled={isCreatingSite || !siteUrl.trim()}
                      className="w-full h-13 sm:h-14 text-base font-normal bg-[#1868db] hover:bg-[#1559be] text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
                    >
                      {isCreatingSite ? (
                        <>
                          <Loader2 className="size-4.5 animate-spin" />
                          <span>Adding website...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Installation</span>
                          <ArrowRight className="size-4.5" />
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => goToStep("welcome")}
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-light text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="size-4" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSkipForNow}
                        className="text-xs sm:text-sm font-light text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        Do it later
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ================= STEP 3: INSTALL SCRIPT ================= */}
              {(currentStep === "install" || currentStep === "verify") && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">
                        Install the UpFront script
                      </h2>
                      <p className="text-sm font-light text-slate-500">
                        Add this single snippet to the <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">&lt;head&gt;</code> of your website.
                      </p>
                    </div>
                    {siteDomain && (
                      <span className="self-start sm:self-center text-xs font-normal text-[#1868db] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 font-mono">
                        {siteDomain}
                      </span>
                    )}
                  </div>

                  {/* Code Snippet Box with Big Copy Button */}
                  <div className="relative rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 p-5 shadow-inner">
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-normal text-white transition-all cursor-pointer border border-white/10 shadow-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3.5 text-emerald-400 stroke-[2.5]" />
                          <span className="text-emerald-300 font-normal">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 text-slate-300" />
                          <span>Copy Snippet</span>
                        </>
                      )}
                    </button>

                    <pre className="font-mono text-xs sm:text-sm overflow-x-auto pr-24 py-2 leading-relaxed text-slate-200 select-all whitespace-pre-wrap break-all">
                      <code>{scriptSnippet}</code>
                    </pre>
                  </div>

                  {/* Verification Status Banner */}
                  {verificationResult && (
                    <div
                      className={cn(
                        "p-4 rounded-2xl border text-xs font-normal flex items-start gap-3 animate-in fade-in-50 duration-200",
                        verificationResult.success
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-amber-50 border-amber-200 text-amber-900"
                      )}
                    >
                      {verificationResult.success ? (
                        <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <p className="font-normal text-sm">{verificationResult.message}</p>
                        {verificationResult.detail && (
                          <p className="text-xs font-light opacity-90">{verificationResult.detail}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Big Primary Button & Actions */}
                  <div className="pt-3 space-y-3">
                    <Button
                      type="button"
                      disabled={isVerifying}
                      onClick={handleVerifyInstallation}
                      className="w-full h-13 sm:h-14 text-base font-normal bg-[#1868db] hover:bg-[#1559be] text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2.5"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="size-4.5 animate-spin" />
                          <span>Checking script connection...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-5 stroke-[1.75]" />
                          <span>
                            {verificationResult && !verificationResult.success
                              ? "Try Verification Again"
                              : "Verify Installation"}
                          </span>
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => goToStep("website")}
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-light text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="size-4" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSkipForNow}
                        className="text-xs sm:text-sm font-light text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        I&apos;ll do this later
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: COMPLETED ================= */}
              {currentStep === "completed" && (
                <div className="space-y-8 text-center animate-in fade-in-50 duration-300">
                  <div className="mx-auto size-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="size-11 text-emerald-600 animate-in zoom-in-75 duration-300 stroke-[1.75]" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
                      Your website is connected!
                    </h2>
                    <p className="text-sm font-light text-slate-500 max-w-md mx-auto leading-relaxed">
                      UpFront is active on <span className="font-normal text-slate-800 font-mono">{siteDomain}</span>. You can now monitor live traffic and manage cookie consent policies.
                    </p>
                  </div>

                  {/* Next Step Exploration Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left pt-2">
                    <button
                      type="button"
                      onClick={() => handleFinishOnboarding("/analytics")}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-blue-50/70 hover:border-blue-200 transition-all text-left cursor-pointer group"
                    >
                      <div className="size-9 rounded-xl bg-blue-100/80 text-[#1868db] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <BarChart3 className="size-4.5 stroke-[1.75]" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-normal text-slate-900 group-hover:text-[#1868db]">
                        View Analytics
                      </h4>
                      <p className="text-xs font-light text-slate-500 mt-1 leading-normal">
                        Monitor realtime cookieless visitor traffic
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFinishOnboarding("/consent")}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-indigo-50/70 hover:border-indigo-200 transition-all text-left cursor-pointer group"
                    >
                      <div className="size-9 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Sliders className="size-4.5 stroke-[1.75]" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-normal text-slate-900 group-hover:text-indigo-600">
                        Configure Consent
                      </h4>
                      <p className="text-xs font-light text-slate-500 mt-1 leading-normal">
                        Style and customize banner in Studio
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFinishOnboarding("/consent/scanner")}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-emerald-50/70 hover:border-emerald-200 transition-all text-left cursor-pointer group"
                    >
                      <div className="size-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Search className="size-4.5 stroke-[1.75]" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-normal text-slate-900 group-hover:text-emerald-600">
                        Scan Website
                      </h4>
                      <p className="text-xs font-light text-slate-500 mt-1 leading-normal">
                        Run an automated tracker audit
                      </p>
                    </button>
                  </div>

                  {/* Big Primary Button */}
                  <div className="pt-4">
                    <Button
                      type="button"
                      onClick={() => handleFinishOnboarding("/analytics")}
                      className="w-full h-13 sm:h-14 text-base font-normal bg-[#1868db] hover:bg-[#1559be] text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2.5"
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight className="size-4.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
