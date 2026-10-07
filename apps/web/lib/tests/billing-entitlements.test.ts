import { PLANS, getPlan, getRequiredPlanForCapability, getPlanByPaddlePriceId, type EntitlementKey, type PlanId } from "../billing/plans"
import { getWorkspaceEntitlements, assertWorkspaceCapability, EntitlementError } from "../billing/entitlements"
import { verifyPaddleWebhookSignature, processPaddleWebhook } from "../billing/paddle"
import { pool } from "../db"
import crypto from "crypto"

// Test Harness Assertions
let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition: boolean, message: string) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✓ ${message}`)
  } else {
    failedTests++
    console.error(`  ✗ FAIL: ${message}`)
  }
}

function assertThrows(fn: () => any, message: string) {
  totalTests++
  try {
    fn()
    failedTests++
    console.error(`  ✗ FAIL: Expected function to throw: ${message}`)
  } catch (err: any) {
    passedTests++
    console.log(`  ✓ ${message} (Threw: ${err.message || err})`)
  }
}

async function runAllTests() {
  console.log("\n========================================================")
  console.log(" UPFRONT FINAL PRICING, ENTITLEMENTS & PADDLE BILLING QA")
  console.log("========================================================\n")

  // -------------------------------------------------------------------------
  // 1. PLAN & CAPABILITY DEFINITIONS SPECIFICATION
  // -------------------------------------------------------------------------
  console.log(">> 1. Testing Plan Definitions and Capability Limits...")

  // Free Tier
  assert(PLANS.free.priceMonthly === 0, "Free plan price is $0")
  assert(PLANS.free.limits.monthlyPageviews === 50000, "Free plan has 50K pageviews/month")
  assert(PLANS.free.limits.pagesPerScan === 100, "Free plan has 100 pages/scan")
  assert(PLANS.free.limits.consentHistoryDays === 30, "Free plan has 30 days consent history")
  assert(PLANS.free.capabilities["cmp.banner"] === true, "Free plan has cmp.banner")
  assert(PLANS.free.capabilities["cmp.gpc"] === false, "Free plan cmp.gpc is locked (false)")
  assert(PLANS.free.capabilities["cmp.geo_targeting"] === false, "Free plan cmp.geo_targeting is locked (false)")
  assert(PLANS.free.capabilities["cmp.google_consent_mode_v2"] === false, "Free plan cmp.google_consent_mode_v2 is locked (false)")
  assert(PLANS.free.capabilities["cmp.multilingual"] === false, "Free plan cmp.multilingual is locked (false)")
  assert(PLANS.free.capabilities["cmp.scheduled_scans"] === false, "Free plan cmp.scheduled_scans is locked (false)")
  assert(PLANS.free.capabilities["cmp.tcf_v23"] === false, "Free plan cmp.tcf_v23 is locked (false)")
  assert(PLANS.free.capabilities["cmp.custom_css"] === false, "Free plan cmp.custom_css is locked (false)")
  assert(PLANS.free.capabilities["cmp.version_history"] === false, "Free plan cmp.version_history is locked (false)")

  // Growth Tier
  assert(PLANS.growth.priceMonthly === 19, "Growth plan price is $19")
  assert(PLANS.growth.limits.monthlyPageviews === 250000, "Growth plan has 250K pageviews/month")
  assert(PLANS.growth.limits.pagesPerScan === 1000, "Growth plan has 1,000 pages/scan")
  assert(PLANS.growth.limits.consentHistoryDays === 365, "Growth plan has 365 days (12 mo) consent history")
  assert(PLANS.growth.capabilities["cmp.gpc"] === true, "Growth plan cmp.gpc is unlocked (true)")
  assert(PLANS.growth.capabilities["cmp.geo_targeting"] === true, "Growth plan cmp.geo_targeting is unlocked (true)")
  assert(PLANS.growth.capabilities["cmp.google_consent_mode_v2"] === true, "Growth plan cmp.google_consent_mode_v2 is unlocked (true)")
  assert(PLANS.growth.capabilities["cmp.multilingual"] === false, "Growth plan cmp.multilingual is locked (false)")
  assert(PLANS.growth.capabilities["cmp.scheduled_scans"] === true, "Growth plan has monthly scheduled scans")
  assert(PLANS.growth.capabilities["cmp.version_history"] === true, "Growth plan has version history & rollback")
  assert(PLANS.growth.capabilities["cmp.tcf_v23"] === false, "Growth plan cmp.tcf_v23 is locked (false)")
  assert(PLANS.growth.capabilities["cmp.custom_css"] === false, "Growth plan cmp.custom_css is locked (false)")

  // Business Tier
  assert(PLANS.business.priceMonthly === 49, "Business plan price is $49")
  assert(PLANS.business.limits.monthlyPageviews === 1000000, "Business plan has 1,000,000 pageviews/month")
  assert(PLANS.business.limits.pagesPerScan === 5000, "Business plan has 5,000 pages/scan")
  assert(PLANS.business.limits.consentHistoryDays === 730, "Business plan has 730 days (24 mo) consent history")
  assert(PLANS.business.capabilities["cmp.tcf_v23"] === true, "Business plan cmp.tcf_v23 is unlocked (true)")
  assert(PLANS.business.capabilities["cmp.custom_css"] === true, "Business plan cmp.custom_css is unlocked (true)")
  assert(PLANS.business.capabilities["cmp.multilingual"] === true, "Business plan cmp.multilingual is unlocked (true)")
  assert(PLANS.business.capabilities["cmp.scheduled_scans"] === true, "Business plan has daily/weekly scheduled scans")
  assert(PLANS.business.capabilities["cmp.gpc"] === true, "Business plan has all Growth capabilities")

  // Required plan resolution
  assert(getRequiredPlanForCapability("cmp.gpc") === "growth", "getRequiredPlanForCapability(cmp.gpc) -> growth")
  assert(getRequiredPlanForCapability("cmp.tcf_v23") === "business", "getRequiredPlanForCapability(cmp.tcf_v23) -> business")
  assert(getRequiredPlanForCapability("cmp.custom_css") === "business", "getRequiredPlanForCapability(cmp.custom_css) -> business")
  assert(getRequiredPlanForCapability("cmp.multilingual") === "business", "getRequiredPlanForCapability(cmp.multilingual) -> business")

  // -------------------------------------------------------------------------
  // 2. SERVER-SIDE ENTITLEMENT RESOLVER & ASSERTIONS
  // -------------------------------------------------------------------------
  console.log("\n>> 2. Testing Server-side Entitlement Resolver...")

  const testWorkspaceId = `test-ws-${Date.now()}`

  // Non-existent subscription should resolve to Free
  const freeEntitlements = await getWorkspaceEntitlements(testWorkspaceId)
  assert(freeEntitlements.plan === "free", "Unsubscribed workspace resolves to plan='free'")
  assert(freeEntitlements.isPaid === false, "Free workspace isPaid === false")
  assert(freeEntitlements.capabilities["cmp.tcf_v23"] === false, "Free workspace lacks cmp.tcf_v23")

  // assertWorkspaceCapability for Free
  await assertWorkspaceCapability(testWorkspaceId, "cmp.banner") // should not throw
  assert(true, "assertWorkspaceCapability for Free with cmp.banner passed")

  let threwEntitlementError = false
  try {
    await assertWorkspaceCapability(testWorkspaceId, "cmp.tcf_v23")
  } catch (err: any) {
    if (err instanceof EntitlementError) {
      threwEntitlementError = true
    }
  }
  assert(threwEntitlementError, "assertWorkspaceCapability threw EntitlementError for Free on cmp.tcf_v23")

  // -------------------------------------------------------------------------
  // 3. PADDLE WEBHOOK SIGNATURE VERIFICATION
  // -------------------------------------------------------------------------
  console.log("\n>> 3. Testing Paddle Webhook Signature Verification...")

  const webhookSecret = "test_pdl_secret_key_12345"
  process.env.PADDLE_WEBHOOK_SECRET = webhookSecret

  const rawPayload = JSON.stringify({
    event_id: "evt_test_123",
    event_type: "subscription.created",
    occurred_at: new Date().toISOString(),
    data: { id: "sub_123" }
  })
  const ts = Math.floor(Date.now() / 1000).toString()
  const signedPayload = `${ts}:${rawPayload}`
  const validH1 = crypto.createHmac("sha256", webhookSecret).update(signedPayload).digest("hex")
  const validSignatureHeader = `ts=${ts};h1=${validH1}`

  const isSigValid = verifyPaddleWebhookSignature(rawPayload, validSignatureHeader, webhookSecret)
  assert(isSigValid === true, "Valid Paddle HMAC-SHA256 signature verified successfully")

  const isBadSigValid = verifyPaddleWebhookSignature(rawPayload, `ts=${ts};h1=bad_hash`, webhookSecret)
  assert(isBadSigValid === false, "Invalid Paddle signature correctly rejected")

  const isTamperedValid = verifyPaddleWebhookSignature(rawPayload + "tampered", validSignatureHeader, webhookSecret)
  assert(isTamperedValid === false, "Tampered payload correctly rejected")

  // -------------------------------------------------------------------------
  // 4. PADDLE WEBHOOK PROCESSING & LIFECYCLE STATE MACHINE
  // -------------------------------------------------------------------------
  console.log("\n>> 4. Testing Paddle Webhook Event Lifecycle & State Machine...")

  const paddleSubId = `sub_test_${Date.now()}`
  const paddleCustomerId = `ctm_test_${Date.now()}`

  // A. subscription.created -> Growth
  const createEvent = {
    event_id: `evt_create_${Date.now()}`,
    event_type: "subscription.created",
    occurred_at: new Date(Date.now() - 10000).toISOString(),
    data: {
      id: paddleSubId,
      customer_id: paddleCustomerId,
      status: "active",
      custom_data: { workspace_id: testWorkspaceId },
      items: [
        {
          price: {
            id: process.env.PADDLE_PRICE_GROWTH || "pri_growth_monthly",
            product_id: "pro_growth"
          }
        }
      ],
      current_billing_period: {
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 30 * 86400000).toISOString()
      },
      scheduled_change: null
    }
  }

  const result1 = await processPaddleWebhook(createEvent)
  assert(result1.action === "processed", "subscription.created processed successfully")
  assert(result1.plan === "growth", "Subscription created provisioned plan='growth'")

  // Verify entitlements updated in DB
  const growthEntitlements = await getWorkspaceEntitlements(testWorkspaceId)
  assert(growthEntitlements.plan === "growth", "Workspace entitlement updated to 'growth'")
  assert(growthEntitlements.isPaid === true, "Growth workspace isPaid === true")
  assert(growthEntitlements.capabilities["cmp.gpc"] === true, "Growth workspace has cmp.gpc unlocked")
  assert(growthEntitlements.capabilities["cmp.geo_targeting"] === true, "Growth workspace has cmp.geo_targeting unlocked")
  assert(growthEntitlements.capabilities["cmp.tcf_v23"] === false, "Growth workspace still locks cmp.tcf_v23")

  // B. Deduplication: Duplicate Event ID
  const dupResult = await processPaddleWebhook(createEvent)
  assert(dupResult.action === "deduplicated", "Duplicate event_id correctly detected and skipped idempotently")

  // C. Out-of-Order Event Protection
  const staleEvent = {
    event_id: `evt_stale_${Date.now()}`,
    event_type: "subscription.updated",
    occurred_at: new Date(Date.now() - 60000).toISOString(), // older than createEvent
    data: {
      ...createEvent.data,
      status: "past_due"
    }
  }
  const staleResult = await processPaddleWebhook(staleEvent)
  assert(staleResult.action === "skipped_out_of_order", "Stale/out-of-order event correctly detected and skipped")

  // D. Upgrade: Growth -> Business (subscription.updated)
  const upgradeEvent = {
    event_id: `evt_upgrade_${Date.now()}`,
    event_type: "subscription.updated",
    occurred_at: new Date().toISOString(),
    data: {
      id: paddleSubId,
      customer_id: paddleCustomerId,
      status: "active",
      custom_data: { workspace_id: testWorkspaceId },
      items: [
        {
          price: {
            id: process.env.PADDLE_PRICE_BUSINESS || "pri_business_monthly",
            product_id: "pro_business"
          }
        }
      ],
      current_billing_period: {
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 30 * 86400000).toISOString()
      },
      scheduled_change: null
    }
  }
  const resultUpgrade = await processPaddleWebhook(upgradeEvent)
  assert(resultUpgrade.action === "processed", "subscription.updated (upgrade to Business) processed successfully")

  const businessEntitlements = await getWorkspaceEntitlements(testWorkspaceId)
  assert(businessEntitlements.plan === "business", "Workspace entitlement updated to 'business'")
  assert(businessEntitlements.capabilities["cmp.tcf_v23"] === true, "Business workspace has cmp.tcf_v23 unlocked")
  assert(businessEntitlements.capabilities["cmp.custom_css"] === true, "Business workspace has cmp.custom_css unlocked")

  // E. Past Due Handling
  const pastDueEvent = {
    event_id: `evt_past_due_${Date.now()}`,
    event_type: "subscription.past_due",
    occurred_at: new Date(Date.now() + 1000).toISOString(),
    data: {
      ...upgradeEvent.data,
      status: "past_due"
    }
  }
  await processPaddleWebhook(pastDueEvent)
  const pastDueEntitlements = await getWorkspaceEntitlements(testWorkspaceId)
  assert(pastDueEntitlements.isPastDue === true, "isPastDue === true on past_due event")
  assert(pastDueEntitlements.isPaid === true, "Retains paid access during past_due grace period")

  // F. Cancellation: subscription.canceled -> fallback to Free
  const cancelEvent = {
    event_id: `evt_cancel_${Date.now()}`,
    event_type: "subscription.canceled",
    occurred_at: new Date(Date.now() + 2000).toISOString(),
    data: {
      ...upgradeEvent.data,
      status: "canceled"
    }
  }
  await processPaddleWebhook(cancelEvent)
  const canceledEntitlements = await getWorkspaceEntitlements(testWorkspaceId)
  assert(canceledEntitlements.plan === "free", "Canceled subscription immediately revokes to plan='free'")
  assert(canceledEntitlements.isPaid === false, "Canceled subscription isPaid === false")
  assert(canceledEntitlements.capabilities["cmp.tcf_v23"] === false, "TCF v2.3 locked after cancellation")

  // Clean up test records
  await pool.query("DELETE FROM subscriptions WHERE workspace_id = $1", [testWorkspaceId])
  await pool.query("DELETE FROM billing_events WHERE payload::text LIKE $1", [`%${testWorkspaceId}%`])

  console.log("\n========================================================")
  console.log(` BILLING TEST SUMMARY: ${passedTests} / ${totalTests} Passed (${failedTests} Failed)`)
  console.log("========================================================\n")

  if (failedTests > 0) {
    process.exit(1)
  }
}

runAllTests().catch((err) => {
  console.error("FATAL ERROR in billing tests:", err)
  process.exit(1)
})
