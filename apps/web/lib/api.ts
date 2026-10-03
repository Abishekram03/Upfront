export interface MetricSummary {
  visitors: number
  previous_visitors: number
  visitors_change_pct: number
  pageviews: number
  previous_pageviews: number
  pageviews_change_pct: number
  bounce_rate: number
  previous_bounce_rate: number
  bounce_rate_change_pct: number
  visit_duration: number
  previous_visit_duration: number
  duration_change_pct: number
}

export interface TimeSeriesPoint {
  date: string
  label: string
  visitors: number
  pageviews: number
  bounce_rate: number
  duration: number
}

export interface BreakdownItem {
  id: string
  label: string
  value: number
  percentage: number
  icon?: string | null
  sublabel?: string | null
  link?: string | null
}

export interface DeviceBreakdown {
  screen_sizes: BreakdownItem[]
  browsers: BreakdownItem[]
  os: BreakdownItem[]
}

export interface StatsResponse {
  domain: string
  period: string
  realtime_visitors: number
  metrics: MetricSummary
  time_series: TimeSeriesPoint[]
  top_sources: BreakdownItem[]
  top_pages: BreakdownItem[]
  locations: BreakdownItem[]
  devices: DeviceBreakdown
}

export interface Site {
  id: string
  domain: string
  name?: string
  timezone: string
  created_at: string
  workspace_id?: string
  installation_status?: "not_started" | "pending" | "detected" | "verification_failed"
  last_verified_at?: string | null
  status?: "active" | "waiting"
}

export interface StatsFilters {
  source?: string
  page?: string
  country?: string
  browser?: string
  device?: string
  os?: string
}

export const API_BASE = ""

export async function fetchStats(
  domain: string,
  period: string = "30d",
  filters?: StatsFilters
): Promise<StatsResponse> {
  const params = new URLSearchParams({
    domain,
    period,
  })
  if (filters?.source) params.append("source", filters.source)
  if (filters?.page) params.append("page", filters.page)
  if (filters?.country) params.append("country", filters.country)
  if (filters?.browser) params.append("browser", filters.browser)
  if (filters?.device) params.append("device", filters.device)
  if (filters?.os) params.append("os", filters.os)

  const res = await fetch(`${API_BASE}/api/v1/stats?${params.toString()}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(errText || `Failed to fetch statistics: HTTP ${res.status}`)
  }
  return await res.json()
}

export async function fetchSites(): Promise<Site[]> {
  const res = await fetch(`${API_BASE}/api/v1/sites`, { cache: "no-store" })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(errText || `Failed to fetch sites: HTTP ${res.status}`)
  }
  return await res.json()
}

export async function createSite(domain: string, timezone: string = "UTC"): Promise<Site> {
  const res = await fetch(`${API_BASE}/api/v1/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, timezone }),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to create site")
  }
  return await res.json()
}

export async function updateSite(siteId: string, payload: { timezone?: string; public?: boolean }): Promise<Site> {
  const res = await fetch(`${API_BASE}/api/v1/sites/${siteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to update site")
  }
  return await res.json()
}

export async function deleteSite(siteId: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/sites/${siteId}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to delete site")
  }
  return await res.json()
}

// -------------------------------------------------------------
// CONSENT MANAGEMENT API
// -------------------------------------------------------------
export interface ConsentConfig {
  id?: string
  domain: string
  is_enabled: boolean
  layout:
    | "bottom_bar"
    | "top_bar"
    | "floating_bottom_left"
    | "floating_bottom_right"
    | "floating_top_left"
    | "floating_top_right"
    | "center_modal"
    | "box"
    | "popup"
  theme: "light" | "dark" | "brand"
  primary_color: string
  border_radius: string
  title: string
  description: string
  privacy_policy_url: string
  show_close_button?: boolean
  accept_all_label: string
  reject_all_label: string
  preferences_label: string
  preferences_title?: string
  preferences_description?: string
  preference_title?: string
  preference_description?: string
  preference_message?: string
  save_preferences_label?: string
  pref_accept_all_label?: string
  pref_reject_all_label?: string
  always_active_label?: string
  no_cookies_to_display_label?: string
  cookie_column_label?: string
  duration_column_label?: string
  description_column_label?: string
  show_google_policy?: boolean
  google_policy_message?: string
  google_policy_link_text?: string
  google_policy_url?: string
  show_cookie_list_on_banner?: boolean
  enable_necessary_category?: boolean
  enable_functional_category: boolean
  enable_analytics_category: boolean
  enable_performance_category: boolean
  enable_advertisement_category: boolean
  show_revisit_button: boolean
  revisit_button_position: "bottom_left" | "bottom_right"
  enable_consent_mode_v2: boolean
  enable_iab_tcf?: boolean
  enable_auto_language?: boolean
  default_language?: string
  supported_languages?: string[]
  geo_targeting: "all" | "eu_only" | "eu_uk_only" | "custom" | string
  target_countries?: string[]
  enable_gpc?: boolean
  law_template?: string
  category_configs?: Record<string, any>
  necessary_title?: string
  necessary_description?: string
  functional_title?: string
  functional_description?: string
  analytics_title?: string
  analytics_description?: string
  performance_title?: string
  performance_description?: string
  advertisement_title?: string
  advertisement_description?: string
  show_branding?: boolean
  hide_branding?: boolean
  consent_version?: string
  created_at?: string
  updated_at?: string
}

export interface ConsentReceipt {
  id: string
  domain: string
  visitor_hash: string
  country?: string | null
  consent_given: boolean
  necessary: boolean
  functional: boolean
  analytics: boolean
  performance: boolean
  advertisement: boolean
  marketing?: boolean
  user_agent_category: string
  created_at: string
}

export interface ConsentStatsSummary {
  domain: string
  total_decisions: number
  total_receipts: number
  accept_all_count?: number
  accept_all_rate: number
  reject_all_count?: number
  reject_all_rate: number
  custom_choice_count?: number
  custom_choice_rate: number
  analytics_opt_in_pct: number
  necessary_pct: number
  functional_pct: number
  analytics_pct: number
  performance_pct: number
  advertisement_pct: number
  is_connected?: boolean
  last_detected_at?: string | null
  // Backward compatibility aliases
  acceptance_rate?: number
  rejection_rate?: number
  necessary_accepted_pct?: number
  functional_accepted_pct?: number
  analytics_accepted_pct?: number
  performance_accepted_pct?: number
  advertisement_accepted_pct?: number
  recent_receipts: ConsentReceipt[]
}

export async function fetchConsentConfig(domain: string): Promise<ConsentConfig> {
  const res = await fetch(`${API_BASE}/api/v1/consent/config?domain=${encodeURIComponent(domain)}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to fetch consent configuration")
  }
  return await res.json()
}

export async function saveConsentConfig(config: ConsentConfig): Promise<ConsentConfig> {
  const res = await fetch(`${API_BASE}/api/v1/consent/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to save consent configuration")
  }
  return await res.json()
}

export async function fetchConsentReceipts(
  domain: string,
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<ConsentReceipt[]> {
  let url = `${API_BASE}/api/v1/consent/receipts?domain=${encodeURIComponent(domain)}&page=${page}&limit=${limit}`
  if (search) url += `&search=${encodeURIComponent(search)}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to fetch consent receipts")
  }
  return await res.json()
}

export async function fetchConsentStats(domain: string): Promise<ConsentStatsSummary> {
  const res = await fetch(`${API_BASE}/api/v1/consent/stats?domain=${encodeURIComponent(domain)}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to fetch consent statistics")
  }
  return await res.json()
}

export interface DiscoveredCookie {
  id: string
  site_id?: string
  domain: string
  name: string
  category: "necessary" | "functional" | "analytics" | "performance" | "advertisement"
  service_name?: string
  duration?: string
  description?: string
  confidence?: "high" | "medium" | "low"
  status?: string
  first_detected_at?: string
  last_detected_at?: string
}

export interface PreConsentLeak {
  type: string
  url?: string
  description?: string
  severity?: "critical" | "warning" | "info"
}

export interface ScanRun {
  id: string
  domain: string
  status: string
  cookies_found: number
  scripts_found: number
  leaks_found: number
  dark_patterns_found: number
  findings: PreConsentLeak[]
  created_at: string
}

export interface ScannerResponse {
  domain: string
  total_cookies: number
  latest_scan: ScanRun | null
  cookies: DiscoveredCookie[]
  pre_consent_leaks: PreConsentLeak[]
}

export async function fetchScannerData(domain: string): Promise<ScannerResponse> {
  const res = await fetch(`${API_BASE}/api/v1/consent/scanner?domain=${encodeURIComponent(domain)}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to fetch cookie scanner data")
  }
  return await res.json()
}

export async function triggerCookieScan(domain: string): Promise<ScannerResponse> {
  const res = await fetch(`${API_BASE}/api/v1/consent/scanner`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to run scanner")
  }
  return await res.json()
}

export async function updateDiscoveredCookie(
  cookieId: string,
  category: string,
  status?: string
): Promise<{ ok: boolean; cookie: DiscoveredCookie }> {
  const res = await fetch(`${API_BASE}/api/v1/consent/scanner`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: cookieId, category, status }),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to update cookie category")
  }
  return await res.json()
}

export interface ConsentDraftResponse {
  is_draft: boolean
  base_version: string
  published_version: string
  updated_at: string | null
  config: ConsentConfig | null
}

export interface ConsentVersion {
  id: string
  domain: string
  version: string
  config: any
  change_summary: string[]
  published_by?: string
  published_at: string
  previous_version?: string
}

export async function fetchConsentDraft(domain: string): Promise<ConsentDraftResponse> {
  const res = await fetch(`${API_BASE}/api/v1/consent/draft?domain=${encodeURIComponent(domain)}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to fetch draft configuration")
  }
  return await res.json()
}

export async function saveConsentDraft(
  domain: string,
  config: any,
  baseVersion: string = "1.0"
): Promise<{ ok: boolean; is_draft: boolean; updated_at: string; config: any }> {
  const res = await fetch(`${API_BASE}/api/v1/consent/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, base_version: baseVersion, config }),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to save draft")
  }
  return await res.json()
}

export async function discardConsentDraft(domain: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/v1/consent/draft?domain=${encodeURIComponent(domain)}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to discard draft")
  }
  return await res.json()
}

export async function publishConsentConfig(
  domain: string,
  config: any,
  baseVersion?: string
): Promise<{
  ok: boolean
  published_version: string
  change_summary: string[]
  published_at: string
  config: ConsentConfig
}> {
  const res = await fetch(`${API_BASE}/api/v1/consent/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, base_version: baseVersion, config }),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    if (res.status === 409) {
      throw new Error(`Conflict: ${errData.detail || "Configuration has changed on server."}`)
    }
    if (res.status === 422 && errData.errors) {
      throw new Error(`Validation failed:\n• ${errData.errors.join("\n• ")}`)
    }
    throw new Error(errData.detail || "Failed to publish consent configuration")
  }
  return await res.json()
}

export async function fetchConsentVersions(domain: string): Promise<{ domain: string; versions: ConsentVersion[] }> {
  const res = await fetch(`${API_BASE}/api/v1/consent/versions?domain=${encodeURIComponent(domain)}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to fetch version history")
  }
  return await res.json()
}

export async function restoreConsentVersion(
  domain: string,
  version: string
): Promise<{ ok: boolean; new_version: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/consent/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain, version }),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || "Failed to restore version")
  }
  return await res.json()
}


