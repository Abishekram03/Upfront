/**
 * Test Manual Override Preservation Across Rescan
 */

import fs from "node:fs"
import path from "node:path"

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
  const { pool } = await import("../apps/web/lib/db")
  const { mergeAndPersistDiscoveredCookies } = await import("../apps/web/lib/scanner/merger")

  const domain = "onconnect.one"

  // 1. Manually classify upfront_test_functional as 'functional' with status 'manual_override'
  console.log("Setting manual override on 'upfront_test_functional' -> 'functional'...")
  await pool.query(
    `UPDATE discovered_cookies 
     SET category = 'functional', status = 'manual_override', confidence = 'high' 
     WHERE domain = $1 AND name = 'upfront_test_functional'`,
    [domain]
  )

  // 2. Simulate rescan with discovered raw browser cookie
  console.log("Simulating rescan with raw browser cookie discovery...")
  const rawBrowserCookie = {
    name: "upfront_test_functional",
    domain: "connect-inky-delta.vercel.app",
    path: "/",
    duration: "12 months",
    discoverySource: "browser_cookie" as const,
  }

  await mergeAndPersistDiscoveredCookies(
    domain,
    null,
    [],
    [rawBrowserCookie],
    []
  )

  // 3. Verify category in database
  const res = await pool.query(
    `SELECT name, category, status, confidence FROM discovered_cookies WHERE domain = $1 AND name = 'upfront_test_functional'`,
    [domain]
  )

  const row = res.rows[0]
  console.log("Cookie after rescan:", JSON.stringify(row, null, 2))

  if (row && row.category === "functional" && row.status === "manual_override") {
    console.log("✅ SUCCESS: Manual classification 'functional' preserved across rescan!")
  } else {
    console.error("❌ FAILED: Manual classification was overwritten!")
    process.exit(1)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
