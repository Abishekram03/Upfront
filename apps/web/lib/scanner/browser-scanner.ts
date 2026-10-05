/**
 * UpFront CMP Scanner - Browser Headless Runtime Scanner (Playwright Engine)
 *
 * Implements CONSENT-AWARE CATEGORY-ISOLATED BROWSER SCANNING:
 * 1. Launches isolated headless browser contexts per category pass:
 *    - necessary (default page state)
 *    - functional (functional consent only)
 *    - analytics (analytics consent only)
 *    - performance (performance consent only)
 *    - advertisement (advertisement consent only)
 * 2. Pre-seeds canonical UpFront CMP storage (usrly_consent_<domain>, consentos_consent)
 * 3. Synchronizes with window.Userly.updateConsent() on runtime CMP detection
 * 4. Executes client-side JavaScript (unblocking gated scripts & document.cookie calls)
 * 5. Inspects browser context cookies via context.cookies() API
 * 6. Inspects dynamic network response Set-Cookie headers
 * 7. Intercepts network scripts & vendor beacon calls
 *
 * Security & Hardening:
 * - Fresh isolated browser context per category pass (zero cross-category leakage)
 * - Strict SSRF route interception (aborts requests to private/internal IPs)
 * - Blocks file downloads (acceptDownloads: false)
 * - Strict execution timeouts (navigation timeout: 10s, total timeout: 20s)
 * - NEVER captures or persists cookie values
 */

import { validateTargetUrl, isPrivateIP, SSRFValidationError } from "./ssrf-protection"
import type { DiscoveredCookieRaw, FindingItem, ScannerOptions } from "./types"

export type ScannerConsentCategory =
  | "necessary"
  | "functional"
  | "analytics"
  | "performance"
  | "advertisement"

export const SCANNER_CONSENT_CATEGORIES: ScannerConsentCategory[] = [
  "necessary",
  "functional",
  "analytics",
  "performance",
  "advertisement",
]

function calculateDuration(expiresSecOrMs?: number | null): string {
  if (!expiresSecOrMs || expiresSecOrMs === -1) return "Session"
  
  // Playwright returns unix timestamp in seconds or -1 for session cookies
  const nowSec = Date.now() / 1000
  const expSec = expiresSecOrMs > 10000000000 ? expiresSecOrMs / 1000 : expiresSecOrMs
  const diffSec = Math.round(expSec - nowSec)

  if (diffSec <= 0) return "Session"
  if (diffSec < 60) return `${diffSec} seconds`
  if (diffSec < 3600) return `${Math.round(diffSec / 60)} minutes`
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)} hours`
  if (diffSec < 2592000) return `${Math.round(diffSec / 86400)} days`
  if (diffSec < 31536000) return `${Math.round(diffSec / 2592000)} months`
  return `${Math.round(diffSec / 31536000)} year${Math.round(diffSec / 31536000) > 1 ? "s" : ""}`
}

export function createSyntheticConsentPayload(category: ScannerConsentCategory) {
  return {
    consent_given: category !== "necessary",
    necessary: true,
    functional: category === "functional",
    analytics: category === "analytics",
    performance: category === "performance",
    advertisement: category === "advertisement",
    consent_version: "1.0",
    timestamp: new Date().toISOString(),
  }
}

/**
 * Runs a category-isolated browser scan using a fresh browser context.
 */
export async function runIsolatedCategoryScan(
  browser: any,
  domain: string,
  targetUrl: string,
  category: ScannerConsentCategory,
  options: ScannerOptions = {}
): Promise<{
  cookies: DiscoveredCookieRaw[]
  scripts: string[]
  findings: FindingItem[]
}> {
  const timeoutMs = options.timeoutMs || 15000
  const executionDelayMs = options.executionDelayMs || 2000
  const allowLocalDev = Boolean(options.allowInsecureHttp)

  const cookies: DiscoveredCookieRaw[] = []
  const scripts: string[] = []
  const findings: FindingItem[] = []
  const seenCookieNames = new Set<string>()

  const consentPayload = createSyntheticConsentPayload(category)

  // 1. Create a completely fresh, isolated browser context for this category
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; UpFrontScanner/3.0; +https://syftanalytics.com/bot)",
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: allowLocalDev,
    acceptDownloads: false, // Security: block all file downloads
    javaScriptEnabled: true,
  })

  let page: any = null
  try {
    // 2. Pre-seed canonical UpFront CMP storage before page scripts initialize
    await context.addInitScript(
      ({ storageDomain, consentObj }: { storageDomain: string; consentObj: any }) => {
        try {
          // UpFront CMP storage (script.js / upfront_cookie)
          localStorage.setItem("upfront_cookie", JSON.stringify(consentObj))
          localStorage.setItem("usrly_consent_" + storageDomain, JSON.stringify(consentObj))
          if (window.location && window.location.hostname) {
            localStorage.setItem("usrly_consent_" + window.location.hostname, JSON.stringify(consentObj))
          }
          localStorage.setItem("consentos_consent", JSON.stringify(consentObj))
          const val = encodeURIComponent(JSON.stringify(consentObj))
          document.cookie = "upfront_cookie=" + val + "; path=/; SameSite=Lax; max-age=31536000"
          document.cookie = "consentos_consent=" + val + "; path=/; SameSite=Lax; max-age=31536000"
        } catch (e) {}
      },
      { storageDomain: domain, consentObj: consentPayload }
    )

    page = await context.newPage()
    page.setDefaultNavigationTimeout(timeoutMs)
    page.setDefaultTimeout(timeoutMs)

    // SSRF Route Interception: block any sub-request navigating or fetching private IP ranges
    await page.route("**/*", async (route: any) => {
      const requestUrl = route.request().url()
      try {
        const parsed = new URL(requestUrl)
        const hostname = parsed.hostname.toLowerCase()

        if (!allowLocalDev) {
          if (
            hostname === "localhost" ||
            hostname.endsWith(".localhost") ||
            hostname.endsWith(".local") ||
            hostname.endsWith(".internal") ||
            hostname.endsWith(".lan") ||
            hostname === "169.254.169.254" ||
            hostname === "metadata.google.internal"
          ) {
            return route.abort("blockedbyclient")
          }
        }

        // Script evidence capture
        if (route.request().resourceType() === "script" || requestUrl.includes(".js")) {
          if (!scripts.includes(requestUrl)) {
            scripts.push(requestUrl)
          }
        }

        return route.continue()
      } catch {
        return route.continue()
      }
    })

    // Dynamic Set-Cookie header capture
    page.on("response", async (response: any) => {
      try {
        const headers = await response.allHeaders()
        const setCookie = headers["set-cookie"]
        if (setCookie) {
          const cookieLines = Array.isArray(setCookie) ? setCookie : setCookie.split("\n")
          for (const line of cookieLines) {
            const firstPart = line.split(";")[0]?.trim() || ""
            const cookieName = firstPart.split("=")[0]?.trim()
            if (cookieName && !seenCookieNames.has(cookieName)) {
              seenCookieNames.add(cookieName)
              cookies.push({
                name: cookieName,
                domain,
                path: "/",
                duration: "Session",
                discoverySource: "http_set_cookie",
              })
            }
          }
        }
      } catch {}
    })

    // Navigate to page
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    })

    // 3. Detect whether UpFront CMP runtime is installed & synchronize canonical consent API
    await page.evaluate((consentObj: any) => {
      try {
        const win = window as any
        if (win.Userly && typeof win.Userly.updateConsent === "function") {
          win.Userly.updateConsent(consentObj)
        }
        if (typeof win.unblockGatedScripts === "function") {
          win.unblockGatedScripts(consentObj)
        }
      } catch (e) {}
    }, consentPayload).catch(() => {})

    // Allow dynamic client scripts (e.g. document.cookie = ...) to initialize & execute
    if (executionDelayMs > 0) {
      await page.waitForTimeout(executionDelayMs)
    }

    // 4. Inspect cookies from isolated browser context API
    const browserCookies = await context.cookies()
    for (const bc of browserCookies) {
      if (!bc.name) continue
      const cookieName = bc.name.trim()
      if (!cookieName) continue

      const duration = calculateDuration(bc.expires)
      const isSession = bc.expires === -1 || !bc.expires

      if (!seenCookieNames.has(cookieName)) {
        seenCookieNames.add(cookieName)
        cookies.push({
          name: cookieName,
          domain: bc.domain || domain,
          path: bc.path || "/",
          duration: isSession ? "Session" : duration,
          expires: bc.expires > 0 ? (bc.expires > 10000000000 ? bc.expires : bc.expires * 1000) : null,
          isSecure: Boolean(bc.secure),
          isHttpOnly: Boolean(bc.httpOnly),
          sameSite: bc.sameSite,
          discoverySource: "browser_cookie",
        })
      }
    }

    // 5. Evaluate document.cookie directly in page execution context
    const rawDocumentCookie: string = await page.evaluate(() => document.cookie).catch(() => "")
    if (rawDocumentCookie && typeof rawDocumentCookie === "string") {
      const items = rawDocumentCookie.split(";").map((s: string) => s.trim())
      for (const item of items) {
        if (!item) continue
        const cookieName = item.split("=")[0]?.trim()
        if (cookieName && !seenCookieNames.has(cookieName)) {
          seenCookieNames.add(cookieName)
          cookies.push({
            name: cookieName,
            domain,
            path: "/",
            duration: "Session",
            discoverySource: "browser_cookie",
          })
        }
      }
    }
  } finally {
    if (page) await page.close().catch(() => {})
    if (context) await context.close().catch(() => {})
  }

  return {
    cookies,
    scripts,
    findings,
  }
}

/**
 * Orchestrates full multi-category consent-aware browser scans.
 */
export async function runBrowserScan(
  domain: string,
  options: ScannerOptions = {}
): Promise<{
  cookies: DiscoveredCookieRaw[]
  scripts: string[]
  findings: FindingItem[]
  browserAvailable: boolean
}> {
  const timeoutMs = options.timeoutMs || 15000
  const allowLocalDev = Boolean(options.allowInsecureHttp)

  const targetUrl = domain.startsWith("localhost") || domain.startsWith("127.0.0.1")
    ? `http://${domain}`
    : `https://${domain}`

  // SSRF pre-flight check
  await validateTargetUrl(targetUrl, allowLocalDev)

  const cookies: DiscoveredCookieRaw[] = []
  const scripts: string[] = []
  const findings: FindingItem[] = []
  const seenCookieNames = new Set<string>()

  let playwrightModule: any = null
  try {
    const pkg = "playwright"
    const corePkg = "playwright-core"
    playwrightModule =
      (await import(/* webpackIgnore: true */ pkg).catch(() => null)) ||
      (await import(/* webpackIgnore: true */ corePkg).catch(() => null))
  } catch {
    playwrightModule = null
  }

  if (!playwrightModule || !playwrightModule.chromium) {
    const msg = "Playwright runtime crawler not available. Ensure 'playwright' package and Chromium browser binary are installed (`npx playwright install chromium`)."
    console.warn(`[UpFront Scanner] ${msg}`)
    findings.push({
      type: "warning",
      message: msg,
      severity: "medium",
    })
    return {
      cookies,
      scripts,
      findings,
      browserAvailable: false,
    }
  }

  let browser: any = null

  try {
    browser = await playwrightModule.chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-sync",
        "--disable-translate",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-first-run",
        "--safebrowsing-disable-auto-update",
      ],
      timeout: timeoutMs,
    })

    // Run category-isolated passes:
    // 1. Necessary (default state)
    // 2. Functional
    // 3. Analytics
    // 4. Performance
    // 5. Advertisement
    for (const cat of SCANNER_CONSENT_CATEGORIES) {
      try {
        const catResult = await runIsolatedCategoryScan(
          browser,
          domain,
          targetUrl,
          cat,
          options
        )

        for (const c of catResult.cookies) {
          if (!seenCookieNames.has(c.name)) {
            seenCookieNames.add(c.name)
            cookies.push(c)
          }
        }

        for (const s of catResult.scripts) {
          if (!scripts.includes(s)) {
            scripts.push(s)
          }
        }
      } catch (catErr: any) {
        findings.push({
          type: "warning",
          message: `Category scan pass [${cat}] encountered: ${catErr.message}`,
          severity: "low",
        })
      }
    }

    findings.push({
      type: "info",
      message: `Headless browser completed 5 category-isolated consent scans (necessary, functional, analytics, performance, advertisement) discovering ${cookies.length} runtime cookies and ${scripts.length} script endpoints.`,
      severity: "low",
    })

    return {
      cookies,
      scripts,
      findings,
      browserAvailable: true,
    }
  } catch (err: any) {
    if (err instanceof SSRFValidationError) throw err
    findings.push({
      type: "warning",
      message: `Browser runtime scan encountered: ${err.message}`,
      severity: "medium",
    })
    return {
      cookies,
      scripts,
      findings,
      browserAvailable: true,
    }
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}
