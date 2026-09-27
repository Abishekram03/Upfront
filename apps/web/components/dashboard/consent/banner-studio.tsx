"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Settings,
  LayoutGrid,
  FileText,
  Palette,
  Code2,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  Cookie,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  HelpCircle,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDomain } from "@/lib/domain-context"
import {
  fetchConsentConfig,
  fetchConsentDraft,
  saveConsentDraft,
  discardConsentDraft,
  publishConsentConfig,
  ConsentConfig,
} from "@/lib/api"
import { StudioHeader } from "./studio/studio-header"
import { PublishModal } from "./studio/publish-modal"
import { VersionHistoryDrawer } from "./studio/version-history-drawer"
import { validateAndSanitizeCSS } from "./studio/css-sanitizer"
import { StudioConfig, ValidationResult } from "./studio/types"
import {
  LAW_PRESETS,
  getPresetById,
  applyPresetToConfig,
  LawPreset,
} from "./studio/presets"
import {
  SUPPORTED_LANGUAGES,
  CMPTranslationDictionary,
  resolveCMPText,
} from "@/lib/i18n/translations"
import { UpgradeGate, UpgradeBadge } from "@/components/ui/upgrade-gate"
import { useEntitlements } from "@/lib/entitlements-context"

export { LAW_PRESETS }

export const DEFAULT_BANNER_CONFIG: Omit<StudioConfig, "domain"> = {
  is_enabled: true,
  enable_auto_language: true,
  default_language: "en",
  supported_languages: ["en", "de", "fr", "es", "pt", "it", "nl", "hi"],
  layout: "bottom_bar" as any,
  box_position: "bottom_left",
  preference_layout: "center",
  categories_on_first_layer: false,
  theme: "light",
  primary_color: "#1868db",
  border_radius: "rounded-md",
  title: "We value your privacy",
  description: "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
  privacy_policy_url: "/privacy",
  show_close_button: false,
  accept_all_label: "Accept All",
  reject_all_label: "Reject All",
  preferences_label: "Customise",
  show_cookie_policy_link: true,
  show_google_privacy_policy: true,
  google_policy_message: "For more information on how Google's third-party cookies operate and handle your data, see:",
  google_policy_link_text: "Google Privacy Policy",
  google_policy_url: "https://business.safety.google/privacy",
  show_more_label: "Show more",
  show_less_label: "Show less",
  show_cookie_list_on_banner: true,
  blocked_content_alt_text: "Please accept cookies to access this content",
  
  // Preference Centre
  preference_title: "Customise Consent Preferences",
  preference_description: "We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below.",
  save_preferences_label: "Save My Preferences",
  pref_accept_all_label: "Accept All",
  pref_reject_all_label: "Reject All",

  // 5 Categories
  necessary_title: "Necessary",
  necessary_description: "Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences. These cookies do not store any personally identifiable data.",
  
  functional_title: "Functional",
  functional_description: "Functional cookies help perform certain functionalities like sharing the content of the website on social media platforms, collecting feedback, and other third-party features.",
  
  analytics_title: "Analytics",
  analytics_description: "Analytical cookies are used to understand how visitors interact with the website. These cookies help provide information on metrics such as the number of visitors, bounce rate, traffic source, etc.",
  
  performance_title: "Performance",
  performance_description: "Performance cookies are used to understand and analyze the key performance indexes of the website which helps in delivering a better user experience for the visitors.",
  
  advertisement_title: "Advertisement",
  advertisement_description: "Advertisement cookies are used to provide visitors with customized advertisements based on the pages you visited previously and to analyze the effectiveness of the ad campaigns.",

  enable_necessary_category: true,
  enable_functional_category: true,
  enable_analytics_category: true,
  enable_performance_category: true,
  enable_advertisement_category: true,

  show_necessary_cookies: true,
  show_functional_cookies: true,
  show_analytics_cookies: true,
  show_performance_cookies: true,
  show_advertisement_cookies: true,

  show_revisit_button: true,
  revisit_button_position: "bottom_left",
  enable_consent_mode_v2: false,
  enable_iab_tcf: false,
  geo_targeting: "all",
  enable_gpc: false,
  consent_version: "1.0",
  custom_css: "",
}

const COLOR_PRESETS = [
  { name: "Upfront Blue", hex: "#1868db" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Emerald", hex: "#059669" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Dark Slate", hex: "#0f172a" },
]

export function BannerStudio() {
  const { activeDomain, isLoadingSites } = useDomain()
  const { hasCapability, openUpgradeModal } = useEntitlements()

  // Studio vertical tab rail: general | layout | content | colours | custom_css
  const [activeRailTab, setActiveRailTab] = useState<"general" | "layout" | "content" | "colours" | "custom_css">("layout")

  // Content accordions
  const [activeContentAccordion, setActiveContentAccordion] = useState<
    // Content accordions
    "notice" | "preferences" | "cookie_list" | "revisit" | "blocked_content" | null
  >("notice")

  // Selected category sub-tab inside Preference Centre and Cookie List editors
  const [activePrefCategoryTab, setActivePrefCategoryTab] = useState<
    "necessary" | "functional" | "analytics" | "performance" | "advertisement"
  >("necessary")
  const [activeCookieListCategoryTab, setActiveCookieListCategoryTab] = useState<
    "necessary" | "functional" | "analytics" | "performance" | "advertisement"
  >("necessary")

  // Configuration state
  const [config, setConfig] = useState<ConsentConfig & {
    box_position?: "bottom_left" | "bottom_right" | "top_left" | "top_right"
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
  }>({
    ...DEFAULT_BANNER_CONFIG,
    domain: activeDomain || "",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isDraft, setIsDraft] = useState(false)
  const [publishedVersion, setPublishedVersion] = useState("1.0")
  const [baseVersion, setBaseVersion] = useState("1.0")
  const [publishedConfig, setPublishedConfig] = useState<any>(null)

  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [isResetBannerModalOpen, setIsResetBannerModalOpen] = useState(false)
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  // Live Canvas Viewport Controls
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [previewView, setPreviewView] = useState<"notice" | "preferences">("notice")
  const [previewLanguage, setPreviewLanguage] = useState<string>("en")

  // Translation resolver for canvas preview
  const getText = (key: keyof CMPTranslationDictionary): string => {
    return resolveCMPText(key, config, previewLanguage)
  }

  // Interactive accordions inside preference centre preview
  const [mockExpanded, setMockExpanded] = useState<Record<string, boolean>>({
    necessary: true,
    functional: false,
    analytics: false,
    performance: false,
    advertisement: false,
  })
  const [isPrefDescExpanded, setIsPrefDescExpanded] = useState(false)
  const [mockSwitches, setMockSwitches] = useState({
    functional: true,
    analytics: true,
    performance: true,
    advertisement: true,
  })

  // Automatically sanitize and clamp configuration flags based on the active plan tier
  const sanitizeConfigForTier = (rawConfig: typeof config): typeof config => {
    const sanitized = { ...rawConfig }
    if (!hasCapability("cmp.tcf_v23")) {
      sanitized.enable_iab_tcf = false
    }
    if (!hasCapability("cmp.custom_css")) {
      sanitized.custom_css = ""
    }
    if (!hasCapability("cmp.gpc")) {
      sanitized.enable_gpc = false
    }
    if (!hasCapability("cmp.google_consent_mode_v2")) {
      sanitized.enable_consent_mode_v2 = false
    }
    if (!hasCapability("cmp.geo_targeting")) {
      sanitized.geo_targeting = "all"
    }
    if (!hasCapability("cmp.box_layout") && (sanitized.layout?.includes("floating") || sanitized.layout === "box")) {
      sanitized.layout = "bottom_bar"
    }
    if (!hasCapability("cmp.popup_layout") && (sanitized.layout === "center_modal" || sanitized.layout === "popup")) {
      sanitized.layout = "bottom_bar"
    }
    return sanitized
  }

  // Load draft or published config
  const loadStudioData = async () => {
    if (!activeDomain) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [draftData, pubData] = await Promise.all([
        fetchConsentDraft(activeDomain),
        fetchConsentConfig(activeDomain),
      ])

      setPublishedConfig(pubData)
      setPublishedVersion(draftData.published_version || pubData.consent_version || "1.0")
      setBaseVersion(draftData.base_version || pubData.consent_version || "1.0")
      setIsDraft(draftData.is_draft)

      const activeConfig = draftData.config || pubData
      if (activeConfig) {
        setConfig((prev) => {
          const merged = {
            ...prev,
            ...activeConfig,
            primary_color: activeConfig.primary_color || "#1868db",
            enable_gpc: activeConfig.enable_gpc !== undefined ? activeConfig.enable_gpc : false,
            consent_version: activeConfig.consent_version || "1.0",
          }
          return sanitizeConfigForTier(merged)
        })
      }
    } catch (err: any) {
      console.warn("Could not fetch studio draft/config:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStudioData()
  }, [activeDomain])

  // Automatically enforce plan capabilities whenever entitlements resolve
  useEffect(() => {
    setConfig((prev) => sanitizeConfigForTier(prev))
  }, [hasCapability])

  // Track edits to flag draft changes
  const updateConfig = (updater: (prev: typeof config) => typeof config) => {
    setConfig((prev) => {
      const next = updater(prev)
      setIsDraft(true)
      return next
    })
  }

  // Save Working Draft
  const handleSaveDraft = async () => {
    if (!activeDomain) return
    setIsSavingDraft(true)
    try {
      const payload = sanitizeConfigForTier(config)
      await saveConsentDraft(activeDomain, payload, baseVersion)
      setConfig(payload)
      setIsDraft(true)
      setToast({ type: "success", message: "Draft saved. Changes will not affect live website until published." })
      setTimeout(() => setToast(null), 4000)
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "Failed to save draft." })
      setTimeout(() => setToast(null), 5000)
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Discard Working Draft
  const handleDiscardDraft = async () => {
    if (!activeDomain) return
    const confirmed = window.confirm("Discard all unpublished draft changes and revert to the live published configuration?")
    if (!confirmed) return

    try {
      await discardConsentDraft(activeDomain)
      await loadStudioData()
      setToast({ type: "success", message: "Draft discarded. Reverted to live published configuration." })
      setTimeout(() => setToast(null), 4000)
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "Failed to discard draft." })
      setTimeout(() => setToast(null), 5000)
    }
  }

  // Reset entire banner to default banner configuration
  const handleResetToDefaultBanner = () => {
    updateConfig(() => ({
      ...DEFAULT_BANNER_CONFIG,
      domain: activeDomain || "",
    }))
    setIsResetBannerModalOpen(false)
    setToast({
      type: "success",
      message: "Banner reset to default configuration.",
    })
    setTimeout(() => setToast(null), 4000)
  }

  // Compute validation
  const getValidation = (): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!config.title || config.title.trim().length === 0) errors.push("Banner title is required.")
    if (!config.description || config.description.trim().length === 0) errors.push("Banner description is required.")
    if (!config.accept_all_label || config.accept_all_label.trim().length === 0) errors.push("Accept All label cannot be empty.")
    if (!config.reject_all_label || config.reject_all_label.trim().length === 0) errors.push("Reject All label cannot be empty.")
    if (!config.preferences_label || config.preferences_label.trim().length === 0) errors.push("Preferences label cannot be empty.")

    if (config.privacy_policy_url) {
      const url = config.privacy_policy_url.trim()
      if (!url.startsWith("/") && !url.startsWith("http://") && !url.startsWith("https://")) {
        errors.push("Privacy Policy URL must start with / or https://")
      }
    }

    const cssCheck = validateAndSanitizeCSS(config.custom_css)
    if (!cssCheck.isSafe) {
      errors.push(cssCheck.error || "Unsafe Custom CSS detected.")
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  // Compute diffs
  const getDiffs = (): string[] => {
    if (!publishedConfig) return ["Initial configuration changes"]
    const diffs: string[] = []
    if (publishedConfig.title !== config.title) diffs.push("Updated banner title")
    if (publishedConfig.description !== config.description) diffs.push("Updated banner description")
    if (publishedConfig.primary_color !== config.primary_color) diffs.push(`Changed primary color to ${config.primary_color}`)
    if (publishedConfig.layout !== config.layout) diffs.push(`Changed layout to ${config.layout}`)
    if (publishedConfig.theme !== config.theme) diffs.push(`Changed theme to ${config.theme}`)
    if (publishedConfig.accept_all_label !== config.accept_all_label) diffs.push("Updated Accept button label")
    if (publishedConfig.reject_all_label !== config.reject_all_label) diffs.push("Updated Reject button label")
    if (publishedConfig.preferences_label !== config.preferences_label) diffs.push("Updated Preferences button label")
    if (publishedConfig.enable_gpc !== config.enable_gpc) diffs.push(`GPC set to ${config.enable_gpc ? "Enabled" : "Disabled"}`)
    if (publishedConfig.enable_consent_mode_v2 !== config.enable_consent_mode_v2) diffs.push(`Consent Mode v2 set to ${config.enable_consent_mode_v2 ? "Enabled" : "Disabled"}`)
    if (publishedConfig.enable_iab_tcf !== config.enable_iab_tcf) diffs.push(`IAB TCF v2.3 set to ${config.enable_iab_tcf ? "Enabled" : "Disabled"}`)
    if (publishedConfig.geo_targeting !== config.geo_targeting) diffs.push(`Geo-targeting set to ${config.geo_targeting}`)
    if (publishedConfig.custom_css !== config.custom_css) diffs.push("Updated Shadow-DOM Custom CSS")
    if (diffs.length === 0) diffs.push("Configuration adjustments")
    return diffs
  }

  const getTargetVersion = () => {
    const clean = (publishedVersion || "1.0").replace(/^v/i, "").trim()
    const parts = clean.split(".")
    if (parts.length === 2) {
      const major = parseInt(parts[0] || "1", 10) || 1
      const minor = parseInt(parts[1] || "0", 10) || 0
      return `${major}.${minor + 1}`
    }
    return `${clean}.1`
  }

  // Publish Configuration
  const handlePublish = async () => {
    if (!activeDomain) return
    setIsPublishing(true)
    try {
      const payload = sanitizeConfigForTier(config)
      const res = await publishConsentConfig(activeDomain, payload, baseVersion)
      setConfig(payload)
      setPublishedVersion(res.published_version)
      setBaseVersion(res.published_version)
      setPublishedConfig(res.config)
      setIsDraft(false)
      setIsPublishModalOpen(false)
      setToast({ type: "success", message: `v${res.published_version} published successfully to production!` })
      setTimeout(() => setToast(null), 5000)
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "Failed to publish configuration." })
      setTimeout(() => setToast(null), 6000)
    } finally {
      setIsPublishing(false)
    }
  }

  const toggleMockAccordion = (key: string) => {
    setMockExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const copyEmbedSnippet = () => {
    navigator.clipboard.writeText('<div id="usrly-cookie-declaration"></div>')
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden select-none">
      {/* 1. Studio Enterprise Header */}
      <StudioHeader
        activeDomain={activeDomain || ""}
        publishedVersion={publishedVersion}
        isDraft={isDraft}
        isSavingDraft={isSavingDraft}
        isPublishing={isPublishing}
        onSaveDraft={handleSaveDraft}
        onDiscardDraft={handleDiscardDraft}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
        onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
      />

      {/* Global Studio Toast Alert */}
      {toast && (
        <div
          role="alert"
          className={cn(
            "mx-5 mt-3 p-3 rounded-lg border text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2",
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          )}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Frame: Left Rail + Settings Panel + Right Live Canvas */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden w-full h-full">
        
        {/* FAR-LEFT 58px VERTICAL ICON RAIL */}
        <div className="w-[58px] shrink-0 border-r border-slate-200 bg-slate-50/90 flex flex-col justify-between py-3 items-center select-none">
          <div className="w-full flex flex-col items-center space-y-1">
            {[
              { id: "general", label: "General", icon: Settings },
              { id: "layout", label: "Layout", icon: LayoutGrid },
              { id: "content", label: "Content", icon: FileText },
              { id: "colours", label: "Colours", icon: Palette },
              { id: "custom_css", label: "Custom CSS", icon: Code2, capability: "cmp.custom_css" as const },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeRailTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRailTab(tab.id as any)}
                  title={tab.label}
                  className={cn(
                    "w-full flex flex-col items-center justify-center py-3 text-[10px] font-bold gap-1 transition-all cursor-pointer relative",
                    isActive
                      ? "text-[#1868db] bg-white border-l-3 border-[#1868db] shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <Icon className={cn("size-4", isActive ? "text-[#1868db]" : "text-slate-500")} />
                  <span className="scale-90">{tab.label}</span>
                  {tab.capability && (
                    <UpgradeBadge capability={tab.capability} size="sm" showText={false} className="absolute top-1 right-1" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Revisit Badge Icon Trigger at Rail Bottom */}
          <div className="pt-4 border-t border-slate-200 w-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewView(previewView === "notice" ? "preferences" : "notice")}
              title="Toggle Live Preference Modal"
              className="size-8 rounded-full bg-[#1868db] text-white flex items-center justify-center shadow-xs hover:scale-105 transition-transform cursor-pointer"
            >
              <Cookie className="size-4" />
            </button>
            <span className="text-[9px] font-bold text-slate-500 mt-1">Widget</span>
          </div>
        </div>

        {/* 400px SETTINGS & CONTROLS PANEL */}
        <div className="w-[380px] lg:w-[410px] shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between overflow-hidden h-full min-h-0">
          <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            
            {/* ======================================================== */}
            {/* TAB 1: GENERAL SETTINGS                                  */}
            {/* ======================================================== */}
            {activeRailTab === "general" && (
              <div className="space-y-4">
                {/* 1-Click Law & Regulatory Template Dropdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Regulatory Law Template</span>
                      <div className="relative group cursor-pointer inline-flex items-center">
                        <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                        <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block w-72 p-2.5 bg-slate-900 text-white text-[10px] rounded shadow-2xl z-50 pointer-events-none leading-relaxed border border-slate-700">
                          Selecting a law template instantly applies legally compliant button configurations, copy presets, and default tracking behaviors for your jurisdiction.
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Dropdown with Titles */}
                  <div className="relative">
                    <select
                      value={(config as any).law_template || "gdpr"}
                      onChange={(e) => {
                        const selectedId = e.target.value
                        const found = LAW_PRESETS.find((p) => p.id === selectedId)
                        if (found) {
                          setConfig((prev) => applyPresetToConfig(prev, found))
                          setMockSwitches({
                            functional: found.defaultCategories.functional,
                            analytics: found.defaultCategories.analytics,
                            performance: found.defaultCategories.performance,
                            advertisement: found.defaultCategories.advertisement,
                          })
                        }
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-[4px] border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-hidden focus:border-[#1868db] focus:ring-1 focus:ring-[#1868db] cursor-pointer appearance-none pr-8"
                    >
                      {LAW_PRESETS.map((lp) => (
                        <option key={lp.id} value={lp.id}>
                          {lp.name} — {lp.jurisdiction}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="size-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Chosen Template Description & Detail Card */}
                  {(() => {
                    const currentTemplateId = (config as any).law_template || "gdpr"
                    const currentPreset = LAW_PRESETS.find((p) => p.id === currentTemplateId) || LAW_PRESETS[0]
                    if (!currentPreset) return null
                    return (
                      <div className="p-3.5 rounded-[4px] border border-[#1868db]/30 bg-blue-50/40 space-y-2.5 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{currentPreset.name}</span>
                            <div className="relative group cursor-pointer inline-flex items-center">
                              <HelpCircle className="size-3 text-slate-400 hover:text-slate-700" />
                              <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[10px] rounded shadow-2xl z-50 pointer-events-none leading-relaxed border border-slate-700">
                                <strong>Jurisdiction:</strong> {currentPreset.jurisdiction}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1868db] border border-blue-200">
                            {currentPreset.badge}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {currentPreset.info}
                        </p>

                        <div className="pt-2 border-t border-blue-100 space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Jurisdiction:</span>
                            <strong className="text-slate-700">{currentPreset.jurisdiction}</strong>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Primary Action:</span>
                            <strong className="text-slate-700">{currentPreset.bannerData.accept_all_label}</strong>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Opt-Out / Reject:</span>
                            <strong className="text-slate-700">{currentPreset.bannerData.reject_all_label}</strong>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setConfig((prev) => applyPresetToConfig(prev, currentPreset))
                            setMockSwitches({
                              functional: currentPreset.defaultCategories.functional,
                              analytics: currentPreset.defaultCategories.analytics,
                              performance: currentPreset.defaultCategories.performance,
                              advertisement: currentPreset.defaultCategories.advertisement,
                            })
                          }}
                          className="w-full text-[10px] font-bold h-7 rounded-[4px] border-blue-200 bg-white text-[#1868db] hover:bg-blue-50"
                        >
                          Reset / Reapply {currentPreset.name} Copy
                        </Button>
                      </div>
                    )
                  })()}
                </div>

                {/* Geo-targeting: Worldwide is Free, Regional is Growth */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-800 block">Geo-target banner</label>
                      <div className="relative group cursor-pointer inline-flex items-center">
                        <HelpCircle className="size-3 text-slate-400 hover:text-slate-700" />
                        <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[10px] rounded shadow-2xl z-50 pointer-events-none leading-relaxed border border-slate-700">
                          Control where the banner is displayed. Restricting to EU/UK avoids showing consent banners in regions where prior consent is not legally required.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { id: "all", label: "Worldwide", desc: "Display banner to all visitors", isFree: true },
                      { id: "eu_only", label: "EU Countries & UK Only", desc: "Saves pageview quota on non-regulated traffic", isFree: false },
                      { id: "custom", label: "Select Countries", desc: "Granular ISO country selection", isFree: false },
                    ].map((opt) => {
                      const isSelected = (config.geo_targeting || "all") === opt.id
                      const canGeoTarget = hasCapability("cmp.geo_targeting")
                      const isLocked = !opt.isFree && !canGeoTarget
                      return (
                        <label
                          key={opt.id}
                          onClick={(e) => {
                            if (isLocked) {
                              e.preventDefault()
                              openUpgradeModal("growth", "Geo-targeting")
                            }
                          }}
                          className={cn(
                            "flex items-start justify-between p-2.5 rounded-[4px] border transition-all cursor-pointer",
                            isSelected
                              ? "border-[#1868db] bg-blue-50/50"
                              : "border-slate-200 hover:bg-slate-50",
                            isLocked && "opacity-80"
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="radio"
                              name="geo_targeting"
                              checked={isSelected}
                              disabled={isLocked}
                              onChange={() => {
                                if (!isLocked) {
                                  setConfig({ ...config, geo_targeting: opt.id as any })
                                }
                              }}
                              className="mt-0.5 text-[#1868db] focus:ring-[#1868db]"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{opt.label}</span>
                                {opt.isFree && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Free
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">{opt.desc}</div>
                            </div>
                          </div>
                          {isLocked && <UpgradeBadge capability="cmp.geo_targeting" size="sm" showText={false} />}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Framework & Mode Toggles */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <UpgradeGate capability="cmp.tcf_v23" featureName="IAB TCF v2.3">
                    <div className="flex items-center justify-between">
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">Support IAB TCF v2.3</span>
                          <UpgradeBadge capability="cmp.tcf_v23" size="sm" />
                        </div>
                        <div className="text-[11px] text-slate-500">Interactive Advertising Bureau framework signaling</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_iab_tcf !== false}
                        onChange={(e) => setConfig({ ...config, enable_iab_tcf: e.target.checked })}
                        className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                      />
                    </div>
                  </UpgradeGate>

                  <UpgradeGate capability="cmp.google_consent_mode_v2" featureName="Google Consent Mode v2">
                    <div className="flex items-center justify-between">
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">Google Consent Mode v2</span>
                          <UpgradeBadge capability="cmp.google_consent_mode_v2" size="sm" />
                        </div>
                        <div className="text-[11px] text-slate-500">Sends analytics & ad storage consent signals</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_consent_mode_v2 !== false}
                        onChange={(e) => setConfig({ ...config, enable_consent_mode_v2: e.target.checked })}
                        className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                      />
                    </div>
                  </UpgradeGate>

                  <UpgradeGate capability="cmp.gpc" featureName="Global Privacy Control (GPC)">
                    <div className="flex items-center justify-between">
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">Global Privacy Control (GPC)</span>
                          <UpgradeBadge capability="cmp.gpc" size="sm" />
                        </div>
                        <div className="text-[11px] text-slate-500">Auto-reject ad trackers on GPC header</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_gpc !== false}
                        onChange={(e) => setConfig({ ...config, enable_gpc: e.target.checked })}
                        className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                      />
                    </div>
                  </UpgradeGate>
                </div>

                {/* Multi-Language & Localization Layer */}
                <UpgradeGate capability="cmp.multilingual" featureName="Multi-language Translations">
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-slate-800 block">Languages & Localization</label>
                        <div className="relative group cursor-pointer inline-flex items-center">
                          <HelpCircle className="size-3 text-slate-400 hover:text-slate-700" />
                          <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                            UpFront automatically serves localized CMP translations matching the visitor&apos;s browser language while preserving any custom customer copy overrides.
                          </div>
                        </div>
                      </div>
                      <UpgradeBadge capability="cmp.multilingual" size="sm" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Auto-Detect Browser Language</div>
                        <div className="text-[11px] text-slate-500">Automatically serve translations matching visitor OS/Browser</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_auto_language !== false}
                        onChange={(e) => setConfig({ ...config, enable_auto_language: e.target.checked })}
                        className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 block">Default Language Fallback</label>
                      <select
                        value={config.default_language || "en"}
                        onChange={(e) => setConfig({ ...config, default_language: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-[4px] border border-slate-300 bg-white text-slate-900 shadow-2xs focus:border-[#1868db]"
                      >
                        {SUPPORTED_LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.name} ({l.nativeName}) [{l.code}]
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </UpgradeGate>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: LAYOUT & POSITIONING                              */}
            {/* ======================================================== */}
            {activeRailTab === "layout" && (
              <div className="space-y-4">
                {/* Consent Template Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Consent Template</span>
                      <div className="relative group cursor-pointer inline-flex items-center">
                        <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                          Active regulatory framework preset for this site.
                        </div>
                      </div>
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={(config as any).law_template || "gdpr"}
                      onChange={(e) => {
                        const selectedId = e.target.value
                        const found = LAW_PRESETS.find((p) => p.id === selectedId)
                        if (found) {
                          setConfig((prev) => applyPresetToConfig(prev, found))
                          setMockSwitches({
                            functional: found.defaultCategories.functional,
                            analytics: found.defaultCategories.analytics,
                            performance: found.defaultCategories.performance,
                            advertisement: found.defaultCategories.advertisement,
                          })
                        }
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-[4px] border border-slate-300 bg-white text-slate-900 shadow-2xs focus:outline-hidden focus:border-[#1868db] focus:ring-1 focus:ring-[#1868db] cursor-pointer appearance-none pr-8"
                    >
                      {LAW_PRESETS.map((lp) => (
                        <option key={lp.id} value={lp.id}>
                          {lp.name} ({lp.jurisdiction})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="size-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Cookie Notice Form Factors */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-2">Cookie notice</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "box", label: "Box", visual: "w-6 h-6 border border-slate-300 rounded-[2px] bg-blue-50 ml-1 mt-1", capability: "cmp.box_layout" as const },
                      { id: "banner", label: "Banner", visual: "w-8 h-3 border border-slate-300 rounded-[2px] bg-[#1868db] mx-auto mt-2", capability: "cmp.banner" as const },
                      { id: "popup", label: "Popup", visual: "size-4 border border-slate-300 rounded-[2px] bg-slate-400 m-auto mt-2", capability: "cmp.popup_layout" as const },
                    ].map((form) => {
                      const isSelected =
                        form.id === "box"
                          ? config.layout?.includes("floating") || config.layout === "box"
                          : form.id === "banner"
                          ? config.layout === "bottom_bar" || config.layout === "top_bar"
                          : config.layout === "center_modal" || config.layout === "popup"
                      const isLocked = !hasCapability(form.capability)

                      return (
                        <button
                          key={form.id}
                          type="button"
                          onClick={() => {
                            if (isLocked) {
                              openUpgradeModal("growth", form.id === "box" ? "Floating Box Layout" : "Popup Modal Layout")
                              return
                            }
                            if (form.id === "box") setConfig({ ...config, layout: "floating_bottom_left" as any })
                            else if (form.id === "banner") setConfig({ ...config, layout: "bottom_bar" })
                            else setConfig({ ...config, layout: "center_modal" as any })
                          }}
                          className={cn(
                            "p-2.5 rounded-[4px] border text-center transition-all cursor-pointer flex flex-col items-center justify-between h-18 relative",
                            isSelected
                              ? "border-[#1868db] bg-blue-50/60 text-[#1868db] ring-1 ring-[#1868db]/30 font-bold"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                            isLocked && "hover:border-amber-400"
                          )}
                        >
                          {isLocked && (
                            <div className="absolute top-1 right-1">
                              <UpgradeBadge capability={form.capability} />
                            </div>
                          )}
                          <div className={form.visual} />
                          <span className="text-xs font-semibold">{form.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* 4-Corner Positioning for Box */}
                  {(config.layout?.includes("floating") || config.layout === "box") && (
                    <UpgradeGate capability="cmp.box_layout" featureName="Floating Box Layout">
                      <div className="mt-3 p-3 bg-slate-50/80 rounded-[4px] border border-slate-200 space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 block">Position on screen</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { id: "floating_bottom_left", label: "Bottom left" },
                            { id: "floating_bottom_right", label: "Bottom right" },
                            { id: "floating_top_left", label: "Top left" },
                            { id: "floating_top_right", label: "Top right" },
                          ].map((pos) => (
                            <label key={pos.id} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                              <input
                                type="radio"
                                name="box_position"
                                checked={config.layout === pos.id || (pos.id === "floating_bottom_left" && config.layout === "box")}
                                onChange={() => setConfig({ ...config, layout: pos.id as any })}
                                className="text-[#1868db] focus:ring-[#1868db]"
                              />
                              <span className="text-[11px] font-medium">{pos.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </UpgradeGate>
                  )}
                </div>

                {/* Preference Centre Layout (Locked to Center Modal) */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Preference Centre Layout</span>
                      <div className="relative group cursor-pointer inline-flex items-center">
                        <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-64 p-2.5 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                          Preference Centre is configured as a focused, accessible Center Modal dialog with itemized category accordions.
                        </div>
                      </div>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1868db] border border-blue-200">
                      Center Modal
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({ ...prev, preference_layout: "center" }))
                      setPreviewView("preferences")
                    }}
                    className="w-full p-2.5 rounded-[4px] border border-[#1868db]/30 bg-blue-50/40 hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-between text-left"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">Center Modal Dialog</div>
                      <div className="text-[11px] text-slate-500">Focused modal with 5-category privacy controls</div>
                    </div>
                    <Eye className="size-4 text-[#1868db] shrink-0" />
                  </button>
                </div>

                {/* Categories on first layer toggle */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Categories on first layer</div>
                    <div className="text-[11px] text-slate-500">Display category toggles directly on banner</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.categories_on_first_layer || false}
                    onChange={(e) => setConfig({ ...config, categories_on_first_layer: e.target.checked })}
                    className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                  />
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: 5-ACCORDION CONTENT MANAGEMENT                    */}
            {/* ======================================================== */}
            {activeRailTab === "content" && (
              <div className="space-y-2">
                {/* 1. Cookie Notice Accordion */}
                <div className="border border-slate-200 rounded-[4px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveContentAccordion(activeContentAccordion === "notice" ? null : "notice")
                      setPreviewView("notice")
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    <span>Cookie Notice</span>
                    {activeContentAccordion === "notice" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>

                  {activeContentAccordion === "notice" && (
                    <div className="p-3 space-y-3 bg-white text-xs">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Title</label>
                        <input
                          type="text"
                          value={config.title}
                          onChange={(e) => setConfig({ ...config, title: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Message</label>
                        <textarea
                          rows={3}
                          value={config.description}
                          onChange={(e) => setConfig({ ...config, description: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                        />
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-700">Close [X] button</span>
                            <div className="relative group cursor-pointer inline-flex items-center">
                              <HelpCircle className="size-3 text-slate-400 hover:text-slate-700" />
                              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-64 p-2.5 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                                <strong>Italian DPA / EDPB Requirement:</strong> Under Italian Garante Privacy and EDPB guidelines, clicking [X] must dismiss the notice and continue navigation while maintaining default settings (rejecting all non-essential trackers and keeping only technical cookies active).
                              </div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={config.show_close_button || false}
                            onChange={(e) => setConfig({ ...config, show_close_button: e.target.checked })}
                            className="size-3.5 rounded text-[#1868db] focus:ring-[#1868db]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">&quot;Accept All&quot; button</label>
                          <input
                            type="text"
                            value={config.accept_all_label}
                            onChange={(e) => setConfig({ ...config, accept_all_label: e.target.value })}
                            className="w-full px-2.5 py-1 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">&quot;Reject All&quot; button</label>
                          <input
                            type="text"
                            value={config.reject_all_label}
                            onChange={(e) => setConfig({ ...config, reject_all_label: e.target.value })}
                            className="w-full px-2.5 py-1 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">&quot;Customise&quot; button</label>
                          <input
                            type="text"
                            value={config.preferences_label}
                            onChange={(e) => setConfig({ ...config, preferences_label: e.target.value })}
                            className="w-full px-2.5 py-1 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Preference Centre Accordion */}
                <div className="border border-slate-200 rounded-[4px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveContentAccordion(activeContentAccordion === "preferences" ? null : "preferences")
                      setPreviewView("preferences")
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    <span>Preference Centre</span>
                    {activeContentAccordion === "preferences" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>

                  {activeContentAccordion === "preferences" && (
                    <div className="p-3 space-y-3 bg-white text-xs">
                      {/* 1. Title */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Title</label>
                        <input
                          type="text"
                          value={config.preference_title || ""}
                          onChange={(e) => setConfig({ ...config, preference_title: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                          placeholder="Customise Consent Preferences"
                        />
                      </div>

                      {/* 2. Preview Message */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Preview message</label>
                        <textarea
                          rows={3}
                          value={config.preference_description || ""}
                          onChange={(e) => setConfig({ ...config, preference_description: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                          placeholder="We use cookies to help you navigate efficiently and perform certain functions..."
                        />
                      </div>

                      {/* 3. Show Google Privacy Policy (Toggle ON/OFF) */}
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 block">Show Google Privacy Policy</span>
                            <span className="text-[10px] text-slate-500">Include Google safety disclosures</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={config.show_google_privacy_policy !== false}
                            onChange={(e) => setConfig({ ...config, show_google_privacy_policy: e.target.checked })}
                            className="size-4 rounded text-[#1868db] focus:ring-[#1868db] cursor-pointer"
                          />
                        </div>

                        {/* If Toggled ON: Message Preview, Link Text, Link URL */}
                        {config.show_google_privacy_policy !== false && (
                          <div className="p-2.5 bg-slate-50 rounded-[4px] border border-slate-200 space-y-2 animate-in fade-in">
                            <div>
                              <label className="text-[10px] font-bold text-slate-700 block mb-1">Message preview</label>
                              <textarea
                                rows={2}
                                value={config.google_policy_message || ""}
                                onChange={(e) => setConfig({ ...config, google_policy_message: e.target.value })}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white leading-relaxed"
                                placeholder="For more information on how Google's third-party cookies operate and handle your data, see:"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-700 block mb-1">Link text</label>
                              <input
                                type="text"
                                value={config.google_policy_link_text || ""}
                                onChange={(e) => setConfig({ ...config, google_policy_link_text: e.target.value })}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                                placeholder="Google Privacy Policy"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-700 block mb-1">Link URL</label>
                              <input
                                type="text"
                                value={config.google_policy_url || ""}
                                onChange={(e) => setConfig({ ...config, google_policy_url: e.target.value })}
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                                placeholder="https://business.safety.google/privacy"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. Save My Preferences Label */}
                      <div className="pt-2 border-t border-slate-100">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">&quot;Save My Preferences&quot; label</label>
                        <input
                          type="text"
                          value={config.save_preferences_label || "Save My Preferences"}
                          onChange={(e) => setConfig({ ...config, save_preferences_label: e.target.value })}
                          className="w-full px-2.5 py-1 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                        />
                      </div>

                      {/* 5. Show More Button & 6. Show Less Button */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">&quot;Show more&quot; button</label>
                          <input
                            type="text"
                            value={config.show_more_label || "Show more"}
                            onChange={(e) => setConfig({ ...config, show_more_label: e.target.value })}
                            className="w-full px-2.5 py-1 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                            placeholder="Show more"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">&quot;Show less&quot; button</label>
                          <input
                            type="text"
                            value={config.show_less_label || "Show less"}
                            onChange={(e) => setConfig({ ...config, show_less_label: e.target.value })}
                            className="w-full px-2.5 py-1 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                            placeholder="Show less"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Cookie List Accordion */}
                <div className="border border-slate-200 rounded-[4px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveContentAccordion(activeContentAccordion === "cookie_list" ? null : "cookie_list")}
                    className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    <span>Cookie List</span>
                    {activeContentAccordion === "cookie_list" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>

                  {activeContentAccordion === "cookie_list" && (
                    <div className="p-3 space-y-3.5 bg-white text-xs">
                      {/* Show cookie list on banner toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-800">Show cookie list on banner</span>
                          <span className="size-3.5 rounded-full bg-slate-100 border border-slate-300 text-slate-500 text-[9px] flex items-center justify-center cursor-help" title="Toggle whether to display cookie list table on banner">?</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.show_cookie_list_on_banner !== false}
                          onChange={(e) => setConfig({ ...config, show_cookie_list_on_banner: e.target.checked })}
                          className="size-4 rounded text-[#1868db] focus:ring-[#1868db] cursor-pointer"
                        />
                      </div>

                      {/* Embed code snippet */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-800">Embed code</span>
                          <span className="size-3.5 rounded-full bg-slate-100 border border-slate-300 text-slate-500 text-[9px] flex items-center justify-center cursor-help" title="Add cookie list to your Cookie/Privacy Policy page with this HTML code.">?</span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-normal">
                          Add cookie list to your Cookie/Privacy Policy page with this HTML code.
                        </p>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[10.5px] text-slate-700 relative">
                          <div className="leading-tight pr-14">
                            &lt;div class=<br />
                            &quot;upfront-audit-table-element&quot;&gt;<br />
                            &lt;/div&gt;
                          </div>
                          <button
                            type="button"
                            onClick={copyEmbedSnippet}
                            className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] cursor-pointer absolute top-2.5 right-2.5 transition-colors"
                          >
                            {copiedEmbed ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>

                      {/* Table Column & Label Customizations */}
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <label className="text-[11px] font-bold text-slate-700">Cookie</label>
                            <div className="relative group cursor-pointer inline-flex items-center">
                              <HelpCircle className="size-3 text-slate-400 hover:text-slate-700" />
                              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-60 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                                <strong>Technical Identifier:</strong> The actual name of the cookie or storage key stored in the visitor&apos;s browser (e.g. <code>_ga</code>, <code>cf_clearance</code>).
                              </div>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={config.cookie_column_label || "Cookie"}
                            onChange={(e) => setConfig({ ...config, cookie_column_label: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                            placeholder="Cookie"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <label className="text-[11px] font-bold text-slate-700">Duration</label>
                            <div className="relative group cursor-pointer inline-flex items-center">
                              <HelpCircle className="size-3 text-slate-400 hover:text-slate-700" />
                              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-60 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                                <strong>Expiration Lifespan:</strong> How long the cookie persists before auto-expiring (e.g. <code>Session</code>, <code>30 days</code>, <code>1 year</code>). Mandatory under GDPR Article 13.
                              </div>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={config.duration_column_label || "Duration"}
                            onChange={(e) => setConfig({ ...config, duration_column_label: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                            placeholder="Duration"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <label className="text-[11px] font-bold text-slate-700">Description</label>
                            <div className="relative group cursor-pointer inline-flex items-center">
                              <HelpCircle className="size-3 text-slate-400 hover:text-slate-700" />
                              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-60 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                                <strong>Purpose Specification:</strong> Plain-language disclosure explaining why this specific tracker is placed and what personal data it processes.
                              </div>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={config.description_column_label || "Description"}
                            onChange={(e) => setConfig({ ...config, description_column_label: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                            placeholder="Description"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <label className="text-[11px] font-bold text-slate-700">&quot;Always Active&quot; label</label>
                            <div className="relative group cursor-pointer inline-flex items-center">
                              <HelpCircle className="size-3 text-slate-400 hover:text-slate-700" />
                              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-60 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                                <strong>Non-deactivatable Badge:</strong> Displayed on Necessary cookies to inform visitors that security & session cookies cannot be toggled off.
                              </div>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={config.always_active_label || "Always Active"}
                            onChange={(e) => setConfig({ ...config, always_active_label: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                            placeholder="Always Active"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <label className="text-[11px] font-bold text-slate-700">&quot;No cookies to display&quot; label</label>
                            <div className="relative group cursor-pointer inline-flex items-center">
                              <HelpCircle className="size-3 text-slate-400 hover:text-slate-700" />
                              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-60 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                                <strong>Zero-State Fallback:</strong> Displayed inside category accordions when the scanner detects 0 active cookies under that category.
                              </div>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={config.no_cookies_to_display_label || "No cookies to display"}
                            onChange={(e) => setConfig({ ...config, no_cookies_to_display_label: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                            placeholder="No cookies to display"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Revisit Consent Button Accordion */}
                <div className="border border-slate-200 rounded-[4px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveContentAccordion(activeContentAccordion === "revisit" ? null : "revisit")}
                    className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    <span>Revisit Consent Button</span>
                    {activeContentAccordion === "revisit" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>

                  {activeContentAccordion === "revisit" && (
                    <div className="p-3 space-y-3 bg-white text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">Floating widget</span>
                        <input
                          type="checkbox"
                          checked={config.show_revisit_button}
                          onChange={(e) => setConfig({ ...config, show_revisit_button: e.target.checked })}
                          className="size-3.5 rounded text-[#1868db] focus:ring-[#1868db]"
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <span className="text-[11px] font-bold text-slate-700">Position:</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="revisit_pos"
                            checked={config.revisit_button_position === "bottom_left"}
                            onChange={() => setConfig({ ...config, revisit_button_position: "bottom_left" })}
                            className="text-[#1868db]"
                          />
                          <span className="text-[11px]">Left</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="revisit_pos"
                            checked={config.revisit_button_position === "bottom_right"}
                            onChange={() => setConfig({ ...config, revisit_button_position: "bottom_right" })}
                            className="text-[#1868db]"
                          />
                          <span className="text-[11px]">Right</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Blocked Content Accordion */}
                <div className="border border-slate-200 rounded-[4px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveContentAccordion(activeContentAccordion === "blocked_content" ? null : "blocked_content")}
                    className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    <span>Blocked Content</span>
                    {activeContentAccordion === "blocked_content" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>

                  {activeContentAccordion === "blocked_content" && (
                    <div className="p-3 space-y-2 bg-white text-xs">
                      <label className="text-[11px] font-bold text-slate-700 block">Alt text for blocked content</label>
                      <input
                        type="text"
                        value={config.blocked_content_alt_text || "Please accept cookies to access this content"}
                        onChange={(e) => setConfig({ ...config, blocked_content_alt_text: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 focus:outline-hidden focus:border-[#1868db]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: COLOURS & BRAND THEME                             */}
            {/* ======================================================== */}
            {activeRailTab === "colours" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-2">Primary Color</label>
                  <div className="flex items-center gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => updateConfig((prev) => ({ ...prev, primary_color: p.hex }))}
                        title={p.name}
                        className={cn(
                          "size-7 rounded-[4px] border flex items-center justify-center transition-transform cursor-pointer",
                          config.primary_color === p.hex ? "scale-110 ring-2 ring-[#1868db] ring-offset-2" : "opacity-85 hover:opacity-100"
                        )}
                        style={{ backgroundColor: p.hex }}
                      >
                        {config.primary_color === p.hex && <Check className="size-3.5 text-white" />}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => updateConfig((prev) => ({ ...prev, primary_color: e.target.value }))}
                      className="size-6 rounded cursor-pointer border-none bg-transparent ml-auto"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-800 block mb-2">Theme Mode</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(["light", "dark"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateConfig((prev) => ({ ...prev, theme: t }))}
                        className={cn(
                          "p-2 rounded-[4px] border capitalize font-bold cursor-pointer transition-colors",
                          config.theme === t ? "border-[#1868db] bg-blue-50 text-[#1868db]" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {t} Mode
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 5: CUSTOM CSS OVERRIDES                              */}
            {/* ======================================================== */}
            {activeRailTab === "custom_css" && (
              <div className="space-y-4">
                <UpgradeGate capability="cmp.custom_css" featureName="Custom CSS">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-slate-800">Custom CSS Overrides</div>
                        <UpgradeBadge capability="cmp.custom_css" size="sm" />
                      </div>
                      {Boolean(config.custom_css?.trim()) && (
                        <button
                          type="button"
                          onClick={() => updateConfig((prev) => ({ ...prev, custom_css: "" }))}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                        >
                          Clear CSS
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Add custom CSS rules targeting <code>.upfront-banner</code> or <code>.upfront-modal</code>.
                    </p>
                    <textarea
                      rows={8}
                      placeholder="/* Custom CSS */&#10;.upfront-banner { font-family: Inter, sans-serif; }"
                      value={config.custom_css || ""}
                      onChange={(e) => updateConfig((prev) => ({ ...prev, custom_css: e.target.value }))}
                      className="w-full p-2 text-xs font-mono rounded-[4px] border border-slate-200 bg-slate-900 text-slate-100 focus:outline-hidden leading-relaxed"
                    />
                  </div>
                </UpgradeGate>

                {/* Reset to Default Banner Section */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="bg-slate-50 border border-slate-200 rounded-[4px] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-slate-800 text-xs font-bold">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                      <span>Reset to Default Banner</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Restore the entire banner configuration to the default setup, including layout, colours, standard text labels, and clear all custom CSS.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsResetBannerModalOpen(true)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 shadow-2xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset to Default Banner
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Sticky Bottom Action */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isSavingDraft || isPublishing || !activeDomain}
              onClick={handleSaveDraft}
              className="flex-1 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSavingDraft ? "Saving..." : "Save Draft"}
            </button>
            <Button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              disabled={isPublishing || !activeDomain}
              className="flex-1 rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold py-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              Review & Publish
            </Button>
          </div>
        </div>

        {/* CENTER-RIGHT LIVE SIMULATED WEBPAGE CANVAS */}
        <div className="flex-1 min-h-0 bg-slate-100/70 p-4 sm:p-6 flex flex-col justify-between overflow-hidden h-full">
          
          {/* Canvas Top Bar: Device Switcher + Preview Toggle + Publish Action */}
          <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-[4px] border border-slate-200 mb-3 shadow-2xs shrink-0 gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs font-bold">
              <button
                type="button"
                onClick={() => setPreviewView("notice")}
                className={cn(
                  "px-2.5 py-1 rounded transition-colors cursor-pointer",
                  previewView === "notice" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                1. Notice Banner
              </button>
              <button
                type="button"
                onClick={() => setPreviewView("preferences")}
                className={cn(
                  "px-2.5 py-1 rounded transition-colors cursor-pointer",
                  previewView === "preferences" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                2. Preference Centre
              </button>
            </div>

            {/* Middle: Viewport Device Icons */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 hidden sm:flex">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                title="Desktop View"
                className={cn(
                  "p-1.5 rounded text-xs transition-colors cursor-pointer",
                  previewDevice === "desktop" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-400 hover:text-slate-700"
                )}
              >
                <Monitor className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("tablet")}
                title="Tablet View"
                className={cn(
                  "p-1.5 rounded text-xs transition-colors cursor-pointer",
                  previewDevice === "tablet" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-400 hover:text-slate-700"
                )}
              >
                <Tablet className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                title="Mobile View"
                className={cn(
                  "p-1.5 rounded text-xs transition-colors cursor-pointer",
                  previewDevice === "mobile" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-400 hover:text-slate-700"
                )}
              >
                <Smartphone className="size-3.5" />
              </button>
            </div>

            {/* Right Action: Language Preview Switcher + Draft Status Badge */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">Preview Lang:</span>
                <select
                  value={previewLanguage}
                  onChange={(e) => setPreviewLanguage(e.target.value)}
                  className="text-xs font-semibold bg-transparent border-0 text-slate-800 focus:outline-hidden cursor-pointer"
                  title="Simulate visitor browser language"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              {isDraft ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Draft Preview</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>Live Preview (v{publishedVersion})</span>
                </div>
              )}
            </div>
          </div>

          {/* SIMULATED WEBPAGE FRAME */}
          <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden py-1">
            <div
              className={cn(
                "relative bg-white border border-slate-200 rounded-[6px] overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between h-[560px] max-h-full upfront-banner-canvas",
                previewDevice === "desktop"
                  ? "w-full max-w-[980px]"
                  : previewDevice === "tablet"
                  ? "w-[580px]"
                  : "w-[350px]"
              )}
            >
              {/* CMP & Custom CSS Scoped Styles */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    .upfront-banner-canvas {
                      --usrly-primary: ${config.primary_color || "#1868db"};
                      --usrly-bg: ${config.theme === "dark" ? "#0f172a" : "#ffffff"};
                      --usrly-text: ${config.theme === "dark" ? "#f8fafc" : "#0f172a"};
                      --usrly-text-muted: ${config.theme === "dark" ? "#94a3b8" : "#64748b"};
                      --usrly-border: ${config.theme === "dark" ? "#334155" : "#e2e8f0"};
                      --usrly-radius: ${config.border_radius === "rounded-full" ? "9999px" : config.border_radius === "rounded-lg" ? "12px" : config.border_radius === "rounded-none" ? "0px" : "6px"};
                    }
                    .upfront-banner-canvas .usrly-btn-primary {
                      background-color: var(--usrly-primary);
                      color: #ffffff;
                    }
                    .upfront-banner-canvas .usrly-btn-outline {
                      border-color: var(--usrly-primary);
                      color: var(--usrly-primary);
                    }
                    .upfront-banner-canvas .usrly-btn-secondary {
                      background-color: ${config.theme === "dark" ? "#1e293b" : "#ffffff"};
                      color: ${config.theme === "dark" ? "#f8fafc" : "#0f172a"};
                      border-color: ${config.theme === "dark" ? "#334155" : "#e2e8f0"};
                    }
                    ${config.custom_css ? validateAndSanitizeCSS(config.custom_css).sanitizedCss || "" : ""}
                  `,
                }}
              />

              {/* Webpage Content: Clean Sleek Browser Canvas */}
              <div className="relative w-full h-full flex-1 overflow-hidden bg-slate-50 flex flex-col">
                {/* Browser Mock Address Bar */}
                <div className="h-8 bg-slate-100 border-b border-slate-200 px-3 flex items-center gap-2 select-none shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-300" />
                    <span className="size-2 rounded-full bg-slate-300" />
                    <span className="size-2 rounded-full bg-slate-300" />
                  </div>
                  <div className="flex-1 max-w-sm mx-auto bg-white border border-slate-200 rounded px-2.5 py-0.5 text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
                    <span className="text-emerald-600 font-bold">🔒</span>
                    <span className="truncate">https://{activeDomain || "yourwebsite.com"}</span>
                  </div>
                </div>

                {/* Clean Canvas Wireframe Content */}
                <div className="flex-1 p-6 space-y-4 overflow-y-auto select-none pointer-events-none opacity-40">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="h-4 w-24 bg-slate-300 rounded" />
                    <div className="flex gap-3">
                      <div className="h-3 w-12 bg-slate-200 rounded" />
                      <div className="h-3 w-12 bg-slate-200 rounded" />
                      <div className="h-3 w-16 bg-slate-300 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-md mx-auto pt-4 text-center">
                    <div className="h-6 w-3/4 bg-slate-300 rounded mx-auto" />
                    <div className="h-3 w-1/2 bg-slate-200 rounded mx-auto" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-4">
                    <div className="h-20 bg-white border border-slate-200 rounded-md p-3 space-y-2">
                      <div className="size-4 bg-slate-200 rounded" />
                      <div className="h-3 w-3/4 bg-slate-200 rounded" />
                    </div>
                    <div className="h-20 bg-white border border-slate-200 rounded-md p-3 space-y-2">
                      <div className="size-4 bg-slate-200 rounded" />
                      <div className="h-3 w-3/4 bg-slate-200 rounded" />
                    </div>
                    <div className="h-20 bg-white border border-slate-200 rounded-md p-3 space-y-2">
                      <div className="size-4 bg-slate-200 rounded" />
                      <div className="h-3 w-3/4 bg-slate-200 rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE NOTICE BANNER OVERLAY */}
              {previewView === "notice" && (
                <>
                  {config.layout === "center_modal" ? (
                    <div className="absolute inset-0 z-20 bg-slate-950/45 backdrop-blur-2xs flex items-center justify-center p-3 animate-in fade-in-0">
                      <div className={cn(
                        "usrly-banner-wrapper upfront-banner rounded-[6px] shadow-2xl p-4.5 sm:p-5 border space-y-3.5 animate-in zoom-in-95",
                        config.theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900",
                        previewDevice === "mobile" ? "w-full mx-1" : "w-full max-w-[480px]"
                      )}>
                        <div className="flex items-start justify-between">
                          <h4 className={cn("usrly-banner-title text-sm font-bold leading-snug", config.theme === "dark" ? "text-white" : "text-slate-900")}>{getText("title")}</h4>
                          {config.show_close_button && (
                            <button type="button" className={cn("text-xs ml-2", config.theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700")}>✕</button>
                          )}
                        </div>
                        <p className={cn("usrly-banner-desc text-[11px] leading-relaxed", config.theme === "dark" ? "text-slate-300" : "text-slate-600")}>{getText("description")}</p>

                        <div className={cn(
                          "usrly-btn-group pt-3 border-t w-full",
                          previewDevice === "mobile"
                            ? "flex flex-col gap-2"
                            : "flex flex-wrap items-center justify-end gap-2",
                          config.theme === "dark" ? "border-slate-800" : "border-slate-100"
                        )}>
                          {(config as any).law_template !== "notice_only" && (
                            <button
                              type="button"
                              onClick={() => setPreviewView("preferences")}
                              className={cn(
                                "usrly-btn usrly-btn-outline px-3 py-2 text-xs font-bold rounded-[4px] border-2 transition-all shadow-2xs text-center whitespace-normal break-words leading-tight cursor-pointer",
                                previewDevice === "mobile" ? "w-full" : "flex-1 min-w-[110px]"
                              )}
                            >
                              {getText("preferences_label")}
                            </button>
                          )}
                          {(config as any).law_template !== "notice_only" && (
                            <button
                              type="button"
                              className={cn(
                                "usrly-btn usrly-btn-secondary px-3 py-2 text-xs font-bold rounded-[4px] border transition-all shadow-2xs text-center whitespace-normal break-words leading-tight cursor-pointer",
                                previewDevice === "mobile" ? "w-full" : "flex-1 min-w-[110px]"
                              )}
                            >
                              {getText("reject_all_label")}
                            </button>
                          )}
                          <button
                            type="button"
                            className={cn(
                              "usrly-btn usrly-btn-primary px-3 py-2 text-xs font-bold rounded-[4px] shadow-xs transition-all text-center whitespace-normal break-words leading-tight cursor-pointer",
                              previewDevice === "mobile" || (config as any).law_template === "notice_only" ? "w-full" : "flex-1 min-w-[110px]"
                            )}
                          >
                            {getText("accept_all_label")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : config.layout === "bottom_bar" ? (
                    <div className={cn(
                      "usrly-banner-wrapper upfront-banner p-3.5 sm:p-4 border-t shadow-xl transition-all z-10 shrink-0",
                      config.theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                    )}>
                      <div className={cn(
                        "usrly-banner-inner",
                        previewDevice === "mobile"
                          ? "flex flex-col gap-3 w-full"
                          : "flex flex-col md:flex-row md:items-center justify-between gap-3"
                      )}>
                        <div className="usrly-banner-text space-y-1 w-full flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={cn("usrly-banner-title text-xs font-bold", config.theme === "dark" ? "text-white" : "text-slate-900")}>{getText("title")}</h4>
                            {config.show_close_button && <button type="button" className={cn("text-xs ml-2", config.theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-400")}>✕</button>}
                          </div>
                          <p className={cn("usrly-banner-desc text-[11px] leading-relaxed", config.theme === "dark" ? "text-slate-300" : "text-slate-600")}>{getText("description")}</p>
                        </div>

                        <div className={cn(
                          "usrly-btn-group shrink-0",
                          previewDevice === "mobile"
                            ? "flex flex-col gap-2 w-full pt-1"
                            : "flex flex-wrap items-center justify-end gap-2"
                        )}>
                          {(config as any).law_template !== "notice_only" && (
                            <button
                              type="button"
                              onClick={() => setPreviewView("preferences")}
                              className={cn(
                                "usrly-btn usrly-btn-outline px-3.5 py-2 text-xs font-bold rounded-[4px] border-2 transition-all shadow-2xs text-center whitespace-normal break-words leading-tight cursor-pointer",
                                previewDevice === "mobile" ? "w-full" : "min-w-fit"
                              )}
                            >
                              {getText("preferences_label")}
                            </button>
                          )}
                          {(config as any).law_template !== "notice_only" && (
                            <button
                              type="button"
                              className={cn(
                                "usrly-btn usrly-btn-secondary px-3.5 py-2 text-xs font-bold rounded-[4px] border transition-all shadow-2xs text-center whitespace-normal break-words leading-tight cursor-pointer",
                                previewDevice === "mobile" ? "w-full" : "min-w-fit"
                              )}
                            >
                              {getText("reject_all_label")}
                            </button>
                          )}
                          <button
                            type="button"
                            className={cn(
                              "usrly-btn usrly-btn-primary px-4 py-2 text-xs font-bold rounded-[4px] shadow-xs transition-all text-center whitespace-normal break-words leading-tight cursor-pointer",
                              previewDevice === "mobile" || (config as any).law_template === "notice_only" ? "w-full" : "min-w-fit"
                            )}
                          >
                            {getText("accept_all_label")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* BOX POSITIONING: 4 CORNERS */
                    <div
                      className={cn(
                        "usrly-banner-wrapper upfront-banner p-3.5 sm:p-4 rounded-[6px] border shadow-2xl transition-all z-10 space-y-3 absolute",
                        config.theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900",
                        previewDevice === "mobile"
                          ? "left-2.5 right-2.5 bottom-2.5 max-w-none m-0"
                          : cn(
                              "w-full max-w-[390px] m-3",
                              config.layout === "floating_bottom_right" ? "bottom-0 right-0" :
                              config.layout === "floating_top_left" ? "top-8 left-0" :
                              config.layout === "floating_top_right" ? "top-8 right-0" :
                              "bottom-0 left-0"
                            )
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className={cn("usrly-banner-title text-xs font-bold leading-snug", config.theme === "dark" ? "text-white" : "text-slate-900")}>{getText("title")}</h4>
                        {config.show_close_button && <button type="button" className={cn("text-xs ml-2", config.theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-400")}>✕</button>}
                      </div>
                      <p className={cn("usrly-banner-desc text-[11px] leading-relaxed", config.theme === "dark" ? "text-slate-300" : "text-slate-600")}>{getText("description")}</p>

                      <div className={cn(
                        "usrly-btn-group pt-2 w-full",
                        previewDevice === "mobile"
                          ? "flex flex-col gap-2"
                          : "flex flex-wrap gap-2"
                      )}>
                        {(config as any).law_template !== "notice_only" && (
                          <button
                            type="button"
                            onClick={() => setPreviewView("preferences")}
                            className={cn(
                              "usrly-btn usrly-btn-outline px-2.5 py-2 text-xs font-bold rounded-[4px] border-2 transition-all shadow-2xs text-center whitespace-normal break-words leading-tight cursor-pointer",
                              previewDevice === "mobile" ? "w-full" : "flex-1 min-w-[90px]"
                            )}
                          >
                            {getText("preferences_label")}
                          </button>
                        )}
                        {(config as any).law_template !== "notice_only" && (
                          <button
                            type="button"
                            className={cn(
                              "usrly-btn usrly-btn-secondary px-2.5 py-2 text-xs font-bold rounded-[4px] border transition-all shadow-2xs text-center whitespace-normal break-words leading-tight cursor-pointer",
                              previewDevice === "mobile" ? "w-full" : "flex-1 min-w-[90px]"
                            )}
                          >
                            {getText("reject_all_label")}
                          </button>
                        )}
                        <button
                          type="button"
                          className={cn(
                            "usrly-btn usrly-btn-primary px-2.5 py-2 text-xs font-bold rounded-[4px] shadow-xs transition-all text-center whitespace-normal break-words leading-tight cursor-pointer",
                            previewDevice === "mobile" || (config as any).law_template === "notice_only" ? "w-full" : "flex-1 min-w-[90px]"
                          )}
                        >
                          {getText("accept_all_label")}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* LIVE PREFERENCE CENTRE OVERLAY */}
              {previewView === "preferences" && (
                <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-in fade-in-0 usrly-modal-overlay">
                  <div className={cn(
                    "rounded-[6px] shadow-2xl w-full max-w-[480px] max-h-[480px] flex flex-col overflow-hidden border animate-in zoom-in-95 usrly-modal upfront-modal",
                    config.theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                  )}>
                    {/* Header */}
                    <div className={cn(
                      "usrly-modal-header px-4 py-3 border-b flex items-center justify-between shrink-0",
                      config.theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
                    )}>
                      <h3 className="usrly-modal-title text-xs font-bold">
                        {getText("preferences_title")}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setPreviewView("notice")}
                        className={cn("text-xs font-bold cursor-pointer", config.theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700")}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Body & Categories */}
                    <div className={cn(
                      "usrly-modal-body p-4 overflow-y-auto space-y-3 text-[11px] flex-1",
                      config.theme === "dark" ? "text-slate-300" : "text-slate-600"
                    )}>
                      <div className={cn("leading-relaxed", config.theme === "dark" ? "text-slate-300" : "text-slate-500")}>
                        <span className={cn(!isPrefDescExpanded && "line-clamp-2")}>
                          {getText("preferences_description")}
                        </span>
                        {(getText("preferences_description") || "").length > 80 && (
                          <button
                            type="button"
                            onClick={() => setIsPrefDescExpanded(!isPrefDescExpanded)}
                            className="text-[#1868db] font-bold hover:underline ml-1 inline-block cursor-pointer"
                          >
                            {isPrefDescExpanded ? (getText("show_less_label") || "Show less") : (getText("show_more_label") || "Show more")}
                          </button>
                        )}
                      </div>

                      {config.show_google_privacy_policy && (
                        <div className={cn(
                          "p-2 rounded text-[10.5px] border",
                          config.theme === "dark" ? "bg-slate-800/60 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                        )}>
                          {config.google_policy_message || "For more information on how Google's third-party cookies operate, see"}{" "}
                          <a href={config.google_policy_url} target="_blank" rel="noreferrer" className="text-[#1868db] underline font-bold">
                            {config.google_policy_link_text || "Google Privacy Policy"}
                          </a>.
                        </div>
                      )}

                      {/* 1. Necessary */}
                      <div className={cn("border-t pt-2 space-y-1.5", config.theme === "dark" ? "border-slate-800" : "border-slate-200")}>
                        <div
                          className="flex items-center justify-between cursor-pointer py-1"
                          onClick={() => toggleMockAccordion("necessary")}
                        >
                          <div className={cn("flex items-center gap-1.5 font-bold", config.theme === "dark" ? "text-white" : "text-slate-900")}>
                            <ChevronRight className={cn("size-3 transition-transform text-slate-500", mockExpanded.necessary && "rotate-90")} />
                            {getText("necessary_title")}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {getText("always_active_label")}
                          </span>
                        </div>
                        {mockExpanded.necessary && (
                          <div className="pl-4 space-y-2">
                            <p className={cn("text-[10px] leading-relaxed", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                              {getText("necessary_description")}
                            </p>
                            {config.show_cookie_list_on_banner !== false && (
                              <div className={cn(
                                "rounded border p-2 text-[9.5px] space-y-1 font-mono overflow-x-auto",
                                config.theme === "dark" ? "bg-slate-800/60 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                              )}>
                                <div className={cn(
                                  "font-sans font-bold grid grid-cols-12 text-[10px] pb-1 border-b min-w-[280px]",
                                  config.theme === "dark" ? "text-slate-200 border-slate-700" : "text-slate-700 border-slate-200"
                                )}>
                                  <span className="col-span-4">{getText("cookie_column_label")}</span>
                                  <span className="col-span-3">{getText("duration_column_label")}</span>
                                  <span className="col-span-5">{getText("description_column_label")}</span>
                                </div>
                                <div className="grid grid-cols-12 pt-1 items-center min-w-[280px]">
                                  <span className={cn("col-span-4 font-bold", config.theme === "dark" ? "text-white" : "text-slate-800")}>usrly_consent</span>
                                  <span className={cn("col-span-3", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>1 year</span>
                                  <span className={cn("col-span-5 font-sans text-[9px] truncate", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>Consent preferences state</span>
                                </div>
                                <div className="grid grid-cols-12 pt-0.5 items-center min-w-[280px]">
                                  <span className={cn("col-span-4 font-bold", config.theme === "dark" ? "text-white" : "text-slate-800")}>cf_clearance</span>
                                  <span className={cn("col-span-3", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>30 days</span>
                                  <span className={cn("col-span-5 font-sans text-[9px] truncate", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>Cloudflare bot clearance</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 2. Functional */}
                      {config.enable_functional_category && (
                        <div className={cn("border-t pt-2 space-y-1.5", config.theme === "dark" ? "border-slate-800" : "border-slate-200")}>
                          <div className="flex items-center justify-between py-1">
                            <div
                              className={cn("flex items-center gap-1.5 font-bold cursor-pointer", config.theme === "dark" ? "text-white" : "text-slate-900")}
                              onClick={() => toggleMockAccordion("functional")}
                            >
                              <ChevronRight className={cn("size-3 transition-transform text-slate-500", mockExpanded.functional && "rotate-90")} />
                              {getText("functional_title")}
                            </div>
                            <input
                              type="checkbox"
                              checked={mockSwitches.functional}
                              onChange={(e) => setMockSwitches({ ...mockSwitches, functional: e.target.checked })}
                              className="size-3.5 rounded text-[#1868db] focus:ring-[#1868db]"
                            />
                          </div>
                          {mockExpanded.functional && (
                            <div className="pl-4 space-y-2">
                              <p className={cn("text-[10px] leading-relaxed", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                                {getText("functional_description")}
                              </p>
                              {config.show_cookie_list_on_banner !== false && (
                                <div className={cn(
                                  "rounded border p-2 text-[9.5px] space-y-1 font-mono overflow-x-auto",
                                  config.theme === "dark" ? "bg-slate-800/60 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                                )}>
                                  <div className={cn(
                                    "font-sans font-bold grid grid-cols-12 text-[10px] pb-1 border-b min-w-[280px]",
                                    config.theme === "dark" ? "text-slate-200 border-slate-700" : "text-slate-700 border-slate-200"
                                  )}>
                                    <span className="col-span-4">{getText("cookie_column_label")}</span>
                                    <span className="col-span-3">{getText("duration_column_label")}</span>
                                    <span className="col-span-5">{getText("description_column_label")}</span>
                                  </div>
                                  <div className="grid grid-cols-12 pt-1 items-center min-w-[280px]">
                                    <span className={cn("col-span-4 font-bold", config.theme === "dark" ? "text-white" : "text-slate-800")}>i18n_lang</span>
                                    <span className={cn("col-span-3", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>Session</span>
                                    <span className={cn("col-span-5 font-sans text-[9px] truncate", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>User language choice</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. Analytics */}
                      {config.enable_analytics_category && (
                        <div className={cn("border-t pt-2 space-y-1.5", config.theme === "dark" ? "border-slate-800" : "border-slate-200")}>
                          <div className="flex items-center justify-between py-1">
                            <div
                              className={cn("flex items-center gap-1.5 font-bold cursor-pointer", config.theme === "dark" ? "text-white" : "text-slate-900")}
                              onClick={() => toggleMockAccordion("analytics")}
                            >
                              <ChevronRight className={cn("size-3 transition-transform text-slate-500", mockExpanded.analytics && "rotate-90")} />
                              {getText("analytics_title")}
                            </div>
                            <input
                              type="checkbox"
                              checked={mockSwitches.analytics}
                              onChange={(e) => setMockSwitches({ ...mockSwitches, analytics: e.target.checked })}
                              className="size-3.5 rounded text-[#1868db] focus:ring-[#1868db]"
                            />
                          </div>
                          {mockExpanded.analytics && (
                            <div className="pl-4 space-y-2">
                              <p className={cn("text-[10px] leading-relaxed", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                                {getText("analytics_description")}
                              </p>
                              {config.show_cookie_list_on_banner !== false && (
                                <div className={cn(
                                  "rounded border p-2 text-[9.5px] space-y-1 font-mono overflow-x-auto",
                                  config.theme === "dark" ? "bg-slate-800/60 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                                )}>
                                  <div className={cn(
                                    "font-sans font-bold grid grid-cols-12 text-[10px] pb-1 border-b min-w-[280px]",
                                    config.theme === "dark" ? "text-slate-200 border-slate-700" : "text-slate-700 border-slate-200"
                                  )}>
                                    <span className="col-span-4">{getText("cookie_column_label")}</span>
                                    <span className="col-span-3">{getText("duration_column_label")}</span>
                                    <span className="col-span-5">{getText("description_column_label")}</span>
                                  </div>
                                  <div className="grid grid-cols-12 pt-1 items-center min-w-[280px]">
                                    <span className={cn("col-span-4 font-bold", config.theme === "dark" ? "text-white" : "text-slate-800")}>_ga</span>
                                    <span className={cn("col-span-3", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>2 years</span>
                                    <span className={cn("col-span-5 font-sans text-[9px] truncate", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>Google Analytics visitor ID</span>
                                  </div>
                                  <div className="grid grid-cols-12 pt-0.5 items-center min-w-[280px]">
                                    <span className={cn("col-span-4 font-bold", config.theme === "dark" ? "text-white" : "text-slate-800")}>_gid</span>
                                    <span className={cn("col-span-3", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>24 hours</span>
                                    <span className={cn("col-span-5 font-sans text-[9px] truncate", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>Google Analytics session ID</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4. Performance */}
                      {config.enable_performance_category && (
                        <div className={cn("border-t pt-2 space-y-1.5", config.theme === "dark" ? "border-slate-800" : "border-slate-200")}>
                          <div className="flex items-center justify-between py-1">
                            <div
                              className={cn("flex items-center gap-1.5 font-bold cursor-pointer", config.theme === "dark" ? "text-white" : "text-slate-900")}
                              onClick={() => toggleMockAccordion("performance")}
                            >
                              <ChevronRight className={cn("size-3 transition-transform text-slate-500", mockExpanded.performance && "rotate-90")} />
                              {getText("performance_title")}
                            </div>
                            <input
                              type="checkbox"
                              checked={mockSwitches.performance}
                              onChange={(e) => setMockSwitches({ ...mockSwitches, performance: e.target.checked })}
                              className="size-3.5 rounded text-[#1868db] focus:ring-[#1868db]"
                            />
                          </div>
                          {mockExpanded.performance && (
                            <div className="pl-4 space-y-2">
                              <p className={cn("text-[10px] leading-relaxed", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                                {getText("performance_description")}
                              </p>
                              {config.show_cookie_list_on_banner !== false && (
                                <div className={cn(
                                  "rounded border border-dashed p-2.5 text-center",
                                  config.theme === "dark" ? "bg-slate-800/40 border-slate-700" : "bg-slate-50/70 border-slate-200"
                                )}>
                                  <span className={cn("text-[10px] italic font-medium", config.theme === "dark" ? "text-slate-400" : "text-slate-400")}>
                                    {getText("no_cookies_to_display_label")}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 5. Advertisement */}
                      {config.enable_advertisement_category && (
                        <div className={cn("border-t pt-2 space-y-1.5", config.theme === "dark" ? "border-slate-800" : "border-slate-200")}>
                          <div className="flex items-center justify-between py-1">
                            <div
                              className={cn("flex items-center gap-1.5 font-bold cursor-pointer", config.theme === "dark" ? "text-white" : "text-slate-900")}
                              onClick={() => toggleMockAccordion("advertisement")}
                            >
                              <ChevronRight className={cn("size-3 transition-transform text-slate-500", mockExpanded.advertisement && "rotate-90")} />
                              {getText("advertisement_title")}
                            </div>
                            <input
                              type="checkbox"
                              checked={mockSwitches.advertisement}
                              onChange={(e) => setMockSwitches({ ...mockSwitches, advertisement: e.target.checked })}
                              className="size-3.5 rounded text-[#1868db] focus:ring-[#1868db]"
                            />
                          </div>
                          {mockExpanded.advertisement && (
                            <div className="pl-4 space-y-2">
                              <p className={cn("text-[10px] leading-relaxed", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                                {getText("advertisement_description")}
                              </p>
                              {config.show_cookie_list_on_banner !== false && (
                                <div className={cn(
                                  "rounded border p-2 text-[9.5px] space-y-1 font-mono overflow-x-auto",
                                  config.theme === "dark" ? "bg-slate-800/60 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                                )}>
                                  <div className={cn(
                                    "font-sans font-bold grid grid-cols-12 text-[10px] pb-1 border-b min-w-[280px]",
                                    config.theme === "dark" ? "text-slate-200 border-slate-700" : "text-slate-700 border-slate-200"
                                  )}>
                                    <span className="col-span-4">{getText("cookie_column_label")}</span>
                                    <span className="col-span-3">{getText("duration_column_label")}</span>
                                    <span className="col-span-5">{getText("description_column_label")}</span>
                                  </div>
                                  <div className="grid grid-cols-12 pt-1 items-center min-w-[280px]">
                                    <span className={cn("col-span-4 font-bold", config.theme === "dark" ? "text-white" : "text-slate-800")}>_fbp</span>
                                    <span className={cn("col-span-3", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>3 months</span>
                                    <span className={cn("col-span-5 font-sans text-[9px] truncate", config.theme === "dark" ? "text-slate-400" : "text-slate-500")}>Meta advertising pixel tracking</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3-Button Action Row */}
                    <div className={cn(
                      "usrly-modal-footer p-3 border-t shrink-0",
                      config.theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200",
                      previewDevice === "mobile" ? "flex flex-col gap-2" : "flex flex-wrap sm:flex-nowrap gap-2"
                    )}>
                      <button
                        type="button"
                        onClick={() => setPreviewView("notice")}
                        className={cn(
                          "usrly-btn usrly-btn-secondary py-2 px-3 text-xs font-bold rounded-[4px] border cursor-pointer text-center whitespace-normal break-words leading-tight transition-all",
                          previewDevice === "mobile" ? "w-full" : "flex-1 min-w-[100px]"
                        )}
                      >
                        {getText("pref_reject_all_label")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewView("notice")}
                        className={cn(
                          "usrly-btn usrly-btn-outline py-2 px-3 text-xs font-bold rounded-[4px] border-2 cursor-pointer text-center whitespace-normal break-words leading-tight transition-all",
                          previewDevice === "mobile" ? "w-full" : "flex-1 min-w-[120px]"
                        )}
                      >
                        {getText("save_preferences_label")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewView("notice")}
                        className={cn(
                          "usrly-btn usrly-btn-primary py-2 px-3 text-xs font-bold rounded-[4px] shadow-xs cursor-pointer text-center whitespace-normal break-words leading-tight transition-all",
                          previewDevice === "mobile" ? "w-full" : "flex-1 min-w-[100px]"
                        )}
                      >
                        {getText("pref_accept_all_label")}
                      </button>
                    </div>

                    {/* Watermark */}
                    <div className={cn(
                      "px-4 py-1.5 border-t text-right text-[10px] shrink-0",
                      config.theme === "dark" ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"
                    )}>
                      Powered by <strong className={config.theme === "dark" ? "text-white" : "text-slate-900"}>Upfront</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Atomic Publish Confirmation Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirmPublish={handlePublish}
        isPublishing={isPublishing}
        targetVersion={getTargetVersion()}
        publishedVersion={publishedVersion}
        diffs={getDiffs()}
        validation={getValidation()}
      />

      {/* 3. Version History & Audit Drawer */}
      <VersionHistoryDrawer
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        activeDomain={activeDomain || ""}
        currentPublishedVersion={publishedVersion}
        onVersionRestored={loadStudioData}
      />

      {/* 4. Reset to Default Banner Confirmation Modal */}
      {isResetBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Reset Banner to Default?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This action will restore all banner settings, including colors, layout, consent category descriptions, and custom CSS overrides back to the original default configuration.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-700">What will be reset:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                <li>Theme & Primary Color (#1868db)</li>
                <li>Banner Layout & Position</li>
                <li>Notice and Preference Centre copy</li>
                <li>Custom CSS overrides</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetBannerModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-[4px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={handleResetToDefaultBanner}
                className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-[4px] shadow-xs cursor-pointer"
              >
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
