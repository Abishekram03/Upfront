import { LawPreset } from "./types"

export const ccpaPreset: LawPreset = {
  id: "ccpa",
  name: "CCPA / CPRA (Opt-Out)",
  jurisdiction: "California, US",
  badge: "Opt-Out / Notice",
  info: "Statutory notice of personal data collection with a prominent 'Do Not Sell or Share My Personal Info' mechanism and automatic Global Privacy Control (GPC) opt-out signal honor.",
  consentModel: "opt_out",
  defaultCategories: {
    necessary: true,
    functional: true,
    analytics: true,
    performance: true,
    advertisement: true,
  },
  bannerData: {
    title: "Notice at Collection & Privacy Choices",
    description: "Under the California Consumer Privacy Act (CCPA/CPRA), you have the right to opt out of the sale or sharing of your personal information for cross-context behavioral advertising.",
    accept_all_label: "Accept & Continue",
    reject_all_label: "Do Not Sell or Share My Info",
    preferences_label: "Privacy Choices",
    save_preferences_label: "Save Privacy Choices",
    pref_accept_all_label: "Allow All",
    pref_reject_all_label: "Opt-Out of All Sale/Sharing",
    show_reject_button: true,
    show_preferences_button: true,
  },
  preferenceCenterData: {
    title: "Your California Privacy Choices",
    description: "Review and manage how your personal information is used. You may opt out of the sale or sharing of personal data for targeted advertising below. Essential services cannot be disabled.",
    always_active_label: "Strictly Necessary",
    save_preferences_label: "Save Privacy Choices",
  },
  categories: {
    necessary: {
      title: "Essential & Security",
      description: "Required for fundamental site security, user authentication, transaction fraud prevention, and maintaining compliance records.",
      alwaysActive: true,
      defaultChecked: true,
    },
    functional: {
      title: "Preferences & Personalization",
      description: "Preserves user interface settings, localized content, and interactive site features without selling personal information.",
      defaultChecked: true,
    },
    analytics: {
      title: "Audience & Analytics Metrics",
      description: "Measures site traffic patterns, visit frequency, and general engagement to maintain and improve website features.",
      defaultChecked: true,
    },
    performance: {
      title: "Speed & Infrastructure Diagnostics",
      description: "Monitors page load latency, uptime metrics, and application performance without cross-site tracking.",
      defaultChecked: true,
    },
    advertisement: {
      title: "Sale / Sharing for Targeted Ads",
      description: "Enables cross-context behavioral advertising and third-party data sharing. Turning this off opts you out of data sale and sharing under CCPA/CPRA.",
      defaultChecked: true,
    },
  },
  runtimeConfig: {
    enable_gpc: true,
    google_consent_mode: true,
    geo_targeting: "us_ca",
    prior_blocking: false,
  },
}
