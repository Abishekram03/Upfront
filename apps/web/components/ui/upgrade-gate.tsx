"use client"

import React, { useState } from "react"
import { Crown, Sparkles, Lock } from "lucide-react"
import { useEntitlements } from "@/lib/entitlements-context"
import { type EntitlementKey, type PlanId, PLANS, getRequiredPlanForCapability } from "@/lib/billing/plans"

interface UpgradeGateProps {
  capability: EntitlementKey
  featureName?: string
  children: React.ReactNode
  className?: string
  fallback?: React.ReactNode
  showBadge?: boolean
  badgePosition?: "top-right" | "inline" | "custom"
  blur?: boolean
}

export function UpgradeGate({
  capability,
  featureName,
  children,
  className = "",
  fallback,
  showBadge = true,
  badgePosition = "top-right",
  blur = false,
}: UpgradeGateProps) {
  const { hasCapability, getRequiredPlan, openUpgradeModal } = useEntitlements()
  const [showTooltip, setShowTooltip] = useState(false)

  const isUnlocked = hasCapability(capability)
  if (isUnlocked) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const requiredPlanId = getRequiredPlan(capability)
  const requiredPlanName = PLANS[requiredPlanId]?.name || "Growth"
  const displayName = featureName || "this feature"
  const tooltipText = `Upgrade to ${requiredPlanName} to access ${displayName}.`

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    openUpgradeModal(requiredPlanId, displayName)
  }

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleUpgradeClick}
    >
      {/* Disabled / Greyed Child Content */}
      <div
        className={`opacity-50 pointer-events-none select-none transition-all duration-200 ${
          blur ? "filter blur-[1px]" : ""
        }`}
        aria-disabled="true"
      >
        {children}
      </div>

      {/* Floating Crown Badge / Action */}
      {showBadge && (
        <div
          className={`absolute z-10 flex items-center gap-1.5 cursor-pointer ${
            badgePosition === "top-right"
              ? "top-2 right-2"
              : badgePosition === "inline"
              ? "inset-0 m-auto w-fit h-fit"
              : ""
          }`}
        >
          <span
            role="button"
            tabIndex={0}
            onClick={handleUpgradeClick}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-sm hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>{requiredPlanName}</span>
          </span>
        </div>
      )}

      {/* Popover / Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap pointer-events-none flex items-center gap-1.5 animate-in fade-in duration-150"
        >
          <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>{tooltipText}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  )
}

interface UpgradeBadgeProps {
  capability?: EntitlementKey
  requiredPlan?: PlanId
  featureName?: string
  size?: "sm" | "md"
  className?: string
  showText?: boolean
}

export function UpgradeBadge({
  capability,
  requiredPlan,
  featureName,
  size = "sm",
  className = "",
  showText = true,
}: UpgradeBadgeProps) {
  const { hasCapability, getRequiredPlan, openUpgradeModal } = useEntitlements()
  const [showTooltip, setShowTooltip] = useState(false)

  const isUnlocked = capability ? hasCapability(capability) : false
  if (capability && isUnlocked) {
    return null
  }

  const effectiveRequiredPlanId = capability
    ? getRequiredPlan(capability)
    : requiredPlan || "growth"
  const requiredPlanName = PLANS[effectiveRequiredPlanId]?.name || "Growth"
  const displayName = featureName || "this feature"
  const tooltipText = `Upgrade to ${requiredPlanName} to access ${displayName}.`

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    openUpgradeModal(effectiveRequiredPlanId, displayName)
  }

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={handleUpgradeClick}
        aria-label={tooltipText}
        className={`inline-flex items-center gap-1 rounded-full font-medium transition-all cursor-pointer ${
          size === "sm"
            ? "px-1.5 py-0.5 text-[10px] leading-tight"
            : "px-2.5 py-1 text-xs"
        } bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 shadow-sm`}
      >
        <Crown className={`${size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} text-amber-600 fill-amber-500`} />
        {showText && <span>{requiredPlanName}</span>}
      </span>

      {showTooltip && (
        <div
          role="tooltip"
          className="absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded shadow-xl whitespace-nowrap pointer-events-none flex items-center gap-1.5"
        >
          <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>{tooltipText}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  )
}
