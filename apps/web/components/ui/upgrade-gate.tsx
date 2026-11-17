"use client"

import React from "react"
import { type EntitlementKey, type PlanId } from "@/lib/billing/plans"

interface UpgradeGateProps {
  capability?: EntitlementKey
  featureName?: string
  children: React.ReactNode
  className?: string
  fallback?: React.ReactNode
  showBadge?: boolean
  badgePosition?: "top-right" | "inline" | "custom"
  blur?: boolean
}

/**
 * UpFront - Open Source Edition
 * All capabilities and features are fully unlocked. Renders children directly without gating.
 */
export function UpgradeGate({ children }: UpgradeGateProps) {
  return <>{children}</>
}

interface UpgradeBadgeProps {
  capability?: EntitlementKey
  requiredPlan?: PlanId
  featureName?: string
  variant?: "crown" | "sparkles" | "lock"
  size?: "xs" | "sm" | "md"
  className?: string
  showText?: boolean
}

/**
 * UpFront - Open Source Edition
 * Upgrade badges are hidden in open source mode.
 */
export function UpgradeBadge(_props: UpgradeBadgeProps) {
  return null
}
