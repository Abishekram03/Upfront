"use client"

import React, { useState } from "react"
import { Crown, Check, X, Sparkles, Zap, Shield, ArrowRight, Loader2 } from "lucide-react"
import { useEntitlements } from "@/lib/entitlements-context"
import { useWorkspace } from "@/lib/workspace-context"
import { PLANS, PADDLE_PRICE_IDS, type PlanId } from "@/lib/billing/plans"
import { openPaddleCheckout } from "@/lib/billing/paddle-client"

export function UpgradeModal() {
  const {
    isUpgradeModalOpen,
    closeUpgradeModal,
    targetUpgradePlan,
    targetFeatureName,
    plan: currentPlan,
    refreshEntitlements,
  } = useEntitlements()
  const { activeWorkspace } = useWorkspace()
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(targetUpgradePlan || "growth")
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Keep selected plan synced with targetUpgradePlan whenever modal opens
  React.useEffect(() => {
    if (isUpgradeModalOpen && targetUpgradePlan) {
      setSelectedPlan(targetUpgradePlan)
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [isUpgradeModalOpen, targetUpgradePlan])

  if (!isUpgradeModalOpen) return null

  const handleCheckout = async (planToCheckout: PlanId) => {
    if (!activeWorkspace?.id) {
      setErrorMessage("Please select a workspace before upgrading.")
      return
    }

    try {
      setIsProcessing(true)
      setErrorMessage(null)

      // Fetch checkout configuration / user details
      const res = await fetch(`/api/v1/billing/subscription?workspaceId=${encodeURIComponent(activeWorkspace.id)}`)
      const data = await res.json().catch(() => ({}))

      const targetPriceId =
        data?.plans?.[planToCheckout]?.paddlePriceId ||
        (planToCheckout === "business"
          ? (process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID || PADDLE_PRICE_IDS.business)
          : (process.env.NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID || PADDLE_PRICE_IDS.growth))

      await openPaddleCheckout({
        priceId: targetPriceId,
        plan: planToCheckout,
        workspaceId: activeWorkspace.id,
        userEmail: data?.userEmail,
        onSuccess: async () => {
          setIsProcessing(false)
          setSuccessMessage(`🎉 Subscription updated to ${PLANS[planToCheckout].name}! Provisioning features...`)
          await refreshEntitlements()
          setTimeout(() => {
            closeUpgradeModal()
          }, 1800)
        },
        onError: (errText?: string) => {
          setIsProcessing(false)
          setErrorMessage(errText || "Payment checkout could not be processed. Please check your card or try again.")
        },
        onClose: () => {
          setIsProcessing(false)
        },
      })
    } catch (err: any) {
      console.error("Checkout error:", err)
      setErrorMessage(err.message || "Failed to initialize checkout. Please try again.")
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-700">
              <Crown className="w-6 h-6 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Upgrade Your UpFront Plan
              </h2>
              <p className="text-xs text-slate-500">
                {targetFeatureName
                  ? `Unlock ${targetFeatureName} and supercharge your compliance & analytics.`
                  : "Choose the right plan to scale your analytics and consent management."}
              </p>
            </div>
          </div>
          <button
            onClick={closeUpgradeModal}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Growth Tier */}
            <div
              onClick={() => setSelectedPlan("growth")}
              className={`relative rounded-2xl border p-6 flex flex-col justify-between cursor-pointer transition-all ${
                selectedPlan === "growth"
                  ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20 shadow-md"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              {selectedPlan === "growth" && (
                <div className="absolute -top-3 right-4 px-3 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-full shadow-sm">
                  SELECTED
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Growth</h3>
                  </div>
                  {currentPlan === "growth" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Current Plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Full consent management for growing websites.
                </p>

                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">$19</span>
                  <span className="text-sm text-slate-500 ml-1">/month</span>
                </div>

                <div className="mt-5 space-y-2.5">
                  <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Everything in Free, plus:
                  </div>
                  {[
                    "Unlimited websites",
                    "250,000 pageviews/month",
                    "12 months analytics history",
                    "1,000 pages per cookie scan",
                    "12-month consent history",
                    "Global Privacy Control (GPC)",
                    "Geo-targeting (EU / US / Global)",
                    "Google Consent Mode v2",
                    "Full multi-language translations",
                    "Monthly scheduled scans",
                    "Version history & instant rollback",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentPlan === "growth" || isProcessing}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCheckout("growth")
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all ${
                    currentPlan === "growth"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isProcessing && selectedPlan === "growth" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Paddle Checkout...</span>
                    </>
                  ) : currentPlan === "growth" ? (
                    "Current Plan"
                  ) : (
                    <>
                      <span>Upgrade to Growth</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Business Tier */}
            <div
              onClick={() => setSelectedPlan("business")}
              className={`relative rounded-2xl border p-6 flex flex-col justify-between cursor-pointer transition-all ${
                selectedPlan === "business"
                  ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 shadow-md"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="absolute -top-3 right-4 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-bold rounded-full shadow-sm flex items-center gap-1">
                <Crown className="w-3 h-3 fill-white" />
                <span>POPULAR FOR ENTERPRISE</span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-slate-900">Business</h3>
                  </div>
                  {currentPlan === "business" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Current Plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Advanced compliance and total customization.
                </p>

                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">$49</span>
                  <span className="text-sm text-slate-500 ml-1">/month</span>
                </div>

                <div className="mt-5 space-y-2.5">
                  <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Everything in Growth, plus:
                  </div>
                  {[
                    "Unlimited websites",
                    "1,000,000 pageviews/month",
                    "24 months analytics history",
                    "5,000 pages per cookie scan",
                    "24-month consent history",
                    "IAB TCF v2.3 certified framework",
                    "Custom CSS & branding injection",
                    "Weekly & daily scheduled scans",
                    "Full priority enterprise compliance",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentPlan === "business" || isProcessing}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCheckout("business")
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all ${
                    currentPlan === "business"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                  }`}
                >
                  {isProcessing && selectedPlan === "business" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Paddle Checkout...</span>
                    </>
                  ) : currentPlan === "business" ? (
                    "Current Plan"
                  ) : (
                    <>
                      <span>Upgrade to Business</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-between">
          <span>🔒 Secured via Paddle. Cancel or change anytime without lock-in.</span>
          <a
            href="/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            View full pricing breakdown &rarr;
          </a>
        </div>
      </div>
    </div>
  )
}
