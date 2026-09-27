/**
 * UpFront CMP Scanner - Standalone Worker Process
 *
 * Can be run as a daemon worker:
 * node apps/web/lib/scanner/worker.js
 *
 * Polls the scans table for 'queued' jobs and processes them via Playwright / HTTP hybrid engine.
 */

import { pool, ensureTables } from "@/lib/db"
import { ScanService } from "./scan-service"

export async function processNextQueuedScan(): Promise<boolean> {
  await ensureTables()

  const nextJobRes = await pool.query(
    `SELECT id FROM scans WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED`
  )

  if (nextJobRes.rows.length === 0) {
    return false
  }

  const scanId = nextJobRes.rows[0].id
  console.log(`[Scanner Worker] Processing queued scan job: ${scanId}`)

  try {
    await ScanService.executeScanJob(scanId)
    console.log(`[Scanner Worker] Completed scan job: ${scanId}`)
    return true
  } catch (err: any) {
    console.error(`[Scanner Worker] Failed scan job ${scanId}:`, err.message)
    return true
  }
}

export async function startWorkerDaemon(intervalMs = 3000): Promise<void> {
  console.log(`[Scanner Worker] Daemon started, polling every ${intervalMs}ms...`)
  let running = true

  process.on("SIGINT", () => {
    running = false
    console.log("[Scanner Worker] Stopping worker daemon...")
  })

  while (running) {
    try {
      const processed = await processNextQueuedScan()
      if (!processed) {
        await new Promise((r) => setTimeout(r, intervalMs))
      }
    } catch (e) {
      console.error("[Scanner Worker] Worker loop error:", e)
      await new Promise((r) => setTimeout(r, intervalMs))
    }
  }
}
