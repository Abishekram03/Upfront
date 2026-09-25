export type ConsentLawTemplateId = "gdpr" | "ccpa" | "dpdp" | "lgpd" | "notice_only"

export type ConsentModel = "opt_in" | "opt_out" | "notice_only"

export interface CategoryDefinition {
  title: string
  description: string
  alwaysActive?: boolean
  defaultChecked?: boolean
}

export interface PresetCategories {
  necessary: CategoryDefinition
  functional: CategoryDefinition
  analytics: CategoryDefinition
  performance: CategoryDefinition
  advertisement: CategoryDefinition
}

export interface PresetBannerData {
  title: string
  description: string
  accept_all_label: string
  reject_all_label: string
  preferences_label: string
  save_preferences_label: string
  pref_accept_all_label: string
  pref_reject_all_label: string
  show_reject_button?: boolean
  show_preferences_button?: boolean
}

export interface PresetPreferenceCenterData {
  title: string
  description: string
  always_active_label: string
  save_preferences_label: string
}

export interface PresetCookieTableLabels {
  cookie_column_label: string
  duration_column_label: string
  description_column_label: string
  no_cookies_to_display_label: string
}

export interface PresetRuntimeConfig {
  enable_gpc: boolean
  google_consent_mode: boolean
  geo_targeting: "eu_uk" | "us_ca" | "in" | "br" | "all" | "none"
  prior_blocking: boolean
}

export interface LawPreset {
  id: ConsentLawTemplateId
  name: string
  jurisdiction: string
  badge: string
  info: string
  consentModel: ConsentModel
  defaultCategories: {
    necessary: boolean
    functional: boolean
    analytics: boolean
    performance: boolean
    advertisement: boolean
  }
  bannerData: PresetBannerData
  preferenceCenterData: PresetPreferenceCenterData
  categories: PresetCategories
  cookieTableLabels?: PresetCookieTableLabels
  runtimeConfig: PresetRuntimeConfig
}
