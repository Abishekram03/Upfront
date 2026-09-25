import { LawPreset } from "./types"

export const dpdpPreset: LawPreset = {
  id: "dpdp",
  name: "DPDP Act (India)",
  jurisdiction: "India",
  badge: "Purpose-Oriented Consent",
  info: "Indian Digital Personal Data Protection Act requires purpose-oriented consent specification, clear notices in plain language, accessible withdrawal mechanism, and grievance redressal notice.",
  consentModel: "opt_in",
  defaultCategories: {
    necessary: true,
    functional: false,
    analytics: false,
    performance: false,
    advertisement: false,
  },
  bannerData: {
    title: "Notice for Processing Digital Personal Data",
    description: "In accordance with the DPDP Act, we process digital personal data only for specified lawful purposes to deliver our web services. Essential technical operations are active. You may consent to optional processing purposes or manage/withdraw consent at any time.",
    accept_all_label: "Consent to All Purposes",
    reject_all_label: "Decline Optional Purposes",
    preferences_label: "Manage Specific Purposes",
    save_preferences_label: "Save Purpose Consents",
    pref_accept_all_label: "Consent to All",
    pref_reject_all_label: "Decline Optional",
    show_reject_button: true,
    show_preferences_button: true,
  },
  preferenceCenterData: {
    title: "Itemized Purpose Consent Management (DPDP Act)",
    description: "Digital personal data is processed strictly for the specified purposes chosen below. You have the statutory right to review, modify, or withdraw consent at any time.",
    always_active_label: "Core Operations",
    save_preferences_label: "Save Purpose Consents",
  },
  categories: {
    necessary: {
      title: "Core Platform Operation & Security",
      description: "Required for digital authentication, secure communications, fraud prevention, and maintaining compliance records. Cannot be disabled.",
      alwaysActive: true,
      defaultChecked: true,
    },
    functional: {
      title: "Feature Enhancements & Usability",
      description: "Processes data to remember visitor preferences, live assistance sessions, and personalized interface settings.",
      defaultChecked: false,
    },
    analytics: {
      title: "Product Analytics & Service Quality",
      description: "Collects aggregated metrics to understand usage patterns, improve features, and enhance platform responsiveness.",
      defaultChecked: false,
    },
    performance: {
      title: "System Reliability & Error Telemetry",
      description: "Gathers system performance telemetry to diagnose latency, optimize uptime, and resolve software exceptions.",
      defaultChecked: false,
    },
    advertisement: {
      title: "Personalized Content & Relevant Offers",
      description: "Processes personal data to present relevant promotional messaging and deliver tailored announcements.",
      defaultChecked: false,
    },
  },
  runtimeConfig: {
    enable_gpc: true,
    google_consent_mode: true,
    geo_targeting: "in",
    prior_blocking: true,
  },
}
