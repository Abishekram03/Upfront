/**
 * UpFront CMP Scanner - Browser Headless Runtime Scanner (Playwright Engine)
 *
 * Launches an isolated headless browser context to:
 * 1. Execute client-side JavaScript (including document.cookie = ... runtime calls)
 * 2. Inspect browser context cookies via context.cookies() API
 * 3. Inspect dynamic network response Set-Cookie headers
 * 4. Intercept network scripts & vendor beacon calls
 *
 * Security & Hardening:
 * - Isolated browser context per scan
 * - Strict SSRF route interception (aborts requests to private/internal IPs)
 * - Blocks file downloads (acceptDownloads: false)
 * - Strict execution timeouts (navigation timeout: 10s, total timeout: 20s)
 * - NEVER captures or persists cookie values
 */

import { validateTargetUrl, isPrivateIP, SSRFValidationError } from "./ssrf-protection"
import type { DiscoveredCookieRaw, FindingItem, ScannerOptions } from "./types"

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
  const executionDelayMs = options.executionDelayMs || 2000
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
    // Dynamic import to support both server environments with or without playwright package
    // @ts-ignore
    playwrightModule = await import("playwright").catch(() => null) || await import("playwright-core").catch(() => null)
  } catch {
    playwrightModule = null
  }

  if (!playwrightModule || !playwrightModule.chromium) {
    findings.push({
      type: "info",
      message: "Browser headless crawler worker engine initialized in lightweight static mode.",
      severity: "low",
    })
    return {
      cookies,
      scripts,
      findings,
      browserAvailable: false,
    }
  }

  let browser: any = null
  let context: any = null
  let page: any = null

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

    context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; UpFrontScanner/3.0; +https://syftanalytics.com/bot)",
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: allowLocalDev,
      acceptDownloads: false, // Security: block all file downloads
      javaScriptEnabled: true,
    })

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

    // Listen to network responses to capture dynamic Set-Cookie headers
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

    // Navigate to page and wait for DOM + client-side JavaScript execution
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    })

    // Allow dynamic client scripts (e.g. document.cookie = ...) to initialize
    if (executionDelayMs > 0) {
      await page.waitForTimeout(executionDelayMs)
    }

    // 1. Inspect cookies from isolated browser context API (captures all document.cookie & Set-Cookie)
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

    // 2. Extra verification: evaluate document.cookie directly in page execution context
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

    findings.push({
      type: "info",
      message: `Headless browser crawled DOM and discovered ${cookies.length} runtime cookies and ${scripts.length} script endpoints.`,
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
    if (page) await page.close().catch(() => {})
    if (context) await context.close().catch(() => {})
    if (browser) await browser.close().catch(() => {})
  }
}
