import { ConsentLawTemplateId, LawPreset } from "./types"
import { gdprPreset } from "./gdpr"
import { ccpaPreset } from "./ccpa"
import { dpdpPreset } from "./dpdp"
import { lgpdPreset } from "./lgpd"
import { noticeOnlyPreset } from "./notice-only"

export * from "./types"
export { gdprPreset, ccpaPreset, dpdpPreset, lgpdPreset, noticeOnlyPreset }

export const LAW_PRESETS: LawPreset[] = [
  gdprPreset,
  ccpaPreset,
  dpdpPreset,
  lgpdPreset,
  noticeOnlyPreset,
]

export const DEFAULT_PRESET_ID: ConsentLawTemplateId = "gdpr"

export function getPresetById(id?: string): LawPreset {
  if (!id) return gdprPreset
  return LAW_PRESETS.find((p) => p.id === id) || gdprPreset
}

export interface AppliedPresetConfig {
  law_template: ConsentLawTemplateId
  title: string
  description: string
  accept_all_label: string
  reject_all_label: string
  preferences_label: string
  save_preferences_label: string
  pref_accept_all_label: string
  pref_reject_all_label: string
  preference_title: string
  preference_description: string
  always_active_label: string
  necessary_title: string
  necessary_description: string
  functional_title: string
  functional_description: string
  analytics_title: string
  analytics_description: string
  performance_title: string
  performance_description: string
  advertisement_title: string
  advertisement_description: string
  default_functional: boolean
  default_analytics: boolean
  default_performance: boolean
  default_advertisement: boolean
  cookie_column_label?: string
  duration_column_label?: string
  description_column_label?: string
  no_cookies_to_display_label?: string
  enable_gpc: boolean
  google_consent_mode: boolean
  geo_targeting: string
}

/**
 * Pure function to immutably apply a legal preset onto a studio consent configuration.
 * Preserves custom domain ID, site ID, consent_version, and other site-specific metadata.
 */
export function applyPresetToConfig<T extends Record<string, any>>(
  prevConfig: T,
  preset: LawPreset
): T & AppliedPresetConfig {
  return {
    ...prevConfig,
    law_template: preset.id,

    // Banner texts & labels
    title: preset.bannerData.title,
    description: preset.bannerData.description,
    accept_all_label: preset.bannerData.accept_all_label,
    reject_all_label: preset.bannerData.reject_all_label,
    preferences_label: preset.bannerData.preferences_label,
    save_preferences_label: preset.bannerData.save_preferences_label,
    pref_accept_all_label: preset.bannerData.pref_accept_all_label,
    pref_reject_all_label: preset.bannerData.pref_reject_all_label,

    // Preference Center texts
    preferences_title: preset.preferenceCenterData.title,
    preferences_description: preset.preferenceCenterData.description,
    preference_title: preset.preferenceCenterData.title,
    preference_description: preset.preferenceCenterData.description,
    always_active_label: preset.preferenceCenterData.always_active_label,

    // 5 Category Titles & Descriptions
    necessary_title: preset.categories.necessary.title,
    necessary_description: preset.categories.necessary.description,
    functional_title: preset.categories.functional.title,
    functional_description: preset.categories.functional.description,
    analytics_title: preset.categories.analytics.title,
    analytics_description: preset.categories.analytics.description,
    performance_title: preset.categories.performance.title,
    performance_description: preset.categories.performance.description,
    advertisement_title: preset.categories.advertisement.title,
    advertisement_description: preset.categories.advertisement.description,

    // Category configs dictionary
    category_configs: {
      necessary: {
        name: preset.categories.necessary.title,
        description: preset.categories.necessary.description,
        required: true,
        enabled: true,
      },
      functional: {
        name: preset.categories.functional.title,
        description: preset.categories.functional.description,
        required: false,
        enabled: preset.defaultCategories.functional,
      },
      analytics: {
        name: preset.categories.analytics.title,
        description: preset.categories.analytics.description,
        required: false,
        enabled: preset.defaultCategories.analytics,
      },
      performance: {
        name: preset.categories.performance.title,
        description: preset.categories.performance.description,
        required: false,
        enabled: preset.defaultCategories.performance,
      },
      advertisement: {
        name: preset.categories.advertisement.title,
        description: preset.categories.advertisement.description,
        required: false,
        enabled: preset.defaultCategories.advertisement,
      },
    },

    // Category default states
    enable_necessary_category: true,
    enable_functional_category: preset.id !== "notice_only",
    enable_analytics_category: preset.id !== "notice_only",
    enable_performance_category: preset.id !== "notice_only",
    enable_advertisement_category: preset.id !== "notice_only",
    default_functional: preset.defaultCategories.functional,
    default_analytics: preset.defaultCategories.analytics,
    default_performance: preset.defaultCategories.performance,
    default_advertisement: preset.defaultCategories.advertisement,

    // Cookie Table Labels (if provided)
    ...(preset.cookieTableLabels ? {
      cookie_column_label: preset.cookieTableLabels.cookie_column_label,
      duration_column_label: preset.cookieTableLabels.duration_column_label,
      description_column_label: preset.cookieTableLabels.description_column_label,
      no_cookies_to_display_label: preset.cookieTableLabels.no_cookies_to_display_label,
    } : {}),

    // Runtime configs
    enable_gpc: preset.runtimeConfig.enable_gpc,
    google_consent_mode: preset.runtimeConfig.google_consent_mode,
    geo_targeting: preset.runtimeConfig.geo_targeting,
  }
}
