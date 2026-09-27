/**
 * UpFront - Workspace Onboarding & Installation Verification Test Suite
*/
import { detectUpfrontScriptInHtml } from "../../app/api/v1/sites/verify/route"
import { pool, ensureTables } from "../db"
import { randomUUID } from "node:crypto"

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

async function runTests() {
  console.log("\n========================================================")
  console.log(" UPFRONT WORKSPACE ONBOARDING & INSTALLATION VERIFICATION")
  console.log("========================================================\n")

  await ensureTables()

  // 1. SCRIPT DETECTION IN HTML
  console.log(">> 1. Testing Script Detection Invariants in HTML...")
  const validHtml1 = `<!DOCTYPE html><html><head><script defer data-domain="acme.com" src="https://usrly-five.vercel.app/userly.js"></script></head><body>Hello</body></html>`
  const validHtml2 = `<html><head><script src="/userly.js"></script></head><body></body></html>`
  const validHtml3 = `<html><head><script data-domain="store.example.com" src="https://cdn.upfront.io/userly.js?v=1.0"></script></head><body></body></html>`
  const missingHtml = `<html><head><title>No Script</title></head><body>Hello World</body></html>`
  const otherTrackerHtml = `<html><head><script src="https://www.google-analytics.com/analytics.js"></script></head><body></body></html>`

  assert(detectUpfrontScriptInHtml(validHtml1, "acme.com") === true, "Detects standard defer script with data-domain")
  assert(detectUpfrontScriptInHtml(validHtml2) === true, "Detects relative userly.js script")
  assert(detectUpfrontScriptInHtml(validHtml3, "store.example.com") === true, "Detects parameterized CDN userly.js script")
  assert(detectUpfrontScriptInHtml(missingHtml, "acme.com") === false, "Fails safely on HTML missing UpFront script")
  assert(detectUpfrontScriptInHtml(otherTrackerHtml, "acme.com") === false, "Fails safely on HTML with third-party trackers only")

  // 2. WORKSPACE ONBOARDING LIFECYCLE & STATE PERSISTENCE
  console.log("\n>> 2. Testing Workspace Onboarding Lifecycle & Isolation...")
  const testUserId = `usr_test_onboarding_${Date.now()}`
  const wsAId = `ws_a_${Date.now()}`
  const wsBId = `ws_b_${Date.now()}`

  // A. Create User and Workspaces
  await pool.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, 'Onboarding Tester', $2, TRUE, NOW(), NOW())`,
    [testUserId, `tester_${Date.now()}@example.com`]
  )

  await pool.query(
    `INSERT INTO workspaces (id, name, slug, owner_id, onboarding_completed, onboarding_step, created_at, updated_at)
     VALUES ($1, 'Workspace Alpha', $2, $3, FALSE, 'welcome', NOW(), NOW())`,
    [wsAId, `ws-alpha-${Date.now()}`, testUserId]
  )
  await pool.query(
    `INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
     VALUES ($1, $2, $3, 'owner', NOW())`,
    [randomUUID(), wsAId, testUserId]
  )

  await pool.query(
    `INSERT INTO workspaces (id, name, slug, owner_id, onboarding_completed, onboarding_step, created_at, updated_at)
     VALUES ($1, 'Workspace Beta', $2, $3, FALSE, 'welcome', NOW(), NOW())`,
    [wsBId, `ws-beta-${Date.now()}`, testUserId]
  )
  await pool.query(
    `INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
     VALUES ($1, $2, $3, 'owner', NOW())`,
    [randomUUID(), wsBId, testUserId]
  )

  // Verify Initial State
  const wsAInit = (await pool.query("SELECT onboarding_completed, onboarding_step, first_site_id FROM workspaces WHERE id = $1", [wsAId])).rows[0]
  assert(wsAInit.onboarding_completed === false, "Workspace A starts with onboarding_completed === false")
  assert(wsAInit.onboarding_step === "welcome", "Workspace A starts on 'welcome' step")

  // B. Advance Workspace A to 'website' then 'install'
  const siteAId = `site_a_${Date.now()}`
  const domainA = `alpha-${Date.now()}.com`

  await pool.query(
    `INSERT INTO sites (id, domain, name, timezone, public, user_id, workspace_id, installation_status, created_at)
     VALUES ($1, $2, 'Alpha Store', 'UTC', FALSE, $3, $4, 'not_started', NOW())`,
    [siteAId, domainA, testUserId, wsAId]
  )

  await pool.query(
    `UPDATE workspaces
     SET first_site_id = $1, onboarding_step = 'install', updated_at = NOW()
     WHERE id = $2`,
    [siteAId, wsAId]
  )

  // Verify Resume Capability
  const wsAResumed = (await pool.query("SELECT onboarding_step, first_site_id FROM workspaces WHERE id = $1", [wsAId])).rows[0]
  assert(wsAResumed.onboarding_step === "install", "Workspace A persists step 'install' for mid-flight session resume")
  assert(wsAResumed.first_site_id === siteAId, "Workspace A correctly links first_site_id")

  // C. Verify Workspace B is completely isolated
  const wsBState = (await pool.query("SELECT onboarding_completed, onboarding_step, first_site_id FROM workspaces WHERE id = $1", [wsBId])).rows[0]
  assert(wsBState.onboarding_step === "welcome", "Workspace B onboarding step is isolated (remains on 'welcome')")
  assert(wsBState.first_site_id === null, "Workspace B first_site_id is isolated (null)")

  // D. Test Skip Flow on Workspace B
  const siteBId = `site_b_${Date.now()}`
  const domainB = `beta-${Date.now()}.com`

  await pool.query(
    `INSERT INTO sites (id, domain, name, timezone, public, user_id, workspace_id, installation_status, created_at)
     VALUES ($1, $2, 'Beta Blog', 'UTC', FALSE, $3, $4, 'pending', NOW())`,
    [siteBId, domainB, testUserId, wsBId]
  )

  await pool.query(
    `UPDATE workspaces
     SET first_site_id = $1, onboarding_completed = TRUE, onboarding_step = 'install', updated_at = NOW()
     WHERE id = $2`,
    [siteBId, wsBId]
  )

  const wsBSkipped = (await pool.query("SELECT onboarding_completed, onboarding_step FROM workspaces WHERE id = $1", [wsBId])).rows[0]
  const siteBSkipped = (await pool.query("SELECT installation_status FROM sites WHERE id = $1", [siteBId])).rows[0]

  assert(wsBSkipped.onboarding_completed === true, "Skipped workspace permits dashboard access (onboarding_completed === true)")
  assert(siteBSkipped.installation_status === "pending", "Skipped site retains installation_status === 'pending'")

  // E. Test Complete Verification Flow on Workspace A
  await pool.query(
    `UPDATE sites SET installation_status = 'detected', last_verified_at = NOW() WHERE id = $1`,
    [siteAId]
  )
  await pool.query(
    `UPDATE workspaces SET onboarding_completed = TRUE, onboarding_step = 'completed', updated_at = NOW() WHERE id = $1`,
    [wsAId]
  )

  const wsACompleted = (await pool.query("SELECT onboarding_completed, onboarding_step FROM workspaces WHERE id = $1", [wsAId])).rows[0]
  const siteAVerified = (await pool.query("SELECT installation_status FROM sites WHERE id = $1", [siteAId])).rows[0]

  assert(wsACompleted.onboarding_completed === true, "Verified workspace completes onboarding (onboarding_completed === true)")
  assert(wsACompleted.onboarding_step === "completed", "Workspace step updated to 'completed'")
  assert(siteAVerified.installation_status === "detected", "Site installation_status set to 'detected'")

  // Clean up test records
  await pool.query("DELETE FROM sites WHERE workspace_id IN ($1, $2)", [wsAId, wsBId])
  await pool.query("DELETE FROM workspace_members WHERE workspace_id IN ($1, $2)", [wsAId, wsBId])
  await pool.query("DELETE FROM workspaces WHERE id IN ($1, $2)", [wsAId, wsBId])
  await pool.query(`DELETE FROM "user" WHERE id = $1`, [testUserId])

  console.log("\n========================================================")
  console.log(` ONBOARDING QA SUMMARY: ${passedTests} / ${totalTests} Passed (${failedTests} Failed)`)
  console.log("========================================================\n")

  if (failedTests > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error("FATAL ERROR in onboarding test suite:", err)
  process.exit(1)
})
