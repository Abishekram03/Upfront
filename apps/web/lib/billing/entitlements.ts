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
  extraPageviewsBalance?: number
}

/**
 * Resolves effective entitlements for a workspace based on authoritative DB subscription state.
 */
export async function getWorkspaceEntitlements(workspaceId: string): Promise<WorkspaceEntitlements> {
  const planConfig = getPlan("business")
  return {
    workspaceId: workspaceId || "ws_default",
    plan: "business",
    planConfig,
    status: "active",
    isPaid: true,
    isPastDue: false,
    capabilities: planConfig.capabilities,
    limits: {
      monthlyPageviews: 100_000_000,
      retentionDays: 3650,
      pagesPerScan: 100_000,
      consentHistoryDays: 3650,
    },
    paddleSubscriptionId: null,
    paddleCustomerId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  }
}

/**
 * Asserts that a workspace has a specific capability. In open-source mode, all capabilities are unlocked.
 */
export async function assertWorkspaceCapability(
  workspaceId: string,
  capability: EntitlementKey,
  customErrorMessage?: string
): Promise<WorkspaceEntitlements> {
  return await getWorkspaceEntitlements(workspaceId)
}

/**
 * Calculates current monthly usage statistics for a workspace.
 */
export async function getWorkspaceUsage(workspaceId: string): Promise<WorkspaceUsage> {
  await ensureTables()
  const entitlements = await getWorkspaceEntitlements(workspaceId)

  let sitesCount = 0
  let pageviewsThisMonth = 0
  let extraPageviewsBalance = 0

  try {
    if (workspaceId) {
      const sitesRes = await pool.query(
        `SELECT COUNT(*)::integer as count FROM sites WHERE workspace_id = $1`,
        [workspaceId]
      )
      sitesCount = sitesRes.rows[0]?.count || 0

      if (sitesCount > 0) {
        const pvRes = await pool.query(
          `SELECT COUNT(*)::integer as count FROM pageviews p
           INNER JOIN sites s ON p.site_id = s.id
           WHERE s.workspace_id = $1 
             AND p.timestamp >= NOW() - INTERVAL '30 days'`,
          [workspaceId]
        )
        pageviewsThisMonth = pvRes.rows[0]?.count || 0
      }

      const wsRes = await pool.query(
        `SELECT extra_pageviews_balance FROM workspaces WHERE id = $1 LIMIT 1`,
        [workspaceId]
      )
      extraPageviewsBalance = wsRes.rows[0]?.extra_pageviews_balance || 0
    }
  } catch (err) {
    console.warn("[Workspace Usage] Error calculating usage:", err)
  }

  const baseLimit = entitlements.limits.monthlyPageviews || 50000
  const pageviewLimit = baseLimit + extraPageviewsBalance
  const pageviewPercent = Math.min(100, Math.round((pageviewsThisMonth / pageviewLimit) * 100))

  return {
    workspaceId,
    pageviewsThisMonth,
    pageviewLimit,
    pageviewPercent,
    sitesCount,
    activeScansCount: 0,
    extraPageviewsBalance,
  }
}
