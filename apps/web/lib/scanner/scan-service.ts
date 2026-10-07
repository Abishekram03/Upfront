/**
 * UpFront CMP Scanner - Hybrid Scan Service & Job Orchestration
 *
 * Implements asynchronous scan job state flow:
 * queued -> running -> completed / partial / failed
 *
 * Coordinates SSRF validation, HTTP static probing, and Playwright browser runtime execution.
 * Zero silent error masking: Browser failures produce FAILED status (or PARTIAL if explicitly configured).
 */

import { pool, ensureTables } from "../db"
import { randomUUID } from "node:crypto"
import { sanitizeDomain, validateTargetUrl, SSRFValidationError } from "./ssrf-protection"
import { runHttpScan } from "./http-scanner"
import { runBrowserScan, BrowserExecutionError } from "./browser-scanner"
import { mergeAndPersistDiscoveredCookies } from "./merger"
import type { ScanJobRecord, ScannerOptions, ScanStatus, FindingItem, DiscoveredCookieRaw } from "./types"

export class ScanService {
  /**
   * Creates a new queued scan job in the database.
   */
  static async createScanJob(
    rawDomain: string,
    siteId: string | null = null,
    options: ScannerOptions = {}
  ): Promise<ScanJobRecord> {
    await ensureTables()
    const domain = sanitizeDomain(rawDomain)
    if (!domain) {
      throw new Error("Domain is required for scan job creation.")
    }

    const scanId = randomUUID()
    const scanType = options.skipBrowser ? "http_only" : "hybrid"
    const triggerSource = options.triggerSource || "manual"
    const scheduleId = options.scheduleId || null
    const scheduledOccurrence = options.scheduledOccurrence || null

    await pool.query(
      `INSERT INTO scans (
        id, site_id, domain, status, scan_type, trigger_source, schedule_id,
        scheduled_occurrence, cookies_found, scripts_found, leaks_found,
        dark_patterns_found, findings, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, 0, '[]'::jsonb, NOW())`,
      [scanId, siteId, domain, "queued", scanType, triggerSource, scheduleId, scheduledOccurrence]
    )

    return {
      id: scanId,
      site_id: siteId,
      domain,
      status: "queued",
      scan_type: scanType,
      trigger_source: triggerSource,
      schedule_id: scheduleId,
      scheduled_occurrence: scheduledOccurrence,
      cookies_found: 0,
      scripts_found: 0,
      leaks_found: 0,
      dark_patterns_found: 0,
      findings: [],
      created_at: new Date().toISOString(),
    }
  }

  /**
   * Executes a queued scan job.
   */
  static async executeScanJob(
    scanId: string,
    options: ScannerOptions = {}
  ): Promise<ScanJobRecord> {
    await ensureTables()

    const scanRes = await pool.query(
      `SELECT * FROM scans WHERE id = $1 LIMIT 1`,
      [scanId]
    )

    if (scanRes.rows.length === 0) {
      throw new Error(`Scan job '${scanId}' not found.`)
    }

    const job = scanRes.rows[0]
    const domain = job.domain
    const siteId = job.site_id || null

    // Mark as running
    await pool.query(
      `UPDATE scans SET status = 'running' WHERE id = $1`,
      [scanId]
    )

    try {
      // 1. SSRF Pre-flight validation
      const targetUrl = domain.startsWith("localhost") || domain.startsWith("127.0.0.1")
        ? `http://${domain}`
        : `https://${domain}`

      await validateTargetUrl(targetUrl, Boolean(options.allowInsecureHttp))

      // 2. Scan Execution Pipeline
      let httpResult = { cookies: [] as DiscoveredCookieRaw[], scripts: [] as string[], findings: [] as FindingItem[] }
      let browserResult = { cookies: [] as DiscoveredCookieRaw[], scripts: [] as string[], findings: [] as FindingItem[], browserAvailable: false }
      let browserError: Error | null = null

      if (options.skipBrowser) {
        // Explicit HTTP-only scan request
        httpResult = await runHttpScan(domain, options)
      } else {
        // Run HTTP spider and Playwright browser scan
        const httpPromise = runHttpScan(domain, options).catch((err) => {
          return {
            cookies: [] as DiscoveredCookieRaw[],
            scripts: [] as string[],
            findings: [
              {
                type: "warning" as const,
                message: `HTTP scan issue: ${err.message}`,
                severity: "medium" as const,
              },
            ],
          }
        })

        const browserPromise = runBrowserScan(domain, options).catch((err) => {
          browserError = err
          return null
        })

        const [hRes, bRes] = await Promise.all([httpPromise, browserPromise])
        httpResult = hRes

        if (bRes) {
          browserResult = bRes
        } else if (browserError) {
          // Check if degraded execution is explicitly permitted
          if (options.allowDegradedPartial) {
            // Degraded partial execution
            browserResult = {
              cookies: [],
              scripts: [],
              findings: [
                {
                  type: "warning",
                  message: `Browser runtime unavailable: ${(browserError as Error).message}. Degraded scan completed with HTTP static crawler only.`,
                  severity: "medium",
                },
              ],
              browserAvailable: false,
            }
          } else {
            // Browser failure MUST fail the scan. NEVER return an empty scan as completed!
            throw browserError
          }
        }
      }

      // 3. Aggregate all findings & scripts
      const combinedFindings: FindingItem[] = [
        ...httpResult.findings,
        ...browserResult.findings,
      ]

      const combinedScripts = Array.from(
        new Set([...httpResult.scripts, ...browserResult.scripts])
      )

      // 4. Merge and persist discovered cookies into database
      const { persistedCookies } = await mergeAndPersistDiscoveredCookies(
        domain,
        siteId,
        httpResult.cookies,
        browserResult.cookies,
        combinedFindings,
        combinedScripts
      )

      const leaksCount = combinedFindings.filter((f) => f.type === "leak").length
      const finalStatus: ScanStatus = browserError && options.allowDegradedPartial ? "partial" : "completed"

      // 5. Update scan record with final status
      await pool.query(
        `UPDATE scans 
         SET status = $1,
             cookies_found = $2,
             scripts_found = $3,
             leaks_found = $4,
             findings = $5::jsonb,
             completed_at = NOW()
         WHERE id = $6`,
        [
          finalStatus,
          persistedCookies.length,
          combinedScripts.length,
          leaksCount,
          JSON.stringify(combinedFindings),
          scanId,
        ]
      )

      return {
        id: scanId,
        site_id: siteId,
        domain,
        status: finalStatus,
        scan_type: job.scan_type || "hybrid",
        cookies_found: persistedCookies.length,
        scripts_found: combinedScripts.length,
        leaks_found: leaksCount,
        dark_patterns_found: 0,
        findings: combinedFindings,
        created_at: job.created_at,
        completed_at: new Date().toISOString(),
      }
    } catch (err: any) {
      // Mark scan as failed - NEVER mask or return empty success
      const errorMessage = err.message || "Scan execution failed"
      
      await pool.query(
        `UPDATE scans 
         SET status = 'failed',
             error_message = $1,
             completed_at = NOW()
         WHERE id = $2`,
        [errorMessage, scanId]
      )

      return {
        id: scanId,
        site_id: siteId,
        domain,
        status: "failed",
        scan_type: job.scan_type || "hybrid",
        cookies_found: 0,
        scripts_found: 0,
        leaks_found: 0,
        dark_patterns_found: 0,
        findings: [
          {
            type: "warning",
            message: errorMessage,
            severity: "critical",
          },
        ],
        error_message: errorMessage,
        created_at: job.created_at,
        completed_at: new Date().toISOString(),
      }
    }
  }

  /**
   * Helper to run a scan synchronously (useful for CLI/testing).
   */
  static async runSyncScan(
    domain: string,
    siteId: string | null = null,
    options: ScannerOptions = {}
  ): Promise<ScanJobRecord> {
    const job = await this.createScanJob(domain, siteId, options)
    return await this.executeScanJob(job.id, options)
  }
}
