/**
 * UpFront CMP Scanner - Types & Interfaces
 */

import type { ConsentCategory } from "@/lib/consentos/open-cookie-db"

export type DiscoverySource =
  | "http_set_cookie"
  | "browser_cookie"
  | "script_signature"
  | "open_cookie_db"
  | "manual"

export type ScanStatus = "queued" | "running" | "completed" | "failed"

export type FindingSeverity = "critical" | "medium" | "low"
export type FindingType = "leak" | "info" | "warning"

export interface FindingItem {
  type: FindingType
  message: string
  severity: FindingSeverity
  source?: string
  detected_at?: string
}

export interface DiscoveredCookieRaw {
  name: string
  domain: string
  path?: string
  duration?: string
  expires?: number | null
  isSecure?: boolean
  isHttpOnly?: boolean
  sameSite?: string
  discoverySource: DiscoverySource
  serviceName?: string
  category?: ConsentCategory
  description?: string
  scriptPatternRegex?: string
}

export interface ScanJobRecord {
  id: string
  site_id?: string | null
  domain: string
  status: ScanStatus
  scan_type: "hybrid" | "http_only" | "browser_only"
  cookies_found: number
  scripts_found: number
  leaks_found: number
  dark_patterns_found: number
  findings: FindingItem[]
  error_message?: string | null
  created_at: string
  completed_at?: string | null
}

export interface ScannerOptions {
  timeoutMs?: number
  maxPages?: number
  allowInsecureHttp?: boolean
  executionDelayMs?: number
  skipBrowser?: boolean
}

export interface ScanExecutionResult {
  scanId: string
  domain: string
  status: ScanStatus
  cookies: DiscoveredCookieRaw[]
  scripts: string[]
  findings: FindingItem[]
  durationMs: number
  errorMessage?: string
}
