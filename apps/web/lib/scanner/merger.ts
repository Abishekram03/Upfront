/**
 * UpFront CMP Scanner - Discovery Merger & Persistence Engine
 *
 * Merges discoveries from HTTP static scan and Browser runtime scan:
 * 1. Deduplicates by (domain, cookie_name).
 * 2. Classifies known cookies via Open Cookie Database taxonomy.
 * 3. Preserves unknown cookies strictly as "uncategorised" with low confidence.
 * 4. PRESERVES manual customer category overrides (status = 'manual_override' | 'custom').
 * 5. NEVER persists cookie values.
 */

import { pool } from "../db"
import { classifyCookieName } from "../consentos/open-cookie-db"
import { getKnownCookiesForScript } from "../cookie-signatures"
import { randomUUID } from "node:crypto"
import type { DiscoveredCookieRaw, FindingItem } from "./types"

export interface MergedCookieResult {
  id: string
  domain: string
  name: string
  category: string
  service_name: string
  duration: string
  description: string
  confidence: string
  status: string
  script_pattern_regex?: string
  discovery_source: string
  path?: string
  is_secure?: boolean
  is_http_only?: boolean
  same_site?: string
}

export async function mergeAndPersistDiscoveredCookies(
  domain: string,
  siteId: string | null,
  httpCookies: DiscoveredCookieRaw[],
  browserCookies: DiscoveredCookieRaw[],
  findings: FindingItem[],
  detectedScripts: string[] = []
): Promise<{
  persistedCookies: MergedCookieResult[]
  totalUniqueCookies: number
}> {
  // Clean up any legacy usrly_consent records so only upfront_cookie is kept
  await pool.query(
    `DELETE FROM discovered_cookies WHERE domain = $1 AND name = 'usrly_consent'`,
    [domain]
  ).catch(() => {})

  // 1. Deduplicate by lowercased cookie name
  const cookieMap = new Map<string, DiscoveredCookieRaw>()

  // A. Script Tag Signatures First (Guarantees script-associated cookies are always registered)
  for (const scriptUrl of detectedScripts) {
    const knownScriptCookies = getKnownCookiesForScript(scriptUrl, domain)
    for (const sc of knownScriptCookies) {
      const key = sc.name.trim()
      if (!key) continue
      cookieMap.set(key, { ...sc, name: key } as DiscoveredCookieRaw)
    }
  }

  // B. HTTP Set-Cookie headers
  for (const c of httpCookies) {
    if (!c.name || typeof c.name !== "string") continue
    const key = c.name.trim()
    if (!key) continue
    const existing = cookieMap.get(key)
    if (existing) {
      cookieMap.set(key, { ...existing, ...c, name: key })
    } else {
      cookieMap.set(key, { ...c, name: key })
    }
  }

  // Browser cookies merge (override with runtime metadata like path/secure if available)
  for (const c of browserCookies) {
    if (!c.name || typeof c.name !== "string") continue
    const key = c.name.trim()
    if (!key) continue
    const existing = cookieMap.get(key)
    if (existing) {
      cookieMap.set(key, {
        ...existing,
        ...c,
        name: key,
        duration: c.duration && c.duration !== "Session" ? c.duration : existing.duration || "Session",
        discoverySource: existing.discoverySource === "http_set_cookie" ? "http_set_cookie" : "browser_cookie",
      })
    } else {
      cookieMap.set(key, { ...c, name: key })
    }
  }

  const persistedCookies: MergedCookieResult[] = []

  for (const [cookieName, raw] of cookieMap.entries()) {
    // Classify against Open Cookie Database taxonomy
    const taxonomy = classifyCookieName(cookieName)

    // Duration precedence: Raw detected duration -> Taxonomy duration -> Default "Session"
    const finalDuration =
      raw.duration && raw.duration !== "Unknown" && raw.duration !== "Session"
        ? raw.duration
        : taxonomy.duration && taxonomy.duration !== "Unknown"
        ? taxonomy.duration
        : raw.duration || "Session"

    // Check if cookie already exists in database
    const existingRes = await pool.query(
      `SELECT id, category, service_name, description, status, confidence FROM discovered_cookies WHERE domain = $1 AND name = $2 LIMIT 1`,
      [domain, cookieName]
    )

    if (existingRes.rows.length > 0 && existingRes.rows[0]) {
      const existing = existingRes.rows[0]
      const isManualOverride = existing.status === "manual_override" || existing.status === "custom"

      // If manual override: PRESERVE customer's category, service_name, and description!
      const targetCategory = isManualOverride ? existing.category : taxonomy.category
      const targetService = isManualOverride ? existing.service_name : taxonomy.service_name
      const targetDesc = isManualOverride ? existing.description : taxonomy.description
      const targetStatus = isManualOverride ? existing.status : taxonomy.status
      const targetConfidence = isManualOverride ? existing.confidence : taxonomy.confidence

      await pool.query(
        `UPDATE discovered_cookies 
         SET last_detected_at = NOW(),
             duration = COALESCE(NULLIF($1, 'Unknown'), duration),
             category = $2,
             service_name = $3,
             description = $4,
             status = $5,
             confidence = $6,
             script_pattern_regex = COALESCE($7, script_pattern_regex),
             discovery_source = COALESCE($8, discovery_source),
             path = COALESCE($9, path),
             is_secure = COALESCE($10, is_secure),
             is_http_only = COALESCE($11, is_http_only),
             same_site = COALESCE($12, same_site)
         WHERE id = $13`,
        [
          finalDuration,
          targetCategory,
          targetService,
          targetDesc,
          targetStatus,
          targetConfidence,
          taxonomy.script_pattern_regex || null,
          raw.discoverySource,
          raw.path || "/",
          raw.isSecure || false,
          raw.isHttpOnly || false,
          raw.sameSite || null,
          existing.id,
        ]
      )

      persistedCookies.push({
        id: existing.id,
        domain,
        name: cookieName,
        category: targetCategory,
        service_name: targetService,
        duration: finalDuration,
        description: targetDesc,
        confidence: targetConfidence,
        status: targetStatus,
        script_pattern_regex: taxonomy.script_pattern_regex,
        discovery_source: raw.discoverySource,
        path: raw.path || "/",
        is_secure: raw.isSecure || false,
        is_http_only: raw.isHttpOnly || false,
        same_site: raw.sameSite,
      })
    } else {
      // Insert brand new discovered cookie
      const id = randomUUID()
      await pool.query(
        `INSERT INTO discovered_cookies (
          id, site_id, domain, name, category, service_name, duration,
          description, confidence, status, script_pattern_regex,
          discovery_source, path, is_secure, is_http_only, same_site,
          first_detected_at, last_detected_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
        [
          id,
          siteId,
          domain,
          cookieName,
          taxonomy.category,
          taxonomy.service_name,
          finalDuration,
          taxonomy.description,
          taxonomy.confidence,
          taxonomy.status,
          taxonomy.script_pattern_regex || null,
          raw.discoverySource,
          raw.path || "/",
          raw.isSecure || false,
          raw.isHttpOnly || false,
          raw.sameSite || null,
        ]
      )

      persistedCookies.push({
        id,
        domain,
        name: cookieName,
        category: taxonomy.category,
        service_name: taxonomy.service_name,
        duration: finalDuration,
        description: taxonomy.description,
        confidence: taxonomy.confidence,
        status: taxonomy.status,
        script_pattern_regex: taxonomy.script_pattern_regex,
        discovery_source: raw.discoverySource,
        path: raw.path || "/",
        is_secure: raw.isSecure || false,
        is_http_only: raw.isHttpOnly || false,
        same_site: raw.sameSite,
      })
    }
  }

  return {
    persistedCookies,
    totalUniqueCookies: persistedCookies.length,
  }
}
