/**
 * Live End-to-End Verification of Consent-Aware Cookie Scanner against onconnect.one
 */

import fs from "node:fs"
import path from "node:path"

// 1. Load apps/web/.env.local BEFORE importing database modules
const envPath = path.resolve(process.cwd(), "apps/web/.env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim()
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
        process.env[k] = v
      }
    }
  }
}

async function main() {
  console.log("=================================================================")
  console.log(" REAL END-TO-END SCANNER VERIFICATION: https://onconnect.one")
  console.log("=================================================================\n")

  const { runBrowserScan } = await import("../apps/web/lib/scanner/browser-scanner")
  const { runHttpScan } = await import("../apps/web/lib/scanner/http-scanner")
  const { mergeAndPersistDiscoveredCookies } = await import("../apps/web/lib/scanner/merger")
  const { pool, ensureTables } = await import("../apps/web/lib/db")

  const domain = "onconnect.one"
  await ensureTables()

  // 1. Run live browser scan
  console.log("[1/4] Running live category-isolated browser scan against onconnect.one...")
  const browserResult = await runBrowserScan(domain, {
    timeoutMs: 25000,
    executionDelayMs: 3000,
  })

  console.log(`  -> Browser available: ${browserResult.browserAvailable}`)
  console.log(`  -> Discovered cookies count: ${browserResult.cookies.length}`)
  console.log("  -> Discovered cookies:", JSON.stringify(browserResult.cookies, null, 2))
  console.log("  -> Scripts captured count:", browserResult.scripts.length)

  // 2. Run live HTTP scan
  console.log("\n[2/4] Running live static HTTP probe against onconnect.one...")
  const httpResult = await runHttpScan(domain, {
    timeoutMs: 15000,
  })
  console.log(`  -> HTTP discovered cookies: ${httpResult.cookies.length}`)

  // 3. Merge and persist
  console.log("\n[3/4] Merging discoveries and persisting into database...")
  const combinedFindings = [...httpResult.findings, ...browserResult.findings]
  const { persistedCookies } = await mergeAndPersistDiscoveredCookies(
    domain,
    null,
    httpResult.cookies,
    browserResult.cookies,
    combinedFindings
  )
  console.log(`  -> Total persisted cookies: ${persistedCookies.length}`)
  console.log("  -> Persisted cookie items:", JSON.stringify(persistedCookies, null, 2))

  // 4. Query database to verify final persistence
  console.log("\n[4/4] Querying database discovered_cookies for onconnect.one...")
  const dbRes = await pool.query(
    "SELECT id, domain, name, category, service_name, duration, confidence, status, discovery_source FROM discovered_cookies WHERE domain = $1 ORDER BY name ASC",
    [domain]
  )
  console.log("  -> DB Rows:", JSON.stringify(dbRes.rows, null, 2))

  const functionalCookie = dbRes.rows.find((c: any) => c.name === "upfront_test_functional")
  if (functionalCookie) {
    console.log("\n✅ SUCCESS: 'upfront_test_functional' discovered and persisted!")
    console.log(`   - Name: ${functionalCookie.name}`)
    console.log(`   - Category: ${functionalCookie.category}`)
    console.log(`   - Confidence: ${functionalCookie.confidence}`)
    console.log(`   - Status: ${functionalCookie.status}`)
    console.log(`   - Discovery Source: ${functionalCookie.discovery_source}`)
  } else {
    console.error("\n❌ FAILED: 'upfront_test_functional' not found in database.")
    process.exit(1)
  }

  await pool.end()
}

main().catch((err) => {
  console.error("Fatal test error:", err)
  process.exit(1)
})
