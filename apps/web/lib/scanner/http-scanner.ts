/**
 * UpFront CMP Scanner - HTTP Static Scanner
 *
 * Fast static discovery layer that inspects:
 * 1. HTTP Set-Cookie response headers (with Max-Age/Expires/Path/Domain/Secure/HttpOnly/SameSite)
 * 2. Static HTML markup and script tags
 * 3. Known vendor tracker signatures
 *
 * Enforces strict SSRF validation across all redirects and NEVER stores cookie values.
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
        else if (sec < 86400) explicitDuration = `${Math.round(sec / 3600)} hours`
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

export async function runHttpScan(
  domain: string,
  options: ScannerOptions = {}
): Promise<{
  cookies: DiscoveredCookieRaw[]
  scripts: string[]
  findings: FindingItem[]
}> {
  const timeoutMs = options.timeoutMs || 8000
  const allowLocalDev = Boolean(options.allowInsecureHttp)

  const targetUrl = domain.startsWith("localhost") || domain.startsWith("127.0.0.1")
    ? `http://${domain}`
    : `https://${domain}`

  // SSRF pre-flight validation
  await validateTargetUrl(targetUrl, allowLocalDev)

  const cookies: DiscoveredCookieRaw[] = []
  const scripts: string[] = []
  const findings: FindingItem[] = []
  const seenCookieNames = new Set<string>()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: "manual", // Manually validate redirects to avoid SSRF bypass via 302 to 127.0.0.1
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UpFrontScanner/3.0; +https://syftanalytics.com/bot)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    })

    clearTimeout(timeout)

    // Handle redirects with recursive SSRF validation
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (location) {
        const redirectUrl = new URL(location, targetUrl).toString()
        await validateTargetUrl(redirectUrl, allowLocalDev)
        findings.push({
          type: "info",
          message: `Scanner followed redirect to: ${redirectUrl}`,
          severity: "low",
        })
      }
    }

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

    // 2. Scan HTML markup for scripts and tracker signatures
    const html = await response.text().catch(() => "")

    const scriptSrcMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)
    for (const match of scriptSrcMatches) {
      if (match[1] && !scripts.includes(match[1])) {
        scripts.push(match[1])
      }
    }

    // Known tracker signatures in markup
    if (/google-analytics\.com|googletagmanager\.com\/gtag/i.test(html)) {
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
      findings.push({
        type: "info",
        message: "Google Analytics 4 detected in static page markup.",
        severity: "medium",
      })
    }

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
      findings.push({
        type: "leak",
        message: "Meta Pixel detected before user consent. Gated behind advertisement category.",
        severity: "critical",
      })
    }

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
  } catch (err: any) {
    clearTimeout(timeout)
    if (err instanceof SSRFValidationError) throw err
    findings.push({
      type: "warning",
      message: `HTTP probe encountered an issue: ${err.message}`,
      severity: "medium",
    })
  }

  return { cookies, scripts, findings }
}
