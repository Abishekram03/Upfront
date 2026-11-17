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
  extraPageviewsBalance?: number
}

interface EntitlementsContextType {
  entitlements: WorkspaceEntitlementsData | null
  usage: WorkspaceUsageData | null
  plan: PlanId
  isPaid: boolean
  isPastDue: boolean
  isLoading: boolean
  isCheckingOut: PlanId | "addon_100k" | string | null
  hasCapability: (key: EntitlementKey) => boolean
  getRequiredPlan: (key: EntitlementKey) => PlanId
  refreshEntitlements: () => Promise<void>
  startCheckout: (planId?: PlanId | "addon_100k" | string) => Promise<void>
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
  const [isCheckingOut, setIsCheckingOut] = useState<PlanId | "addon_100k" | string | null>(null)

  // Upgrade Modal State (retained for backwards compatibility, modal disabled by default)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<PlanId>("growth")
  const [targetFeatureName, setTargetFeatureName] = useState<string>("")

  const refreshEntitlements = useCallback(async () => {
    const businessPlan = PLANS.business
    const defaultEntitlements: WorkspaceEntitlementsData = {
      workspaceId: activeWorkspace?.id || "ws_default",
      plan: "business",
      planConfig: businessPlan,
      status: "active",
      isPaid: true,
      isPastDue: false,
      capabilities: businessPlan.capabilities,
      limits: {
        monthlyPageviews: 100_000_000,
        retentionDays: 3650,
        pagesPerScan: 100_000,
        consentHistoryDays: 3650,
      },
    }

    const defaultUsage: WorkspaceUsageData = {
      workspaceId: activeWorkspace?.id || "ws_default",
      pageviewsThisMonth: 0,
      pageviewLimit: 100_000_000,
      pageviewPercent: 0,
      sitesCount: 0,
      activeScansCount: 0,
    }

    if (!activeWorkspace?.id) {
      setEntitlements(defaultEntitlements)
      setUsage(defaultUsage)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch(`/api/v1/billing/entitlements?workspaceId=${encodeURIComponent(activeWorkspace.id)}`)
      if (res.ok) {
        const data = await res.json()
        setEntitlements(data.entitlements || defaultEntitlements)
        setUsage(data.usage || defaultUsage)
      } else {
        setEntitlements(defaultEntitlements)
        setUsage(defaultUsage)
      }
    } catch {
      setEntitlements(defaultEntitlements)
      setUsage(defaultUsage)
    } finally {
      setIsLoading(false)
    }
  }, [activeWorkspace?.id])

  useEffect(() => {
    refreshEntitlements()
  }, [refreshEntitlements])

  const hasCapability = useCallback(
    (_key: EntitlementKey): boolean => {
      return true
    },
    []
  )

  const getRequiredPlan = useCallback((key: EntitlementKey): PlanId => {
    return getRequiredPlanForCapability(key)
  }, [])

  const startCheckout = useCallback(
    async (planToCheckout: PlanId | "addon_100k" | string = "growth") => {
      console.log("[UpFront Open Source] Checkout disabled in open source edition.")
    },
    []
  )

  const openUpgradeModal = useCallback(
    (_requiredPlan: PlanId = "growth", _featureName: string = "") => {
      // In open source edition, all features are completely unlocked
    },
    []
  )

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false)
  }, [])

  const plan: PlanId = "business"
  const isPaid = true
  const isPastDue = false

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

