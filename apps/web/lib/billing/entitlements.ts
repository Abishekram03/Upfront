/**
 * UpFront - Centralized Server-Side Entitlements Engine
 *
 * Resolves workspace plan, capability entitlements, usage limits, and gate assertions.
 * NEVER trusts frontend plan values. All access control queries DB subscription state.
 */

import { pool, ensureTables } from "../db"
import {
  PLANS,
  type PlanId,
  type PlanConfig,
  type EntitlementKey,
  type SubscriptionStatus,
  getPlan,
  getRequiredPlanForCapability,
} from "./plans"

export class EntitlementError extends Error {
  statusCode: number
  requiredPlan: PlanId
  capability: EntitlementKey

  constructor(capability: EntitlementKey, requiredPlan: PlanId, customMessage?: string) {
    const planName = PLANS[requiredPlan]?.name || requiredPlan
    const message =
      customMessage ||
      `This feature requires the ${planName} plan. Upgrade your workspace to unlock ${capability}.`
    super(message)
    this.name = "EntitlementError"
    this.statusCode = 403
    this.requiredPlan = requiredPlan
    this.capability = capability
  }
}

export interface WorkspaceEntitlements {
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

export interface WorkspaceUsage {
  workspaceId: string
  pageviewsThisMonth: number
  pageviewLimit: number
  pageviewPercent: number
  sitesCount: number
  activeScansCount: number
}

/**
 * Resolves effective entitlements for a workspace based on authoritative DB subscription state.
 */
export async function getWorkspaceEntitlements(workspaceId: string): Promise<WorkspaceEntitlements> {
  await ensureTables()

  if (!workspaceId) {
    const freePlan = PLANS.free
    return {
      workspaceId: "",
      plan: "free",
      planConfig: freePlan,
      status: "active",
      isPaid: false,
      isPastDue: false,
      capabilities: freePlan.capabilities,
      limits: freePlan.limits,
    }
  }

  const subRes = await pool.query(
    `SELECT * FROM subscriptions WHERE workspace_id = $1 LIMIT 1`,
    [workspaceId]
  )

  let rawPlan: PlanId = "free"
  let status: SubscriptionStatus = "active"
  let paddleSubscriptionId: string | null = null
  let paddleCustomerId: string | null = null
  let currentPeriodStart: string | null = null
  let currentPeriodEnd: string | null = null
  let cancelAtPeriodEnd = false

  if (subRes.rows.length > 0) {
    const sub = subRes.rows[0]
    rawPlan = (sub.plan as PlanId) || "free"
    status = (sub.status as SubscriptionStatus) || "active"
    paddleSubscriptionId = sub.paddle_subscription_id || null
    paddleCustomerId = sub.paddle_customer_id || null
    currentPeriodStart = sub.current_period_start ? new Date(sub.current_period_start).toISOString() : null
    currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end).toISOString() : null
    cancelAtPeriodEnd = !!sub.cancel_at_period_end
  }

  // Determine effective plan based on subscription status
  // active / trialing = full plan access
  // past_due = retain access with billing warning
  // paused / canceled = fallback to Free plan
  let effectivePlanId: PlanId = "free"
  if (status === "active" || status === "trialing" || status === "past_due") {
    effectivePlanId = rawPlan
  } else {
    effectivePlanId = "free"
  }

  const planConfig = getPlan(effectivePlanId)
  const isPaid = effectivePlanId !== "free" && (status === "active" || status === "trialing" || status === "past_due")
  const isPastDue = status === "past_due"

  return {
    workspaceId,
    plan: effectivePlanId,
    planConfig,
    status,
    isPaid,
    isPastDue,
    capabilities: planConfig.capabilities,
    limits: planConfig.limits,
    paddleSubscriptionId,
    paddleCustomerId,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  }
}

/**
 * Asserts that a workspace has a specific capability. Throws EntitlementError if missing.
 */
export async function assertWorkspaceCapability(
  workspaceId: string,
  capability: EntitlementKey,
  customErrorMessage?: string
): Promise<WorkspaceEntitlements> {
  const entitlements = await getWorkspaceEntitlements(workspaceId)
  const hasAccess = !!entitlements.capabilities[capability]

  if (!hasAccess) {
    const requiredPlan = getRequiredPlanForCapability(capability)
    throw new EntitlementError(capability, requiredPlan, customErrorMessage)
  }

  return entitlements
}

/**
 * Calculates current monthly usage statistics for a workspace.
 */
export async function getWorkspaceUsage(workspaceId: string): Promise<WorkspaceUsage> {
  await ensureTables()
  const entitlements = await getWorkspaceEntitlements(workspaceId)

  // 1. Get sites in this workspace
  const sitesRes = await pool.query(
    `SELECT id, domain FROM sites WHERE workspace_id = $1`,
    [workspaceId]
  )
  const sitesCount = sitesRes.rows.length
  const siteIds = sitesRes.rows.map((r) => r.id)

  let pageviewsThisMonth = 0
  if (siteIds.length > 0) {
    // 2. Count pageviews across all sites in the last 30 days
    const pvRes = await pool.query(
      `SELECT COUNT(*)::integer as count FROM pageviews 
       WHERE site_id = ANY($1) 
         AND timestamp >= NOW() - INTERVAL '30 days'`,
      [siteIds]
    )
    pageviewsThisMonth = pvRes.rows[0]?.count || 0
  }

  const pageviewLimit = entitlements.limits.monthlyPageviews
  const pageviewPercent = Math.min(100, Math.round((pageviewsThisMonth / pageviewLimit) * 100))

  return {
    workspaceId,
    pageviewsThisMonth,
    pageviewLimit,
    pageviewPercent,
    sitesCount,
    activeScansCount: 0,
  }
}
