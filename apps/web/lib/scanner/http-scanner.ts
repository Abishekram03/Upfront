/**
 * UpFront CMP Scanner - Fast Multi-Page HTTP & Spider Scanner
 *
 * Fast recursive/spider discovery layer that:
 * 1. Crawls the target domain root and follows internal `<a href>` subpages (up to `maxPages` limit).
 * 2. Concurrently inspects HTTP Set-Cookie response headers across all crawled pages.
 * 3. Inspects HTML script tags and known vendor tracker signatures on every subpage.
 * 4. Enforces strict SSRF validation across all subpage URLs and redirects.
 * 5. NEVER captures or persists sensitive cookie values.
 */

import { validateTargetUrl, SSRFValidationError } from "./ssrf-protection"
import type { DiscoveredCookieRaw, FindingItem, ScannerOptions } from "./types"

function parseCookieHeader(headerStr: string, domain: string): DiscoveredCookieRaw | null {
  if (!headerStr || typeof headerStr !== "string") return null
  const parts = headerStr.split(";").map((p) => p.trim())
  const firstPart = parts[0] || ""
  const eqIdx = firstPart.indexOf("=")
  if (eqIdx === -1) return null

  const cookieName = firstPart.slice(0, eqIdx).trim()
  if (!cookieName) return null

  let path = "/"
  let cookieDomain = domain
  let explicitDuration: string | undefined
  let expiresTimestamp: number | null = null
  let isSecure = false
  let isHttpOnly = false
  let sameSite: string | undefined
  let hasMaxAgeOrExpires = false

  for (const part of parts.slice(1)) {
    const pLower = part.toLowerCase()
    if (pLower.startsWith("path=")) {
      path = part.slice(5).trim() || "/"
    } else if (pLower.startsWith("domain=")) {
      cookieDomain = part.slice(7).trim() || domain
    } else if (pLower.startsWith("max-age=")) {
      hasMaxAgeOrExpires = true
      const sec = parseInt(part.slice(8).trim(), 10)
      if (!isNaN(sec) && sec > 0) {
        expiresTimestamp = Date.now() + sec * 1000
        if (sec < 60) explicitDuration = `${sec} seconds`
        else if (sec < 3600) explicitDuration = `${Math.round(sec / 60)} minutes`
        else if (sec < 86400) explicitDuration = `${Math.round(sec / 86400)} days`
        else if (sec < 2592000) explicitDuration = `${Math.round(sec / 86400)} days`
        else if (sec < 31536000) explicitDuration = `${Math.round(sec / 2592000)} months`
        else explicitDuration = `${Math.round(sec / 31536000)} year${Math.round(sec / 31536000) > 1 ? "s" : ""}`
      } else {
        explicitDuration = "Session"
      }
    } else if (pLower.startsWith("expires=")) {
      hasMaxAgeOrExpires = true
      const dateStr = part.slice(8).trim()
      const d = new Date(dateStr)
      if (!isNaN(d.getTime())) {
        expiresTimestamp = d.getTime()
        const diffMs = d.getTime() - Date.now()
        if (diffMs > 0) {
          const sec = Math.round(diffMs / 1000)
          if (sec < 3600) explicitDuration = `${Math.round(sec / 60)} minutes`
          else if (sec < 86400) explicitDuration = `${Math.round(sec / 3600)} hours`
          else if (sec < 2592000) explicitDuration = `${Math.round(sec / 86400)} days`
          else if (sec < 31536000) explicitDuration = `${Math.round(sec / 2592000)} months`
          else explicitDuration = `${Math.round(sec / 31536000)} year${Math.round(sec / 31536000) > 1 ? "s" : ""}`
        } else {
          explicitDuration = "Session"
        }
      }
    } else if (pLower === "secure") {
      isSecure = true
    } else if (pLower === "httponly") {
      isHttpOnly = true
    } else if (pLower.startsWith("samesite=")) {
      sameSite = part.slice(9).trim()
    }
  }

  if (!hasMaxAgeOrExpires) {
    explicitDuration = "Session"
  }

  return {
    name: cookieName,
    domain: cookieDomain,
    path,
    duration: explicitDuration,
    expires: expiresTimestamp,
    isSecure,
    isHttpOnly,
    sameSite,
    discoverySource: "http_set_cookie",
  }
}

/**
 * Extracts internal subpage URLs from raw HTML markup.
 */
function extractInternalLinks(html: string, currentUrl: string, baseHostname: string): string[] {
  const links: string[] = []
  const linkRegex = /<a[^>]+href=["']([^"'#\s>]+)["']/gi
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(html)) !== null) {
    const rawHref = match[1]?.trim()
    if (!rawHref) continue

    // Ignore protocols / assets that are not web pages
    if (
      rawHref.startsWith("javascript:") ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:") ||
      rawHref.startsWith("data:") ||
      /\.(png|jpe?g|gif|svg|webp|ico|css|js|woff2?|ttf|pdf|zip|mp4|webm|xml|json|txt)$/i.test(rawHref)
    ) {
      continue
    }

    try {
      const resolved = new URL(rawHref, currentUrl)
      // Must be http/https and match the exact target hostname or its subdomain
      if (
        (resolved.protocol === "http:" || resolved.protocol === "https:") &&
        (resolved.hostname === baseHostname || resolved.hostname.endsWith(`.${baseHostname}`))
      ) {
        // Strip hash and normalize trailing slash
        resolved.hash = ""
        const cleanUrl = resolved.toString()
        if (!links.includes(cleanUrl)) {
          links.push(cleanUrl)
        }
      }
    } catch {
      // Ignore invalid URL formats
    }
  }

  return links
}

/**
 * Inspects a single page response for scripts and known tracker signatures.
 */
function inspectPageHtml(
  html: string,
  pageUrl: string,
  domain: string,
  cookies: DiscoveredCookieRaw[],
  scripts: string[],
  findings: FindingItem[],
  seenCookieNames: Set<string>
) {
  // Extract script src attributes
  const scriptSrcMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)
  for (const match of scriptSrcMatches) {
    if (match[1] && !scripts.includes(match[1])) {
      scripts.push(match[1])
    }
  }

  // Google Analytics 4 / Google Tag Manager
  if (/google-analytics\.com|googletagmanager\.com\/gtag|googletagmanager\.com\/gtm\.js/i.test(html)) {
    if (!seenCookieNames.has("_ga")) {
      seenCookieNames.add("_ga")
      cookies.push({
        name: "_ga",
        domain,
        duration: "2 years",
        discoverySource: "script_signature",
      })
    }
    if (!seenCookieNames.has("_gid")) {
      seenCookieNames.add("_gid")
      cookies.push({
        name: "_gid",
        domain,
        duration: "24 hours",
        discoverySource: "script_signature",
      })
    }
    if (!findings.some((f) => f.message.includes("Google Analytics"))) {
      findings.push({
        type: "info",
        message: "Google Analytics / Tag Manager detected in page markup.",
        severity: "medium",
      })
    }
  }

  // Meta Pixel (Facebook)
  if (/connect\.facebook\.net|fbevents\.js/i.test(html)) {
    if (!seenCookieNames.has("_fbp")) {
      seenCookieNames.add("_fbp")
      cookies.push({
        name: "_fbp",
        domain,
        duration: "3 months",
        discoverySource: "script_signature",
      })
    }
    if (!findings.some((f) => f.message.includes("Meta Pixel"))) {
      findings.push({
        type: "leak",
        message: "Meta Pixel detected before user consent. Gated behind advertisement category.",
        severity: "critical",
      })
    }
  }

  // Microsoft Clarity
  if (/clarity\.ms\/tag/i.test(html)) {
    if (!seenCookieNames.has("_clck")) {
      seenCookieNames.add("_clck")
      cookies.push({
        name: "_clck",
        domain,
        duration: "1 year",
        discoverySource: "script_signature",
      })
    }
    if (!seenCookieNames.has("_clsk")) {
      seenCookieNames.add("_clsk")
      cookies.push({
        name: "_clsk",
        domain,
        duration: "1 day",
        discoverySource: "script_signature",
      })
    }
  }

  // Hotjar
  if (/static\.hotjar\.com/i.test(html)) {
    if (!seenCookieNames.has("_hjSessionUser_1")) {
      seenCookieNames.add("_hjSessionUser_1")
      cookies.push({
        name: "_hjSessionUser_1",
        domain,
        duration: "1 year",
        discoverySource: "script_signature",
      })
    }
  }

  // Intercom
  if (/widget\.intercom\.io/i.test(html)) {
    if (!seenCookieNames.has("intercom-session-id")) {
      seenCookieNames.add("intercom-session-id")
      cookies.push({
        name: "intercom-session-id",
        domain,
        duration: "1 week",
        discoverySource: "script_signature",
      })
    }
  }

  // TikTok Pixel
  if (/analytics\.tiktok\.com\/i18n\/pixel/i.test(html)) {
    if (!seenCookieNames.has("_ttp")) {
      seenCookieNames.add("_ttp")
      cookies.push({
        name: "_ttp",
        domain,
        duration: "13 months",
        discoverySource: "script_signature",
      })
    }
    if (!findings.some((f) => f.message.includes("TikTok Pixel"))) {
      findings.push({
        type: "leak",
        message: "TikTok Pixel detected in page markup.",
        severity: "critical",
      })
    }
  }

  // Stripe
  if (/js\.stripe\.com/i.test(html)) {
    if (!seenCookieNames.has("__stripe_mid")) {
      seenCookieNames.add("__stripe_mid")
      cookies.push({
        name: "__stripe_mid",
        domain,
        duration: "1 year",
        discoverySource: "script_signature",
      })
    }
  }
}

/**
 * Runs a high-speed multi-page recursive crawler across the target domain.
 */
export async function runHttpScan(
  domain: string,
  options: ScannerOptions = {}
): Promise<{
  cookies: DiscoveredCookieRaw[]
  scripts: string[]
  findings: FindingItem[]
  scannedPagesCount?: number
  crawledUrls?: string[]
}> {
  const timeoutMs = options.timeoutMs || 10000
  const allowLocalDev = Boolean(options.allowInsecureHttp)
  const maxPages = Math.min(Math.max(options.maxPages || 25, 1), 100) // Default 25, capped at 100 per job for safety

  const initialUrl = domain.startsWith("localhost") || domain.startsWith("127.0.0.1")
    ? `http://${domain}`
    : `https://${domain}`

  // SSRF pre-flight validation on root target
  await validateTargetUrl(initialUrl, allowLocalDev)

  const parsedRoot = new URL(initialUrl)
  const baseHostname = parsedRoot.hostname

  const cookies: DiscoveredCookieRaw[] = []
  const scripts: string[] = []
  const findings: FindingItem[] = []
  const seenCookieNames = new Set<string>()

  const visitedUrls = new Set<string>()
  const crawlQueue: string[] = [initialUrl]
  const crawledUrls: string[] = []

  const overallController = new AbortController()
  const overallTimeout = setTimeout(() => overallController.abort(), timeoutMs)

  try {
    // Process queue in concurrent batches of up to 5 parallel fetches
    const BATCH_SIZE = 5

    while (crawlQueue.length > 0 && visitedUrls.size < maxPages && !overallController.signal.aborted) {
      const currentBatch: string[] = []
      while (currentBatch.length < BATCH_SIZE && crawlQueue.length > 0 && (visitedUrls.size + currentBatch.length) < maxPages) {
        const nextUrl = crawlQueue.shift()!
        if (!visitedUrls.has(nextUrl)) {
          visitedUrls.add(nextUrl)
          currentBatch.push(nextUrl)
        }
      }

      if (currentBatch.length === 0) break

      const batchPromises = currentBatch.map(async (pageUrl) => {
        try {
          // SSRF validation on each subpage URL
          await validateTargetUrl(pageUrl, allowLocalDev)

          const pageController = new AbortController()
          const pageTimeout = setTimeout(() => pageController.abort(), 4000)

          const response = await fetch(pageUrl, {
            signal: pageController.signal,
            redirect: "manual",
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; UpFrontScanner/3.0; +https://syftanalytics.com/bot)",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
          })

          clearTimeout(pageTimeout)

          // Handle redirects
          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location")
            if (location) {
              const redirectUrl = new URL(location, pageUrl).toString()
              if (
                new URL(redirectUrl).hostname === baseHostname &&
                !visitedUrls.has(redirectUrl) &&
                !crawlQueue.includes(redirectUrl) &&
                crawlQueue.length < maxPages * 2
              ) {
                crawlQueue.push(redirectUrl)
              }
            }
            return
          }

          crawledUrls.push(pageUrl)

          // 1. Extract Set-Cookie headers
          const setCookieHeaders: string[] = response.headers.getSetCookie
            ? response.headers.getSetCookie()
            : [response.headers.get("set-cookie") || ""]

          for (const header of setCookieHeaders) {
            if (!header) continue
            const parsed = parseCookieHeader(header, domain)
            if (parsed && !seenCookieNames.has(parsed.name)) {
              seenCookieNames.add(parsed.name)
              cookies.push(parsed)
            }
          }

          // 2. Scan HTML markup & extract subpage links
          const contentType = response.headers.get("content-type") || ""
          if (contentType.includes("text/html") || contentType === "") {
            const html = await response.text().catch(() => "")
            inspectPageHtml(html, pageUrl, domain, cookies, scripts, findings, seenCookieNames)

            // Extract internal links to queue
            if (visitedUrls.size + crawlQueue.length < maxPages * 2) {
              const discoveredLinks = extractInternalLinks(html, pageUrl, baseHostname)
              for (const link of discoveredLinks) {
                if (!visitedUrls.has(link) && !crawlQueue.includes(link) && crawlQueue.length < maxPages * 2) {
                  crawlQueue.push(link)
                }
              }
            }
          }
        } catch (err: any) {
          if (err instanceof SSRFValidationError) throw err
          // Subpage fetch failure is non-fatal to overall crawl
        }
      })

      await Promise.allSettled(batchPromises)
    }

    clearTimeout(overallTimeout)

    findings.push({
      type: "info",
      message: `Multi-page spider crawled ${crawledUrls.length} internal page${crawledUrls.length === 1 ? "" : "s"} on ${domain}.`,
      severity: "low",
    })
  } catch (err: any) {
    clearTimeout(overallTimeout)
    if (err instanceof SSRFValidationError) throw err
    findings.push({
      type: "warning",
      message: `Spider encountered an issue during crawl: ${err.message}`,
      severity: "medium",
    })
  }

  return {
    cookies,
    scripts,
    findings,
    scannedPagesCount: crawledUrls.length,
    crawledUrls,
  }
}
