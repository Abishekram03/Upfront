/**
 * UpFront - Final Plan Definitions & Capability Configuration
 *
 * Finalized Tiers:
 * 1. Free ($0/mo) - Analytics + essential consent management
 * 2. Growth ($19/mo) - Full consent management for growing websites
 * 3. Business ($49/mo) - Advanced compliance and customization
 */

export type PlanId = "free" | "growth" | "business"

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "canceled"

export type EntitlementKey =
  | "analytics.enabled"
  | "analytics.monthly_pageviews"
  | "analytics.retention_days"
  | "cmp.banner"
  | "cmp.box_layout"
  | "cmp.popup_layout"
  | "cmp.script_rules"
  | "cmp.banner_studio"
  | "cmp.legal_frameworks"
  | "cmp.cookie_scanner"
  | "cmp.cookie_policy"
  | "cmp.consent_proof"
  | "cmp.gpc"
  | "cmp.geo_targeting"
  | "cmp.google_consent_mode_v2"
  | "cmp.multilingual"
  | "cmp.scheduled_scans"
  | "cmp.scheduled_scan_frequencies"
  | "cmp.tcf_v23"
  | "cmp.custom_css"
  | "cmp.version_history"
  | "cmp.whitelabel"
  | "scan.pages_per_scan"
  | "consent.history_days"

export interface PlanConfig {
  id: PlanId
  name: string
  priceMonthly: number
  positioning: string
  description: string
  paddlePriceId?: string
  popular?: boolean
  limits: {
    monthlyPageviews: number
    retentionDays: number
    pagesPerScan: number
    consentHistoryDays: number
  }
  features: {
    analytics: string[]
    cmp: string[]
    unavailable: string[]
  }
  capabilities: Record<EntitlementKey, any>
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    positioning: "Analytics + essential consent management",
    description: "Ideal for personal sites, blogs, and testing.",
    limits: {
      monthlyPageviews: 50_000,
      retentionDays: 90, // 3 months
      pagesPerScan: 100,
      consentHistoryDays: 30,
    },
    features: {
      analytics: [
        "Unlimited websites",
        "50,000 pageviews/month",
        "Full analytics",
        "Real-time analytics",
        "3 months analytics history",
      ],
      cmp: [
        "Consent banner",
        "Banner Studio: Basic",
        "Legal frameworks: Basic",
        "Cookie scanner: Basic (100 pages/scan)",
        "Cookie Policy: Basic",
        "Consent Proof: Basic (30 days)",
      ],
      unavailable: [
        "GPC (Global Privacy Control)",
        "Geo-targeting",
        "Google Consent Mode v2",
        "Full Multi-language",
        "Scheduled scans",
        "IAB TCF v2.3",
        "Custom CSS",
        "Version history & rollback",
      ],
    },
    capabilities: {
      "analytics.enabled": true,
      "analytics.monthly_pageviews": 10_000_000,
      "analytics.retention_days": 3650,
      "cmp.banner": true,
      "cmp.box_layout": true,
      "cmp.popup_layout": true,
      "cmp.script_rules": "full",
      "cmp.banner_studio": "full",
      "cmp.legal_frameworks": "full",
      "cmp.cookie_scanner": "full",
      "cmp.cookie_policy": "full",
      "cmp.consent_proof": "full",
      "cmp.gpc": true,
      "cmp.geo_targeting": true,
      "cmp.google_consent_mode_v2": true,
      "cmp.multilingual": true,
      "cmp.scheduled_scans": true,
      "cmp.scheduled_scan_frequencies": ["daily", "weekly", "monthly"],
      "cmp.tcf_v23": true,
      "cmp.custom_css": true,
      "cmp.version_history": true,
      "cmp.whitelabel": true,
      "scan.pages_per_scan": 100_000,
      "consent.history_days": 3650,
    },
  },

  growth: {
    id: "growth",
    name: "Growth",
    priceMonthly: 19,
    positioning: "Full consent management for growing websites",
    description: "Everything required for standard GDPR, CCPA, and compliance automation.",
    popular: true,
    limits: {
      monthlyPageviews: 250_000,
      retentionDays: 365, // 12 months
      pagesPerScan: 1_000,
      consentHistoryDays: 365,
    },
    features: {
      analytics: [
        "Unlimited websites",
        "250,000 pageviews/month",
        "Full analytics",
        "Real-time analytics",
        "12 months analytics history",
      ],
      cmp: [
        "Consent banner, Box, & Popup layouts",
        "Full Banner Studio",
        "All legal frameworks (GDPR, CCPA, DPDP, LGPD, Notice Only)",
        "Full Cookie Scanner (1,000 pages/scan)",
        "Full Script Blocking Rules & Regex",
        "Full Cookie Policy Generator",
        "Full Consent Proof Vault (12 months)",
        "Global Privacy Control (GPC)",
        "Geo-Targeting Rules",
        "Google Consent Mode v2",
        "Monthly Scheduled Scans",
        "Version History & Rollback",
        "Remove Upfront Branding",
      ],
      unavailable: [
        "Multi-language Translations & Auto-detection (9+ Languages)",
        "IAB TCF v2.3 Framework",
        "Custom CSS Injection",
      ],
    },
    capabilities: {
      "analytics.enabled": true,
      "analytics.monthly_pageviews": 250_000,
      "analytics.retention_days": 365,
      "cmp.banner": true,
      "cmp.box_layout": true,
      "cmp.popup_layout": true,
      "cmp.script_rules": "full",
      "cmp.banner_studio": "full",
      "cmp.legal_frameworks": "full",
      "cmp.cookie_scanner": "full",
      "cmp.cookie_policy": "full",
      "cmp.consent_proof": "full",
      "cmp.gpc": true,
      "cmp.geo_targeting": true,
      "cmp.google_consent_mode_v2": true,
      "cmp.multilingual": false,
      "cmp.scheduled_scans": true,
      "cmp.scheduled_scan_frequencies": ["monthly"],
      "cmp.tcf_v23": false,
      "cmp.custom_css": false,
      "cmp.version_history": true,
      "cmp.whitelabel": true,
      "scan.pages_per_scan": 1_000,
      "consent.history_days": 365,
    },
  },

  business: {
    id: "business",
    name: "Business",
    priceMonthly: 49,
    positioning: "Advanced compliance and customization",
    description: "For publishers, ad-supported sites, and enterprise customization.",
    limits: {
      monthlyPageviews: 1_000_000,
      retentionDays: 730, // 24 months
      pagesPerScan: 5_000,
      consentHistoryDays: 730,
    },
    features: {
      analytics: [
        "Unlimited websites",
        "1,000,000 pageviews/month",
        "Full analytics",
        "Real-time analytics",
        "24 months analytics history",
      ],
      cmp: [
        "Everything in Growth",
        "Multi-Language Translations Suite (9+ Languages & Auto-Detection)",
        "Weekly & Daily Scheduled Scans (5,000 pages/scan)",
        "24-month Consent Audit Vault",
        "IAB Transparency and Consent Framework (TCF v2.3)",
        "Custom CSS Editor & Style Overrides",
        "White-labeling & Branding Controls (Remove Upfront Branding)",
      ],
      unavailable: [],
    },
    capabilities: {
      "analytics.enabled": true,
      "analytics.monthly_pageviews": 1_000_000,
      "analytics.retention_days": 730,
      "cmp.banner": true,
      "cmp.box_layout": true,
      "cmp.popup_layout": true,
      "cmp.script_rules": "full",
      "cmp.banner_studio": "full",
      "cmp.legal_frameworks": "full",
      "cmp.cookie_scanner": "full",
      "cmp.cookie_policy": "full",
      "cmp.consent_proof": "full",
      "cmp.gpc": true,
      "cmp.geo_targeting": true,
      "cmp.google_consent_mode_v2": true,
      "cmp.multilingual": true,
      "cmp.scheduled_scans": true,
      "cmp.scheduled_scan_frequencies": ["daily", "weekly", "monthly"],
      "cmp.tcf_v23": true,
      "cmp.custom_css": true,
      "cmp.version_history": true,
      "cmp.whitelabel": true,
      "scan.pages_per_scan": 5_000,
      "consent.history_days": 730,
    },
  },
}

/**
 * Returns plan configuration by Plan ID. Defaults to 'free'.
 */
export function getPlan(planId?: string | null): PlanConfig {
  if (planId === "business") return PLANS.business
  if (planId === "growth") return PLANS.growth
  return PLANS.free
}

/**
 * Returns the minimal required plan for a given capability key.
 */
export function getRequiredPlanForCapability(key: EntitlementKey): PlanId {
  return "free"
}

export const PADDLE_PRICE_IDS = {
  growth: "pri_01m3rgvtt17yk5y36mvjwqq65k", // $19/month in Paddle
  business: "pri_01m3rgx14zzhfr3g10241pxw93", // $39/$49/month in Paddle
} as const

export const PADDLE_ADDON_PRICE_IDS = {
  pageviews_100k: "pri_01addon_100k_pageviews",
} as const

export interface AddonPackageConfig {
  id: string
  name: string
  price: number
  pageviews: number
  rollover: boolean
  description: string
  paddlePriceId?: string
}

export const ADDON_PACKAGES: Record<string, AddonPackageConfig> = {
  pageviews_100k: {
    id: "pageviews_100k",
    name: "100k Pageview Booster",
    price: 10,
    pageviews: 100_000,
    rollover: true,
    description: "Instant 100,000 pageview capacity. Unused pageviews roll over month-to-month and never expire.",
    paddlePriceId: process.env.NEXT_PUBLIC_PADDLE_ADDON_100K_PRICE_ID || PADDLE_ADDON_PRICE_IDS.pageviews_100k,
  },
}

/**
 * Resolves plan by Paddle Price / Product ID.
 */
export function getPlanByPaddlePriceId(priceId?: string | null): PlanId {
  if (!priceId) return "free"
  const growthPriceId = process.env.NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID || PADDLE_PRICE_IDS.growth
  const businessPriceId = process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID || PADDLE_PRICE_IDS.business

  if (
    priceId === businessPriceId ||
    priceId === PADDLE_PRICE_IDS.business ||
    priceId.toLowerCase().includes("business")
  ) {
    return "business"
  }
  if (
    priceId === growthPriceId ||
    priceId === PADDLE_PRICE_IDS.growth ||
    priceId.toLowerCase().includes("growth")
  ) {
    return "growth"
  }
  return "free"
}

