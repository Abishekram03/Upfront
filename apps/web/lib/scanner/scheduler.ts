/**
 * UpFront CMP - Scheduled / Recurring Cookie Scans Engine
 *
 * Implements atomic, idempotent, timezone-aware scheduled cookie scanning:
 * 1. Atomically claims due schedules using PostgreSQL row locking (FOR UPDATE SKIP LOCKED)
 * 2. Enforces concurrency protection: skips execution if a previous scan is still running for the domain
 * 3. Enforces idempotency: prevents duplicate scans for the same scheduled occurrence
 * 4. Executes the existing production hybrid cookie scanner pipeline (HTTP + Playwright + Open Cookie DB)
 * 5. Preserves all manual cookie overrides and Open Cookie DB classifications
 * 6. Calculates the next occurrence with full timezone and DST awareness
 */

import { pool, ensureTables } from "../db"
import { randomUUID } from "node:crypto"
import { sanitizeDomain } from "./ssrf-protection"
import { calculateNextRun, isValidTimezone, isValidTimeOfDay, type ScheduleFrequency } from "./schedule-calculator"
import { ScanService } from "./scan-service"
import type { ScanScheduleRecord } from "./types"

export interface CreateScheduleInput {
  domain: string
  workspaceId?: string | null
  siteId?: string | null
  enabled?: boolean
  frequency: ScheduleFrequency
  timeOfDay: string
  timezone: string
  dayOfWeek?: number | null
  dayOfMonth?: number | null
}

export class ScheduleService {
  /**
   * Retrieves the schedule for a given domain.
   */
  static async getScheduleByDomain(rawDomain: string): Promise<ScanScheduleRecord | null> {
    await ensureTables()
    const domain = sanitizeDomain(rawDomain)
    if (!domain) return null

    const res = await pool.query(
      `SELECT * FROM scan_schedules WHERE domain = $1 LIMIT 1`,
      [domain]
    )

    if (res.rows.length === 0) return null
    return res.rows[0] as ScanScheduleRecord
  }

  /**
   * Creates or updates a scan schedule for a domain.
   */
  static async upsertSchedule(input: CreateScheduleInput): Promise<ScanScheduleRecord> {
    await ensureTables()
    const domain = sanitizeDomain(input.domain)
    if (!domain) {
      throw new Error("Domain is required to configure a scan schedule.")
    }

    const frequency = input.frequency
    if (frequency !== "daily" && frequency !== "weekly" && frequency !== "monthly") {
      throw new Error(`Invalid frequency: '${frequency}'. Must be 'daily', 'weekly', or 'monthly'.`)
    }

    const timezone = (input.timezone || "UTC").trim()
    if (!isValidTimezone(timezone)) {
      throw new Error(`Invalid IANA timezone identifier: '${timezone}'.`)
    }

    const timeOfDay = (input.timeOfDay || "09:00").trim()
    if (!isValidTimeOfDay(timeOfDay)) {
      throw new Error(`Invalid time format '${timeOfDay}'. Expected 'HH:mm' (24-hour clock).`)
    }

    let dayOfWeek: number | null = null
    if (frequency === "weekly") {
      dayOfWeek = input.dayOfWeek !== undefined && input.dayOfWeek !== null ? Number(input.dayOfWeek) : 1
      if (dayOfWeek < 1 || dayOfWeek > 7) {
        throw new Error(`Weekly frequency requires a valid dayOfWeek between 1 (Monday) and 7 (Sunday).`)
      }
    }

    let dayOfMonth: number | null = null
    if (frequency === "monthly") {
      dayOfMonth = input.dayOfMonth !== undefined && input.dayOfMonth !== null ? Number(input.dayOfMonth) : 1
      if (dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error(`Monthly frequency requires a valid dayOfMonth between 1 and 31.`)
      }
    }

    const enabled = input.enabled !== false

    // Calculate initial next_run_at
    const { nextRunAt } = calculateNextRun({
      frequency,
      timeOfDay,
      timezone,
      dayOfWeek: dayOfWeek || undefined,
      dayOfMonth: dayOfMonth || undefined,
      fromDate: new Date(),
    })

    // Resolve siteId if not passed
    let siteId = input.siteId || null
    let workspaceId = input.workspaceId || null
    if (!siteId) {
      const siteRes = await pool.query(
        `SELECT id, workspace_id FROM sites WHERE domain = $1 LIMIT 1`,
        [domain]
      )
      if (siteRes.rows.length > 0) {
        siteId = siteRes.rows[0].id
        workspaceId = workspaceId || siteRes.rows[0].workspace_id || null
      }
    }

    const existing = await this.getScheduleByDomain(domain)
    const scheduleId = existing ? existing.id : randomUUID()

    const upsertRes = await pool.query(
      `INSERT INTO scan_schedules (
        id, workspace_id, site_id, domain, enabled, frequency,
        day_of_week, day_of_month, time_of_day, timezone,
        next_run_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, NOW(), NOW()
      )
      ON CONFLICT (domain) DO UPDATE SET
        workspace_id = COALESCE(EXCLUDED.workspace_id, scan_schedules.workspace_id),
        site_id = COALESCE(EXCLUDED.site_id, scan_schedules.site_id),
        enabled = EXCLUDED.enabled,
        frequency = EXCLUDED.frequency,
        day_of_week = EXCLUDED.day_of_week,
        day_of_month = EXCLUDED.day_of_month,
        time_of_day = EXCLUDED.time_of_day,
        timezone = EXCLUDED.timezone,
        next_run_at = EXCLUDED.next_run_at,
        updated_at = NOW()
      RETURNING *`,
      [
        scheduleId,
        workspaceId,
        siteId,
        domain,
        enabled,
        frequency,
        dayOfWeek,
        dayOfMonth,
        timeOfDay,
        timezone,
        nextRunAt.toISOString(),
      ]
    )

    return upsertRes.rows[0] as ScanScheduleRecord
  }

  /**
   * Deletes a schedule for a domain.
   */
  static async deleteSchedule(rawDomain: string): Promise<boolean> {
    await ensureTables()
    const domain = sanitizeDomain(rawDomain)
    if (!domain) return false

    const res = await pool.query(`DELETE FROM scan_schedules WHERE domain = $1`, [domain])
    return (res.rowCount ?? 0) > 0
  }

  /**
   * Toggles the enabled status of a schedule.
   */
  static async setScheduleEnabled(rawDomain: string, enabled: boolean): Promise<ScanScheduleRecord | null> {
    await ensureTables()
    const domain = sanitizeDomain(rawDomain)
    if (!domain) return null

    const existing = await this.getScheduleByDomain(domain)
    if (!existing) {
      throw new Error(`No scan schedule found for domain '${domain}'.`)
    }

    let nextRunAt = existing.next_run_at
    if (enabled) {
      // Recalculate next run from now
      const calc = calculateNextRun({
        frequency: existing.frequency,
        timeOfDay: existing.time_of_day,
        timezone: existing.timezone,
        dayOfWeek: existing.day_of_week || undefined,
        dayOfMonth: existing.day_of_month || undefined,
        fromDate: new Date(),
      })
      nextRunAt = calc.nextRunAt.toISOString()
    }

    const res = await pool.query(
      `UPDATE scan_schedules 
       SET enabled = $1, next_run_at = $2, updated_at = NOW() 
       WHERE domain = $3 
       RETURNING *`,
      [enabled, nextRunAt, domain]
    )

    return res.rows[0] as ScanScheduleRecord
  }

  private static _inFlightProcess: Promise<any> | null = null

  /**
   * Finds due schedules and executes/enqueues scanner jobs.
   * Atomically claims schedules and handles overlapping scans & duplicate prevention.
   */
  static async processDueSchedules(options: { maxJobs?: number; executeInline?: boolean } = {}): Promise<{
    processed: number
    skipped: number
    failed: number
    results: Array<{ domain: string; status: "completed" | "skipped" | "failed" | "queued"; message?: string }>
  }> {
    if (ScheduleService._inFlightProcess) {
      return ScheduleService._inFlightProcess
    }

    ScheduleService._inFlightProcess = (async () => {
      try {
        return await ScheduleService._doProcessDueSchedules(options)
      } finally {
        ScheduleService._inFlightProcess = null
      }
    })()

    return ScheduleService._inFlightProcess
  }

  private static async _doProcessDueSchedules(options: { maxJobs?: number; executeInline?: boolean } = {}): Promise<{
    processed: number
    skipped: number
    failed: number
    results: Array<{ domain: string; status: "completed" | "skipped" | "failed" | "queued"; message?: string }>
  }> {
    await ensureTables()
    const maxJobs = options.maxJobs || 20
    const executeInline = options.executeInline !== false

    const client = await pool.connect()
    const dueSchedules: ScanScheduleRecord[] = []
    let hasError = false

    try {
      await client.query("BEGIN")

      // Atomically select and lock due schedules
      const dueRes = await client.query(
        `SELECT * FROM scan_schedules 
         WHERE enabled = TRUE AND next_run_at <= NOW() 
         ORDER BY next_run_at ASC 
         LIMIT $1 
         FOR UPDATE SKIP LOCKED`,
        [maxJobs]
      )

      dueSchedules.push(...(dueRes.rows as ScanScheduleRecord[]))
      await client.query("COMMIT")
    } catch (err) {
      hasError = true
      await client.query("ROLLBACK").catch(() => {})
      throw err
    } finally {
      client.release(hasError)
    }

    const results: Array<{ domain: string; status: "completed" | "skipped" | "failed" | "queued"; message?: string }> = []
    let processed = 0
    let skipped = 0
    let failed = 0

    for (const schedule of dueSchedules) {
      const domain = schedule.domain
      const scheduleId = schedule.id
      const scheduledOccurrence = `${scheduleId}_${new Date(schedule.next_run_at).toISOString()}`

      // 1. Site Lifecycle Check: If site_id is present, verify site is still active
      if (schedule.site_id) {
        const siteCheck = await pool.query(`SELECT id FROM sites WHERE id = $1 LIMIT 1`, [schedule.site_id])
        if (siteCheck.rows.length === 0) {
          // Site was deleted - disable schedule to prevent orphaned execution
          await pool.query(
            `UPDATE scan_schedules 
             SET enabled = FALSE, last_run_status = 'failed', last_error = 'Site no longer exists', updated_at = NOW() 
             WHERE id = $1`,
            [scheduleId]
          )
          results.push({ domain, status: "failed", message: "Site deleted" })
          failed++
          continue
        }
      }

      // 2. Concurrency & Overlap Protection: Check if a scan is already running/queued for this domain
      const activeScanRes = await pool.query(
        `SELECT id FROM scans WHERE domain = $1 AND status IN ('queued', 'running') LIMIT 1`,
        [domain]
      )

      if (activeScanRes.rows.length > 0) {
        // Overlapping scan detected - skip and compute next run without creating duplicate work
        const nextCalc = calculateNextRun({
          frequency: schedule.frequency,
          timeOfDay: schedule.time_of_day,
          timezone: schedule.timezone,
          dayOfWeek: schedule.day_of_week || undefined,
          dayOfMonth: schedule.day_of_month || undefined,
          fromDate: new Date(),
        })

        await pool.query(
          `UPDATE scan_schedules 
           SET next_run_at = $1, 
               last_run_at = NOW(), 
               last_run_status = 'skipped', 
               last_error = 'Skipped: Previous scan still in progress', 
               updated_at = NOW() 
           WHERE id = $2`,
          [nextCalc.nextRunAt.toISOString(), scheduleId]
        )

        results.push({ domain, status: "skipped", message: "Previous scan still active" })
        skipped++
        continue
      }

      // 3. Idempotency Protection: Check if this specific occurrence was already executed
      const duplicateRes = await pool.query(
        `SELECT id FROM scans WHERE schedule_id = $1 AND scheduled_occurrence = $2 LIMIT 1`,
        [scheduleId, scheduledOccurrence]
      )

      if (duplicateRes.rows.length > 0) {
        // Duplicate cron trigger detected - advance schedule
        const nextCalc = calculateNextRun({
          frequency: schedule.frequency,
          timeOfDay: schedule.time_of_day,
          timezone: schedule.timezone,
          dayOfWeek: schedule.day_of_week || undefined,
          dayOfMonth: schedule.day_of_month || undefined,
          fromDate: new Date(),
        })

        await pool.query(
          `UPDATE scan_schedules 
           SET next_run_at = $1, updated_at = NOW() 
           WHERE id = $2`,
          [nextCalc.nextRunAt.toISOString(), scheduleId]
        )

        results.push({ domain, status: "skipped", message: "Occurrence already executed" })
        skipped++
        continue
      }

      // 4. Create Scan Job using existing ScanService
      try {
        const job = await ScanService.createScanJob(domain, schedule.site_id, {
          triggerSource: "scheduled",
          scheduleId: schedule.id,
          scheduledOccurrence,
        })

        // Compute next run date immediately
        const nextCalc = calculateNextRun({
          frequency: schedule.frequency,
          timeOfDay: schedule.time_of_day,
          timezone: schedule.timezone,
          dayOfWeek: schedule.day_of_week || undefined,
          dayOfMonth: schedule.day_of_month || undefined,
          fromDate: new Date(),
        })

        if (executeInline) {
          // Execute scan through existing hybrid scanner
          const executed = await ScanService.executeScanJob(job.id)
          const runStatus = executed.status === "completed" ? "completed" : "failed"
          const lastError = executed.error_message || null

          await pool.query(
            `UPDATE scan_schedules 
             SET next_run_at = $1, 
                 last_run_at = NOW(), 
                 last_run_status = $2, 
                 last_error = $3, 
                 updated_at = NOW() 
             WHERE id = $4`,
            [nextCalc.nextRunAt.toISOString(), runStatus, lastError, scheduleId]
          )

          if (runStatus === "completed") {
            processed++
            results.push({ domain, status: "completed", message: `Found ${executed.cookies_found} cookies` })
          } else {
            failed++
            results.push({ domain, status: "failed", message: lastError || "Scan failed" })
          }
        } else {
          // Queued for worker daemon
          await pool.query(
            `UPDATE scan_schedules 
             SET next_run_at = $1, 
                 last_run_at = NOW(), 
                 last_run_status = 'completed', 
                 last_error = NULL, 
                 updated_at = NOW() 
             WHERE id = $2`,
            [nextCalc.nextRunAt.toISOString(), scheduleId]
          )
          processed++
          results.push({ domain, status: "queued", message: `Scan job ${job.id} queued` })
        }
      } catch (err: any) {
        failed++
        const nextCalc = calculateNextRun({
          frequency: schedule.frequency,
          timeOfDay: schedule.time_of_day,
          timezone: schedule.timezone,
          dayOfWeek: schedule.day_of_week || undefined,
          dayOfMonth: schedule.day_of_month || undefined,
          fromDate: new Date(),
        })

        await pool.query(
          `UPDATE scan_schedules 
           SET next_run_at = $1, 
               last_run_at = NOW(), 
               last_run_status = 'failed', 
               last_error = $2, 
               updated_at = NOW() 
           WHERE id = $3`,
          [nextCalc.nextRunAt.toISOString(), err.message || "Failed to trigger scan", scheduleId]
        )

        results.push({ domain, status: "failed", message: err.message })
      }
    }

    return {
      processed,
      skipped,
      failed,
      results,
    }
  }
}

// Global In-Process Background Scheduler Daemon (Self-Triggering)
if (typeof window === "undefined" && !(globalThis as any).__cmp_scheduler_daemon_started) {
  ;(globalThis as any).__cmp_scheduler_daemon_started = true
  
  // Initial check 3 seconds after server starts/loads
  setTimeout(() => {
    ScheduleService.processDueSchedules({ maxJobs: 5, executeInline: true }).catch((err) => {
      console.warn("[CMP Scheduler Daemon] Initial check error:", err)
    })
  }, 3000)

  // Recurring check every 30 seconds
  setInterval(() => {
    ScheduleService.processDueSchedules({ maxJobs: 5, executeInline: true }).catch((err) => {
      console.warn("[CMP Scheduler Daemon] Periodic check error:", err)
    })
  }, 30000)
}

