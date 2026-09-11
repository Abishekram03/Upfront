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
  timezone: string
  created_at: string
  status?: "active" | "waiting"
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function fetchStats(domain: string, period: string = "30d"): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE}/api/v1/stats?domain=${encodeURIComponent(domain)}&period=${period}`, {
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
  layout: "bottom_bar" | "floating_bottom_left" | "floating_bottom_right" | "center_modal"
  theme: "light" | "dark" | "brand"
  primary_color: string
  border_radius: string
  title: string
  description: string
  privacy_policy_url: string
  accept_all_label: string
  reject_all_label: string
  preferences_label: string
  enable_necessary_category?: boolean
  enable_functional_category: boolean
  enable_analytics_category: boolean
  enable_performance_category: boolean
  enable_advertisement_category: boolean
  show_revisit_button: boolean
  revisit_button_position: "bottom_left" | "bottom_right"
  enable_consent_mode_v2: boolean
  geo_targeting: "all" | "eu_uk_only" | "eu_uk_us_only"
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
  total_receipts: number
  acceptance_rate: number
  rejection_rate: number
  necessary_accepted_pct: number
  functional_accepted_pct: number
  analytics_accepted_pct: number
  performance_accepted_pct: number
  advertisement_accepted_pct: number
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

