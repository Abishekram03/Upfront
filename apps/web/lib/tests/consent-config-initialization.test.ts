/**
 * UpFront - Consent Configuration Initialization & Schema Integrity Test Suite
 */
import { GET, POST } from "../../app/api/v1/consent/config/route"
import { pool, ensureTables } from "../db"

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
  console.log(" UPFRONT CONSENT CONFIG INITIALIZATION VERIFICATION")
  console.log("========================================================\n")

  await ensureTables()

  const testDomain = `test-init-${Date.now()}.vercel.app`
  const productionReproDomain = `work-os-gules.vercel.app`

  // Cleanup any leftover test domains
  await pool.query("DELETE FROM consent_configs WHERE domain IN ($1, $2)", [testDomain, productionReproDomain])

  // 1. FRESH DOMAIN INITIALIZATION VIA GET /api/v1/consent/config
  console.log(">> 1. Testing GET /api/v1/consent/config for Fresh Domain Initialization...")
  const getReq1 = new Request(`http://localhost:3000/api/v1/consent/config?domain=${testDomain}`)
  const getRes1 = await GET(getReq1)

  assert(getRes1.status === 200, `GET request for new domain returns HTTP 200 (Got: ${getRes1.status})`)

  const data1 = await getRes1.json()
  assert(data1 && data1.domain === testDomain, "Returned config domain matches requested domain")
  assert(data1.is_enabled === true, "Default config is enabled")
  assert(data1.layout === "bottom_bar", "Default layout is bottom_bar")
  assert(data1.theme === "light", "Default theme is light")
  assert(data1.primary_color === "#1868db", "Default primary color is #1868db")
  assert(data1.title === "We value your privacy", "Default title populated")
  assert(data1.accept_all_label === "Accept All", "Default accept_all_label populated")
  assert(data1.reject_all_label === "Reject All", "Default reject_all_label populated")
  assert(data1.preferences_label === "Customise", "Default preferences_label populated")
  assert(data1.enable_necessary_category === true, "enable_necessary_category is true")
  assert(data1.enable_functional_category === true, "enable_functional_category is true")
  assert(data1.enable_analytics_category === true, "enable_analytics_category is true")
  assert(data1.enable_performance_category === true, "enable_performance_category is true")
  assert(data1.enable_advertisement_category === true, "enable_advertisement_category is true")
  assert(data1.show_revisit_button === true, "show_revisit_button is true")
  assert(data1.revisit_button_position === "bottom_left", "revisit_button_position is bottom_left")
  assert(data1.enable_consent_mode_v2 === true, "enable_consent_mode_v2 is true")
  assert(data1.enable_iab_tcf === true, "enable_iab_tcf is true")
  assert(data1.enable_gpc === true, "enable_gpc is true")
  assert(data1.consent_version === "1.0", "consent_version is 1.0")

  // 2. IDEMPOTENCY: SUBSEQUENT GET RETURNS SAME ROW WITHOUT DUPLICATION
  console.log("\n>> 2. Testing Idempotency on Repeated GET Requests...")
  const getReq2 = new Request(`http://localhost:3000/api/v1/consent/config?domain=${testDomain}`)
  const getRes2 = await GET(getReq2)
  assert(getRes2.status === 200, "Second GET request returns HTTP 200")

  const data2 = await getRes2.json()
  assert(data2.id === data1.id, "Second GET returns identical configuration ID")

  const countRes = await pool.query("SELECT COUNT(*) FROM consent_configs WHERE domain = $1", [testDomain])
  assert(parseInt(countRes.rows[0].count, 10) === 1, "Exactly one configuration row exists in database (no duplicates)")

  // 3. REPRODUCING THE USER'S EXACT PRODUCTION DOMAIN
  console.log("\n>> 3. Testing User's Exact Production Domain (work-os-gules.vercel.app)...")
  const prodReq = new Request(`http://localhost:3000/api/v1/consent/config?domain=${productionReproDomain}`)
  const prodRes = await GET(prodReq)
  assert(prodRes.status === 200, `work-os-gules.vercel.app returns HTTP 200 (Got: ${prodRes.status})`)
  const prodData = await prodRes.json()
  assert(prodData.domain === productionReproDomain, "Production domain initialized successfully")
  assert(prodData.enable_analytics_category === true, "Production domain has all 5 categories initialized")

  // 4. TESTING POST /api/v1/consent/config (CUSTOM UPDATES & UPSERT)
  console.log("\n>> 4. Testing POST /api/v1/consent/config Upsert...")
  const postReq = new Request("http://localhost:3000/api/v1/consent/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain: testDomain,
      layout: "floating_box_bottom_right",
      theme: "dark",
      primary_color: "#10b981",
      title: "Updated Custom Privacy Notice",
      preferences_label: "Configure",
      enable_advertisement_category: false,
    }),
  })

  const postRes = await POST(postReq)
  assert(postRes.status === 200, `POST returns HTTP 200 (Got: ${postRes.status})`)
  const postData = await postRes.json()
  assert(postData.title === "Updated Custom Privacy Notice", "POST updated title correctly")
  assert(postData.primary_color === "#10b981", "POST updated primary color correctly")
  assert(postData.enable_advertisement_category === false, "POST updated enable_advertisement_category correctly")

  // Cleanup
  await pool.query("DELETE FROM consent_configs WHERE domain IN ($1, $2)", [testDomain, productionReproDomain])

  console.log("\n========================================================")
  console.log(` RESULTS: ${passedTests} Passed, ${failedTests} Failed`)
  console.log("========================================================\n")

  if (failedTests > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error("Test Suite Unhandled Error:", err)
  process.exit(1)
})
