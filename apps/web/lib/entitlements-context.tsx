"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useWorkspace } from "@/lib/workspace-context"
import {
  type PlanId,
  type EntitlementKey,
  type SubscriptionStatus,
  type PlanConfig,
  PLANS,
  PADDLE_PRICE_IDS,
  getPlan,
  getRequiredPlanForCapability,
} from "@/lib/billing/plans"
import { openPaddleCheckout } from "@/lib/billing/paddle-client"

export interface WorkspaceEntitlementsData {
  workspaceId: string
  plan: PlanId
  planConfig: PlanConfig
  status: SubscriptionStatus
  isPaid: boolean
  isPastDue: boolean
  capabilities: Record<EntitlementKey, any>
  limits: PlanConfig["limits"]
  paddleSubscriptionId?: string | null
  paddleCustomerId?: string | null
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
}

export interface WorkspaceUsageData {
  workspaceId: string
  pageviewsThisMonth: number
  pageviewLimit: number
  pageviewPercent: number
  sitesCount: number
  activeScansCount: number
}

interface EntitlementsContextType {
  entitlements: WorkspaceEntitlementsData | null
  usage: WorkspaceUsageData | null
  plan: PlanId
  isPaid: boolean
  isPastDue: boolean
  isLoading: boolean
  isCheckingOut: PlanId | null
  hasCapability: (key: EntitlementKey) => boolean
  getRequiredPlan: (key: EntitlementKey) => PlanId
  refreshEntitlements: () => Promise<void>
  startCheckout: (planId?: PlanId) => Promise<void>
  openUpgradeModal: (requiredPlan?: PlanId, featureName?: string) => void
  closeUpgradeModal: () => void
  isUpgradeModalOpen: boolean
  targetUpgradePlan: PlanId
  targetFeatureName: string
}

const EntitlementsContext = createContext<EntitlementsContextType | undefined>(undefined)

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const { activeWorkspace } = useWorkspace()
  const [entitlements, setEntitlements] = useState<WorkspaceEntitlementsData | null>(null)
  const [usage, setUsage] = useState<WorkspaceUsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingOut, setIsCheckingOut] = useState<PlanId | null>(null)

  // Upgrade Modal State (retained for backwards compatibility, modal disabled by default)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<PlanId>("growth")
  const [targetFeatureName, setTargetFeatureName] = useState<string>("")

  const refreshEntitlements = useCallback(async () => {
    if (!activeWorkspace?.id) {
      const freePlan = PLANS.free
      setEntitlements({
        workspaceId: "",
        plan: "free",
        planConfig: freePlan,
        status: "active",
        isPaid: false,
        isPastDue: false,
        capabilities: freePlan.capabilities,
        limits: freePlan.limits,
      })
      setUsage({
        workspaceId: "",
        pageviewsThisMonth: 0,
        pageviewLimit: 50000,
        pageviewPercent: 0,
        sitesCount: 0,
        activeScansCount: 0,
      })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch(`/api/v1/billing/entitlements?workspaceId=${encodeURIComponent(activeWorkspace.id)}`)
      if (res.ok) {
        const data = await res.json()
        setEntitlements(data.entitlements)
        setUsage(data.usage)
      } else {
        // Fallback to Free
        const freePlan = PLANS.free
        setEntitlements({
          workspaceId: activeWorkspace.id,
          plan: "free",
          planConfig: freePlan,
          status: "active",
          isPaid: false,
          isPastDue: false,
          capabilities: freePlan.capabilities,
          limits: freePlan.limits,
        })
      }
    } catch (err) {
      console.error("Failed to load workspace entitlements:", err)
    } finally {
      setIsLoading(false)
    }
  }, [activeWorkspace?.id])

  useEffect(() => {
    refreshEntitlements()
  }, [refreshEntitlements])

  const hasCapability = useCallback(
    (key: EntitlementKey): boolean => {
      if (!entitlements) return !!PLANS.free.capabilities[key]
      return !!entitlements.capabilities[key]
    },
    [entitlements]
  )

  const getRequiredPlan = useCallback((key: EntitlementKey): PlanId => {
    return getRequiredPlanForCapability(key)
  }, [])

  const startCheckout = useCallback(
    async (planToCheckout: PlanId = "growth") => {
      if (!activeWorkspace?.id) {
        alert("Please select a workspace before upgrading.")
        return
      }

      try {
        setIsCheckingOut(planToCheckout)
        const targetPriceId =
          planToCheckout === "business"
            ? PADDLE_PRICE_IDS.business
            : PADDLE_PRICE_IDS.growth

        const res = await fetch(
          `/api/v1/billing/subscription?workspaceId=${encodeURIComponent(activeWorkspace.id)}`
        )
        const data = await res.json().catch(() => ({}))

        await openPaddleCheckout({
          priceId: targetPriceId,
          plan: planToCheckout,
          workspaceId: activeWorkspace.id,
          userEmail: data?.userEmail,
          onSuccess: async () => {
            setIsCheckingOut(null)
            await refreshEntitlements()
          },
          onError: (errText?: string) => {
            setIsCheckingOut(null)
            console.error("[Checkout error]", errText)
            alert(errText || "Payment checkout could not be processed. Please try again.")
          },
          onClose: () => {
            setIsCheckingOut(null)
          },
        })
      } catch (err: any) {
        setIsCheckingOut(null)
        console.error("Failed to start direct checkout:", err)
        alert(err.message || "Failed to initialize payment checkout.")
      }
    },
    [activeWorkspace?.id, refreshEntitlements]
  )

  // Direct checkout: immediately launches checkout without intermediate wizard modal
  const openUpgradeModal = useCallback(
    (requiredPlan: PlanId = "growth", featureName: string = "") => {
      setTargetUpgradePlan(requiredPlan)
      setTargetFeatureName(featureName)
      startCheckout(requiredPlan)
    },
    [startCheckout]
  )

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false)
  }, [])

  const plan: PlanId = entitlements?.plan || "free"
  const isPaid = !!entitlements?.isPaid
  const isPastDue = !!entitlements?.isPastDue

  return (
    <EntitlementsContext.Provider
      value={{
        entitlements,
        usage,
        plan,
        isPaid,
        isPastDue,
        isLoading,
        isCheckingOut,
        hasCapability,
        getRequiredPlan,
        refreshEntitlements,
        startCheckout,
        openUpgradeModal,
        closeUpgradeModal,
        isUpgradeModalOpen,
        targetUpgradePlan,
        targetFeatureName,
      }}
    >
      {children}
    </EntitlementsContext.Provider>
  )
}

export function useEntitlements() {
  const context = useContext(EntitlementsContext)
  if (!context) {
    throw new Error("useEntitlements must be used within an EntitlementsProvider")
  }
  return context
}

