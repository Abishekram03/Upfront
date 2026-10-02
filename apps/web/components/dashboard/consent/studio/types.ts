import { ConsentConfig, ConsentVersion } from "@/lib/api"

export interface StudioConfig extends ConsentConfig {
  box_position?: "bottom_left" | "bottom_right" | "top_left" | "top_right" | "floating_bottom_left" | "floating_bottom_right" | "floating_top_left" | "floating_top_right"
  preference_layout?: "center" | "sidebar" | "push_down"
  categories_on_first_layer?: boolean
  show_close_button?: boolean
  show_cookie_policy_link?: boolean
  show_google_privacy_policy?: boolean
  google_policy_message?: string
  google_policy_link_text?: string
  google_policy_url?: string
  show_more_label?: string
  show_less_label?: string
  show_cookie_list_on_banner?: boolean
  blocked_content_alt_text?: string
  custom_css?: string
  show_branding?: boolean
  hide_branding?: boolean

  // Preference Centre Customizations
  preference_title?: string
  preference_description?: string
  save_preferences_label?: string
  pref_accept_all_label?: string
  pref_reject_all_label?: string

  // 5 Category Custom Titles & Descriptions
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

  // Cookie List Table Labels
  cookie_column_label?: string
  duration_column_label?: string
  description_column_label?: string
  always_active_label?: string
  no_cookies_to_display_label?: string

  // Cookie List Category Toggles
  show_necessary_cookies?: boolean
  show_functional_cookies?: boolean
  show_analytics_cookies?: boolean
  show_performance_cookies?: boolean
  show_advertisement_cookies?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
