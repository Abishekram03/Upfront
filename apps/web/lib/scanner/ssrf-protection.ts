/**
 * UpFront CMP Scanner - SSRF & Domain Security Validator
 *
 * Enforces strict defense-in-depth against Server-Side Request Forgery (SSRF),
 * private IP scanning, link-local / cloud metadata probes, loopback bypasses,
 * and malicious redirects.
 */

import dns from "node:dns/promises"
import net from "node:net"

export class SSRFValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SSRFValidationError"
  }
}

/**
 * Checks if a given IPv4 string falls into private, loopback, link-local, or reserved ranges.
 */
export function isPrivateIPv4(ip: string): boolean {
  if (!net.isIPv4(ip)) return false
  const parts = ip.split(".").map((p) => parseInt(p, 10))
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true // Malformed IP, fail-closed
  }

  const [a, b, c, d] = parts

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true

  // 10.0.0.0/8 (Private network - RFC 1918)
  if (a === 10) return true

  // 172.16.0.0/12 (Private network - RFC 1918)
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true

  // 192.168.0.0/16 (Private network - RFC 1918)
  if (a === 192 && b === 168) return true

  // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Metadata: 169.254.169.254)
  if (a === 169 && b === 254) return true

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b !== undefined && b >= 64 && b <= 127) return true

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 0) return true

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true

  // 198.18.0.0/15 (Network benchmark tests)
  if (a === 198 && b !== undefined && (b === 18 || b === 19)) return true

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true

  // 240.0.0.0/4 (Reserved / Future use)
  if (a >= 240) return true

  // 255.255.255.255/32 (Broadcast)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true

  return false
}

/**
 * Checks if a given IPv6 string falls into private, loopback, link-local, or IPv4-mapped private ranges.
 */
export function isPrivateIPv6(ip: string): boolean {
  if (!net.isIPv6(ip)) return false
  const lower = ip.toLowerCase().trim()

  // Loopback ::1 or 0:0:0:0:0:0:0:1
  if (lower === "::1" || lower === "::" || lower.startsWith("0:0:0:0:0:0:0:1")) {
    return true
  }

  // IPv4-mapped IPv6: ::ffff:127.0.0.1 or ::ffff:192.168.1.1
  if (lower.startsWith("::ffff:") || lower.includes("::ffff:")) {
    const lastPart = lower.split(":").pop()
    if (lastPart && net.isIPv4(lastPart)) {
      return isPrivateIPv4(lastPart)
    }
    return true
  }

  // Link-local unicast (fe80::/10)
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
    return true
  }

  // Unique local address (fc00::/7 -> fc00::/8 and fd00::/8)
  if (lower.startsWith("fc") || lower.startsWith("fd")) {
    return true
  }

  // Multicast (ff00::/8)
  if (lower.startsWith("ff")) {
    return true
  }

  return false
}

/**
 * Checks if an IP is in any private/disallowed range.
 */
export function isPrivateIP(ip: string): boolean {
  return isPrivateIPv4(ip) || isPrivateIPv6(ip)
}

/**
 * Validates a hostname and rejects reserved, local, or internal TLDs.
 */
export function isDisallowedHostname(hostname: string): boolean {
  const clean = hostname.toLowerCase().trim()

  if (
    clean === "localhost" ||
    clean.endsWith(".localhost") ||
    clean.endsWith(".local") ||
    clean.endsWith(".internal") ||
    clean.endsWith(".lan") ||
    clean.endsWith(".arpa") ||
    clean.endsWith(".invalid") ||
    clean.endsWith(".test") ||
    clean.endsWith(".example") ||
    clean === "metadata.google.internal" ||
    clean === "169.254.169.254"
  ) {
    return true
  }

  // Check if raw IP string was passed as hostname
  if (net.isIP(clean)) {
    return isPrivateIP(clean)
  }

  return false
}

/**
 * Sanitizes and normalizes an input domain into a clean domain name.
 */
export function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  let clean = input.trim()
  if (clean.startsWith("https://")) clean = clean.slice(8)
  if (clean.startsWith("http://")) clean = clean.slice(7)
  const first = clean.split("/")[0]
  const domainOnly = (first || "").split(":")[0] // strip port
  return (domainOnly || "").toLowerCase().trim()
}

/**
 * Full SSRF verification: Resolves domain via DNS and verifies that all resolved IPs are public.
 */
export async function validateTargetUrl(targetUrl: string, allowLocalDev = false): Promise<{
  url: string
  hostname: string
  resolvedIPs: string[]
}> {
  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    throw new SSRFValidationError(`Malformed URL: ${targetUrl}`)
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new SSRFValidationError(`Disallowed protocol '${parsed.protocol}'. Only HTTPS/HTTP are permitted.`)
  }

  const hostname = parsed.hostname.toLowerCase()

  if (!allowLocalDev && isDisallowedHostname(hostname)) {
    throw new SSRFValidationError(`Access to hostname '${hostname}' is prohibited for security reasons (SSRF Protection).`)
  }

  // If raw IP
  if (net.isIP(hostname)) {
    if (!allowLocalDev && isPrivateIP(hostname)) {
      throw new SSRFValidationError(`Direct access to private IP '${hostname}' is prohibited.`)
    }
    return { url: targetUrl, hostname, resolvedIPs: [hostname] }
  }

  // Local development override for test suites
  if (allowLocalDev && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return { url: targetUrl, hostname, resolvedIPs: ["127.0.0.1"] }
  }

  // Resolve DNS to verify actual IP addresses (prevents DNS rebinding and internal network scanning)
  try {
    const addresses = await dns.lookup(hostname, { all: true, verbatim: true })
    if (!addresses || addresses.length === 0) {
      throw new SSRFValidationError(`Could not resolve hostname '${hostname}'. Host does not exist.`)
    }

    const resolvedIPs = addresses.map((a) => a.address)

    for (const ip of resolvedIPs) {
      if (!allowLocalDev && isPrivateIP(ip)) {
        throw new SSRFValidationError(
          `Domain '${hostname}' resolved to private/restricted IP '${ip}'. Scanning internal networks is blocked.`
        )
      }
    }

    return { url: targetUrl, hostname, resolvedIPs }
  } catch (err: any) {
    if (err instanceof SSRFValidationError) throw err
    throw new SSRFValidationError(`DNS resolution failed for '${hostname}': ${err.message}`)
  }
}
