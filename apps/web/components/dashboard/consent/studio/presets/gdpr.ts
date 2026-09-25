import { LawPreset } from "./types"

export const gdprPreset: LawPreset = {
  id: "gdpr",
  name: "GDPR / UK GDPR",
  jurisdiction: "EU & UK",
  badge: "Strict Prior Consent",
  info: "Requires explicit affirmative consent before non-essential cookies or tracking scripts load. Equal visual prominence for Accept and Reject. Optional categories start unchecked.",
  consentModel: "opt_in",
  defaultCategories: {
    necessary: true,
    functional: false,
    analytics: false,
    performance: false,
    advertisement: false,
  },
  bannerData: {
    title: "We value your privacy",
    description: "We use cookies and tracking technologies to enhance your browsing experience, provide personalized content and ads, and analyze our web traffic. You may accept all cookies, reject non-essential cookies, or customize your preferences.",
    accept_all_label: "Accept All",
    reject_all_label: "Reject All",
    preferences_label: "Customise",
    save_preferences_label: "Save My Preferences",
    pref_accept_all_label: "Accept All",
    pref_reject_all_label: "Reject All",
    show_reject_button: true,
    show_preferences_button: true,
  },
  preferenceCenterData: {
    title: "Customise Consent Preferences",
    description: "We respect your privacy preferences. Essential cookies are required for website operation. Non-essential cookies and tracking scripts remain disabled until you give explicit consent.",
    always_active_label: "Always Active",
    save_preferences_label: "Save My Preferences",
  },
  categories: {
    necessary: {
      title: "Necessary & Security",
      description: "Essential cookies required for page rendering, secure user authentication, session integrity, and storing your consent preferences.",
      alwaysActive: true,
      defaultChecked: true,
    },
    functional: {
      title: "Functional & Preferences",
      description: "Enables enhanced site features including interactive widgets, language selections, and embedded multimedia content.",
      defaultChecked: false,
    },
    analytics: {
      title: "Analytics & Traffic Measurement",
      description: "Collects aggregated visitor metrics and journey statistics to analyze bounce rates, page load performance, and site usability.",
      defaultChecked: false,
    },
    performance: {
      title: "Performance & Diagnostics",
      description: "Monitors page load latency, server response times, and frontend error telemetry to maintain platform reliability.",
      defaultChecked: false,
    },
    advertisement: {
      title: "Marketing & Retargeting",
      description: "Allows customized promotional messaging and cross-platform conversion attribution tracking across third-party networks.",
      defaultChecked: false,
    },
  },
  runtimeConfig: {
    enable_gpc: true,
    google_consent_mode: true,
    geo_targeting: "eu_uk",
    prior_blocking: true,
  },
}
