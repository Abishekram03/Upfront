"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useWorkspace } from "@/lib/workspace-context"
import {
  type PlanId,
  type EntitlementKey,
  type SubscriptionStatus,
  type PlanConfig,
  PLANS,
  getPlan,
  getRequiredPlanForCapability,
} from "@/lib/billing/plans"

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
  hasCapability: (key: EntitlementKey) => boolean
  getRequiredPlan: (key: EntitlementKey) => PlanId
  refreshEntitlements: () => Promise<void>
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

  // Upgrade Modal State
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

  const openUpgradeModal = useCallback((requiredPlan: PlanId = "growth", featureName: string = "") => {
    setTargetUpgradePlan(requiredPlan)
    setTargetFeatureName(featureName)
    setIsUpgradeModalOpen(true)
  }, [])

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
        hasCapability,
        getRequiredPlan,
        refreshEntitlements,
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
