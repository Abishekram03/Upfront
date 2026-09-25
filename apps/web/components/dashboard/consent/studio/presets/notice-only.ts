import { LawPreset } from "./types"

export const noticeOnlyPreset: LawPreset = {
  id: "notice_only",
  name: "Notice Only (Global / Informational)",
  jurisdiction: "Global / Non-Regulated",
  badge: "Informational Notice",
  info: "Informational cookie banner with a single acknowledgment button for jurisdictions without strict prior-consent requirements. Discloses cookie usage without presenting misleading multi-button gating.",
  consentModel: "notice_only",
  defaultCategories: {
    necessary: true,
    functional: true,
    analytics: true,
    performance: true,
    advertisement: true,
  },
  bannerData: {
    title: "Cookie Usage Notice",
    description: "This website uses cookies and related technologies to ensure you get the best browsing experience on our website and to analyze traffic.",
    accept_all_label: "Got it!",
    reject_all_label: "Dismiss",
    preferences_label: "Cookie Information",
    save_preferences_label: "Acknowledge",
    pref_accept_all_label: "Got it!",
    pref_reject_all_label: "Dismiss",
    show_reject_button: false,
    show_preferences_button: false,
  },
  preferenceCenterData: {
    title: "Cookie and Privacy Information",
    description: "Learn about the cookie categories utilized on this website to maintain site functionality, measure performance, and deliver services.",
    always_active_label: "Active",
    save_preferences_label: "Acknowledge & Close",
  },
  categories: {
    necessary: {
      title: "Essential & Security",
      description: "Required for core page navigation, security protection, and basic user preferences.",
      alwaysActive: true,
      defaultChecked: true,
    },
    functional: {
      title: "Functional Features",
      description: "Enables interactive tools, language selectors, and media playback.",
      defaultChecked: true,
    },
    analytics: {
      title: "Site Analytics",
      description: "Gathers aggregated website traffic and visitor engagement telemetry.",
      defaultChecked: true,
    },
    performance: {
      title: "Performance Diagnostics",
      description: "Assesses page load speed, server latency, and error reporting.",
      defaultChecked: true,
    },
    advertisement: {
      title: "Advertising & Attribution",
      description: "Supports campaign measurement and promotional content delivery.",
      defaultChecked: true,
    },
  },
  runtimeConfig: {
    enable_gpc: false,
    google_consent_mode: false,
    geo_targeting: "all",
    prior_blocking: false,
  },
}
