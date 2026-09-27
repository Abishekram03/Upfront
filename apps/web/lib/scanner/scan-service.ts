/**
 * UpFront CMP Scanner - Hybrid Scan Service & Job Orchestration
 *
 * Implements asynchronous scan job state flow:
 * queued -> running -> completed / failed
 *
 * Coordinates SSRF validation, HTTP static probing, and Playwright browser runtime execution.
 */

import { pool, ensureTables } from "../db"
import { randomUUID } from "node:crypto"
import { sanitizeDomain, validateTargetUrl } from "./ssrf-protection"
import { runHttpScan } from "./http-scanner"
import { runBrowserScan } from "./browser-scanner"
import { mergeAndPersistDiscoveredCookies } from "./merger"
import type { ScanJobRecord, ScannerOptions, ScanStatus, FindingItem } from "./types"

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

      // 2. Parallel / Hybrid scan execution
      const [httpResult, browserResult] = await Promise.all([
        runHttpScan(domain, options).catch((err) => ({
          cookies: [],
          scripts: [],
          findings: [
            {
              type: "warning" as const,
              message: `HTTP scan issue: ${err.message}`,
              severity: "medium" as const,
            },
          ],
        })),
        options.skipBrowser
          ? Promise.resolve({
              cookies: [],
              scripts: [],
              findings: [],
              browserAvailable: false,
            })
          : runBrowserScan(domain, options).catch((err) => ({
              cookies: [],
              scripts: [],
              findings: [
                {
                  type: "warning" as const,
                  message: `Browser scan issue: ${err.message}`,
                  severity: "medium" as const,
                },
              ],
              browserAvailable: false,
            })),
      ])

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
        combinedFindings
      )

      const leaksCount = combinedFindings.filter((f) => f.type === "leak").length

      // 5. Mark scan as completed
      await pool.query(
        `UPDATE scans 
         SET status = 'completed',
             cookies_found = $1,
             scripts_found = $2,
             leaks_found = $3,
             findings = $4::jsonb,
             completed_at = NOW()
         WHERE id = $5`,
        [
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
        status: "completed",
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
      // Mark scan as failed
      await pool.query(
        `UPDATE scans 
         SET status = 'failed',
             error_message = $1,
             completed_at = NOW()
         WHERE id = $2`,
        [err.message || "Scan execution failed", scanId]
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
            message: err.message || "Scan execution failed",
            severity: "critical",
          },
        ],
        error_message: err.message,
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
