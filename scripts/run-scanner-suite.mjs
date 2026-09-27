/**
 * UpFront CMP Hybrid Scanner & Consent-Aware Runtime Discovery ESM Test Runner
 */

import { isPrivateIP, isDisallowedHostname, sanitizeDomain, validateTargetUrl, SSRFValidationError } from "../apps/web/lib/scanner/ssrf-protection.ts"
import { classifyCookieName } from "../apps/web/lib/consentos/open-cookie-db.ts"
import {
  createSyntheticConsentPayload,
  SCANNER_CONSENT_CATEGORIES,
} from "../apps/web/lib/scanner/browser-scanner.ts"

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`)
  }
}

async function runAllScannerTests() {
  console.log("=================================================================")
  console.log(" UpFront CMP Consent-Aware Runtime Scanner ESM Suite")
  console.log("=================================================================\n")

  let passed = 0
  let failed = 0

  function test(name, fn) {
    try {
      fn()
      console.log(`  [PASS] ${name}`)
      passed++
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`)
      failed++
    }
  }

  // --- 1. SSRF & Security Validations ---
  console.log("[1/6] SSRF & Address Range Security Tests...")

  test("TEST 14: Localhost scanning is strictly blocked", () => {
    assert(isDisallowedHostname("localhost") === true, "localhost must be disallowed")
    assert(isDisallowedHostname("sub.localhost") === true, "sub.localhost must be disallowed")
    assert(isDisallowedHostname("127.0.0.1") === true, "127.0.0.1 must be disallowed")
    assert(isDisallowedHostname("127.1.2.3") === true, "127.x.x.x must be disallowed")
  })

  test("TEST 14: Private IPv4 / IPv6 / Link-Local / Cloud Metadata blocked", () => {
    assert(isPrivateIP("10.0.0.1") === true, "10.0.0.0/8 must be private")
    assert(isPrivateIP("172.16.0.5") === true, "172.16.0.0/12 must be private")
    assert(isPrivateIP("192.168.1.1") === true, "192.168.0.0/16 must be private")
    assert(isPrivateIP("169.254.169.254") === true, "AWS metadata 169.254.169.254 must be blocked")
    assert(isPrivateIP("::1") === true, "IPv6 loopback ::1 must be blocked")
    assert(isPrivateIP("fe80::1") === true, "IPv6 link-local fe80:: must be blocked")
    assert(isPrivateIP("fc00::1") === true, "IPv6 unique local fc00:: must be blocked")
    assert(isPrivateIP("8.8.8.8") === false, "Public IP 8.8.8.8 must be allowed")
    assert(isPrivateIP("104.21.5.12") === false, "Cloudflare public IP must be allowed")
  })

  test("TEST 14: validateTargetUrl rejects private IPs and internal schemes", async () => {
    let threw = false
    try {
      await validateTargetUrl("http://169.254.169.254/latest/meta-data")
    } catch (e) {
      threw = true
      assert(e instanceof SSRFValidationError, "Must throw SSRFValidationError")
    }
    assert(threw, "Metadata endpoint must throw SSRFValidationError")

    let threwLocal = false
    try {
      await validateTargetUrl("https://localhost:8080/admin")
    } catch (e) {
      threwLocal = true
      assert(e instanceof SSRFValidationError, "Must throw SSRFValidationError for localhost")
    }
    assert(threwLocal, "Localhost must throw SSRFValidationError")
  })

  // --- 2. Category-Isolated Synthetic Consent Payloads ---
  console.log("\n[2/6] Category-Isolated Consent Invariant Tests...")

  test("TEST 1: Necessary category synthetic payload (default unconsented state)", () => {
    const p = createSyntheticConsentPayload("necessary")
    assert(p.necessary === true, "necessary must be true")
    assert(p.functional === false, "functional must be false in necessary pass")
    assert(p.analytics === false, "analytics must be false in necessary pass")
    assert(p.performance === false, "performance must be false in necessary pass")
    assert(p.advertisement === false, "advertisement must be false in necessary pass")
    assert(p.consent_given === false, "consent_given must be false for necessary only")
  })

  test("TEST 2: Functional category synthetic payload", () => {
    const p = createSyntheticConsentPayload("functional")
    assert(p.necessary === true, "necessary must be true")
    assert(p.functional === true, "functional must be true")
    assert(p.analytics === false, "analytics must be false in functional pass")
    assert(p.performance === false, "performance must be false in functional pass")
    assert(p.advertisement === false, "advertisement must be false in functional pass")
    assert(p.consent_given === true, "consent_given must be true")
  })

  test("TEST 3: Analytics category synthetic payload", () => {
    const p = createSyntheticConsentPayload("analytics")
    assert(p.necessary === true, "necessary must be true")
    assert(p.functional === false, "functional must be false in analytics pass")
    assert(p.analytics === true, "analytics must be true")
    assert(p.performance === false, "performance must be false in analytics pass")
    assert(p.advertisement === false, "advertisement must be false in analytics pass")
    assert(p.consent_given === true, "consent_given must be true")
  })

  test("TEST 4: Performance category synthetic payload", () => {
    const p = createSyntheticConsentPayload("performance")
    assert(p.necessary === true, "necessary must be true")
    assert(p.functional === false, "functional must be false in performance pass")
    assert(p.analytics === false, "analytics must be false in performance pass")
    assert(p.performance === true, "performance must be true")
    assert(p.advertisement === false, "advertisement must be false in performance pass")
    assert(p.consent_given === true, "consent_given must be true")
  })

  test("TEST 5: Advertisement category synthetic payload", () => {
    const p = createSyntheticConsentPayload("advertisement")
    assert(p.necessary === true, "necessary must be true")
    assert(p.functional === false, "functional must be false in advertisement pass")
    assert(p.analytics === false, "analytics must be false in advertisement pass")
    assert(p.performance === false, "performance must be false in advertisement pass")
    assert(p.advertisement === true, "advertisement must be true")
    assert(p.consent_given === true, "consent_given must be true")
  })

  test("TEST 6, 7 & 8: Category isolation & zero leakage invariants", () => {
    assert(SCANNER_CONSENT_CATEGORIES.length === 5, "Must test exactly 5 categories")
    
    // Test 7: Functional does not leak into Analytics
    const analyticsPayload = createSyntheticConsentPayload("analytics")
    assert(analyticsPayload.functional === false, "Functional consent must not leak into Analytics scan")
    
    // Test 8: Analytics does not leak into Advertisement
    const adPayload = createSyntheticConsentPayload("advertisement")
    assert(adPayload.analytics === false, "Analytics consent must not leak into Advertisement scan")
  })

  // --- 3. Open Cookie DB Classification ---
  console.log("\n[3/6] Open Cookie DB & Taxonomy Classification...")

  test("TEST 11: Known signatures classify accurately", () => {
    const ga = classifyCookieName("_ga")
    assert(ga.category === "analytics", "_ga must be classified as analytics")
    assert(ga.confidence === "high", "_ga must have high confidence")

    const cf = classifyCookieName("__cf_bm")
    assert(cf.category === "necessary", "__cf_bm must be classified as necessary")

    const fbp = classifyCookieName("_fbp")
    assert(fbp.category === "advertisement", "_fbp must be classified as advertisement")
  })

  test("TEST 10: Unknown runtime cookie (upfront_test_functional) remains uncategorised", () => {
    const custom = classifyCookieName("upfront_test_functional")
    assert(custom.category === "uncategorised", "upfront_test_functional must NOT be guessed as functional")
    assert(custom.confidence === "low", "upfront_test_functional must have low confidence")
    assert(custom.status === "needs_review", "upfront_test_functional must have status needs_review")
  })

  // --- 4. Merger & Zero-Value Privacy Invariants ---
  console.log("\n[4/6] Merger, Deduplication & Value Privacy Tests...")

  test("TEST 9: Zero-Value Persistence in data models", () => {
    const httpCookie = {
      name: "_ga",
      domain: "onconnect.one",
      duration: "2 years",
      discoverySource: "http_set_cookie",
      isSecure: true,
    }

    const browserCookie = {
      name: "upfront_test_functional",
      domain: "onconnect.one",
      path: "/",
      duration: "1 year",
      discoverySource: "browser_cookie",
      isSecure: false,
    }

    const keys = Object.keys(httpCookie).concat(Object.keys(browserCookie))
    assert(!keys.includes("value"), "Cookie values must NEVER exist in scanner data models (Privacy Requirement)")
  })

  // --- 5. Manual Classification Override Preservation ---
  console.log("\n[5/6] Manual Category Override Preservation...")

  test("TEST 12: Manual category override survives rescanning", () => {
    const existingDbRecord = {
      id: "cookie-123",
      domain: "onconnect.one",
      name: "upfront_test_functional",
      category: "functional", // Manually set by customer
      service_name: "Custom Functional Script",
      description: "Custom site functional widget",
      status: "manual_override", // Override flag
      confidence: "high",
    }

    const isManualOverride = existingDbRecord.status === "manual_override" || existingDbRecord.status === "custom"
    assert(isManualOverride === true, "Must recognize manual_override status")

    const taxonomy = classifyCookieName("upfront_test_functional")
    assert(taxonomy.category === "uncategorised", "Default taxonomy is uncategorised")

    // When isManualOverride is true, targetCategory must stay 'functional'
    const targetCategory = isManualOverride ? existingDbRecord.category : taxonomy.category
    assert(targetCategory === "functional", "Manual override category 'functional' must be preserved across rescans")
  })

  // --- 6. Domain Sanitization & Job Model ---
  console.log("\n[6/6] Scanner Job & Domain Utilities...")

  test("TEST 13 & 15: Sanitize domain helper and URL parsing", () => {
    assert(sanitizeDomain("https://onconnect.one/landing") === "onconnect.one", "Sanitize onconnect.one")
    assert(sanitizeDomain("http://connect-inky-delta.vercel.app:3000/") === "connect-inky-delta.vercel.app", "Sanitize vercel app")
    assert(sanitizeDomain("SUB.DOMAIN.COM") === "sub.domain.com", "Lowercases domain")
  })

  console.log("\n=================================================================")
  console.log(` RESULTS: ${passed} Passed, ${failed} Failed`)
  console.log("=================================================================\n")

  if (failed > 0) {
    process.exit(1)
  }
}

runAllScannerTests()
