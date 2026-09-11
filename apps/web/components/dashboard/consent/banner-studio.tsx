"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Palette,
  Layout,
  Type,
  Sliders,
  Sparkles,
  Check,
  RotateCcw,
  Smartphone,
  Monitor,
  Shield,
  ExternalLink,
  Save,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Cookie,
  SlidersHorizontal,
  Eye,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"
import { useDomain } from "@/lib/domain-context"
import { fetchConsentConfig, saveConsentConfig, ConsentConfig } from "@/lib/api"

const COLOR_PRESETS = [
  { name: "CookieYes Blue", hex: "#1868db" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Emerald", hex: "#059669" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Dark Slate", hex: "#0f172a" },
]

export function BannerStudio() {
  const { activeDomain } = useDomain()

  const [config, setConfig] = useState<ConsentConfig>({
    domain: activeDomain || "",
    is_enabled: true,
    layout: "bottom_bar",
    theme: "light",
    primary_color: "#1868db",
    border_radius: "rounded-md",
    title: "We value your privacy",
    description: "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
    privacy_policy_url: "/privacy",
    accept_all_label: "Accept All",
    reject_all_label: "Reject All",
    preferences_label: "Customise",
    enable_necessary_category: true,
    enable_functional_category: true,
    enable_analytics_category: true,
    enable_performance_category: true,
    enable_advertisement_category: true,
    show_revisit_button: true,
    revisit_button_position: "bottom_left",
    enable_consent_mode_v2: true,
    geo_targeting: "all",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")
  const [previewTab, setPreviewTab] = useState<"banner" | "preferences_modal" | "revisit_button">("banner")
  const [activeSettingsTab, setActiveSettingsTab] = useState<"layout" | "content" | "categories">("layout")

  // Interactive mock state for preferences preview
  const [mockExpanded, setMockExpanded] = useState<Record<string, boolean>>({
    necessary: true,
    functional: true,
    analytics: true,
    performance: false,
    advertisement: false,
  })
  const [mockSwitches, setMockSwitches] = useState({
    functional: true,
    analytics: true,
    performance: true,
    advertisement: true,
  })

  useEffect(() => {
    if (!activeDomain) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    fetchConsentConfig(activeDomain)
      .then((data) => {
        setConfig((prev) => ({
          ...prev,
          ...data,
          primary_color: data.primary_color || "#1868db",
        }))
      })
      .catch((err) => {
        console.warn("Could not fetch consent config, using defaults:", err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [activeDomain])

  const handleSave = async () => {
    if (!activeDomain) return
    setIsSaving(true)
    try {
      await saveConsentConfig({
        ...config,
        domain: activeDomain,
      })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch (err: any) {
      alert(err?.message || "Failed to save consent settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleMockAccordion = (key: string) => {
    setMockExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Banner Studio</h1>
            <span className="rounded-[4px] bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-700 border border-neutral-200">
              Interactive Customizer
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time visual editor for your CookieYes compliance banner on <strong className="text-neutral-800">{activeDomain || "your site"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !activeDomain}
            className={cn(
              "text-xs font-bold px-4 py-2 rounded-[4px] shadow-xs transition-all inline-flex items-center gap-1.5",
              savedSuccess
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-[#1868db] hover:bg-[#1559be] text-white"
            )}
          >
            {savedSuccess ? (
              <>
                <Check className="size-3.5" />
                Published Live!
              </>
            ) : isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="size-3.5" />
                Publish Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Controls & Customization */}
        <div className="lg:col-span-5 space-y-4">
          {/* Settings Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-[4px] border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveSettingsTab("layout")}
              className={cn(
                "flex-1 py-1.5 rounded-[4px] font-bold transition-all text-center",
                activeSettingsTab === "layout" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Layout & Theme
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab("content")}
              className={cn(
                "flex-1 py-1.5 rounded-[4px] font-bold transition-all text-center",
                activeSettingsTab === "content" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Copy & Labels
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab("categories")}
              className={cn(
                "flex-1 py-1.5 rounded-[4px] font-bold transition-all text-center",
                activeSettingsTab === "categories" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              5 Categories
            </button>
          </div>

          {/* TAB 1: LAYOUT & THEME */}
          {activeSettingsTab === "layout" && (
            <div className="rounded-[4px] border border-slate-200 bg-white p-5 space-y-5 shadow-2xs">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2">Banner Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "bottom_bar", label: "Bottom Bar", desc: "Classic CookieYes full bar" },
                    { id: "floating_bottom_left", label: "Bottom Left", desc: "Compact floating box" },
                    { id: "floating_bottom_right", label: "Bottom Right", desc: "Compact floating box" },
                    { id: "center_modal", label: "Center Popup", desc: "High-focus modal" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setConfig({ ...config, layout: l.id as any })}
                      className={cn(
                        "p-3 rounded-[4px] border text-left transition-all",
                        config.layout === l.id
                          ? "border-[#1868db] bg-blue-50 text-[#1868db] ring-1 ring-[#1868db]/30"
                          : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700"
                      )}
                    >
                      <div className="font-bold text-xs">{l.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2">Primary Color (Buttons & Highlights)</label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setConfig({ ...config, primary_color: p.hex })}
                      title={p.name}
                      className={cn(
                        "size-8 rounded-[4px] border flex items-center justify-center transition-transform",
                        config.primary_color === p.hex ? "scale-110 ring-2 ring-[#1868db] ring-offset-2" : "opacity-85 hover:opacity-100"
                      )}
                      style={{ backgroundColor: p.hex }}
                    >
                      {config.primary_color === p.hex && <Check className="size-4 text-white" />}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto border border-slate-200 rounded-[4px] px-2 py-1 bg-slate-50 text-xs">
                    <span className="font-mono text-slate-600">{config.primary_color}</span>
                    <input
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      className="size-5 rounded cursor-pointer border-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Floating Revisit Cookie Badge</div>
                    <div className="text-[11px] text-slate-500">Persistent widget for visitors to re-open preferences</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.show_revisit_button}
                    onChange={(e) => setConfig({ ...config, show_revisit_button: e.target.checked })}
                    className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT & LABELS */}
          {activeSettingsTab === "content" && (
            <div className="rounded-[4px] border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Banner Title</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-[4px] border border-slate-200 bg-slate-50/60 text-slate-900 focus:outline-hidden focus:border-[#1868db]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-[4px] border border-slate-200 bg-slate-50/60 text-slate-900 focus:outline-hidden focus:border-[#1868db] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Accept All</label>
                  <input
                    type="text"
                    value={config.accept_all_label}
                    onChange={(e) => setConfig({ ...config, accept_all_label: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 bg-slate-50/60 text-slate-900 focus:outline-hidden focus:border-[#1868db]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Reject All</label>
                  <input
                    type="text"
                    value={config.reject_all_label}
                    onChange={(e) => setConfig({ ...config, reject_all_label: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 bg-slate-50/60 text-slate-900 focus:outline-hidden focus:border-[#1868db]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Preferences</label>
                  <input
                    type="text"
                    value={config.preferences_label}
                    onChange={(e) => setConfig({ ...config, preferences_label: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-[4px] border border-slate-200 bg-slate-50/60 text-slate-900 focus:outline-hidden focus:border-[#1868db]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 5 CATEGORIES */}
          {activeSettingsTab === "categories" && (
            <div className="rounded-[4px] border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
              <div className="text-xs text-slate-500 mb-2">
                Configure the 5 standard consent categories shown in the preferences modal.
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Necessary</div>
                  <div className="text-[11px] text-slate-500">Essential for login & basic security</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px]">Always On</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Functional</div>
                  <div className="text-[11px] text-slate-500">Language, chats, video embeds</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable_functional_category}
                  onChange={(e) => setConfig({ ...config, enable_functional_category: e.target.checked })}
                  className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                />
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Analytics</div>
                  <div className="text-[11px] text-slate-500">Traffic analysis & user journeys</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable_analytics_category}
                  onChange={(e) => setConfig({ ...config, enable_analytics_category: e.target.checked })}
                  className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                />
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Performance</div>
                  <div className="text-[11px] text-slate-500">Speed, CDN, error reporting</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable_performance_category}
                  onChange={(e) => setConfig({ ...config, enable_performance_category: e.target.checked })}
                  className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                />
              </div>

              <div className="flex items-center justify-between py-1.5">
                <div>
                  <div className="text-xs font-bold text-slate-900">Advertisement</div>
                  <div className="text-[11px] text-slate-500">Targeted ads (Meta Pixel, Google Ads, TikTok)</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable_advertisement_category}
                  onChange={(e) => setConfig({ ...config, enable_advertisement_category: e.target.checked })}
                  className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Interactive Mockup Canvas */}
        <div className="lg:col-span-7 space-y-3">
          {/* Canvas Controls */}
          <div className="flex items-center justify-between bg-white p-2 rounded-[4px] border border-slate-200 shadow-2xs">
            {/* Preview Mode Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-[4px] border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setPreviewTab("banner")}
                className={cn(
                  "px-3 py-1 rounded-[4px] font-bold transition-all",
                  previewTab === "banner" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                1. Initial Banner
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("preferences_modal")}
                className={cn(
                  "px-3 py-1 rounded-[4px] font-bold transition-all flex items-center gap-1",
                  previewTab === "preferences_modal" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                2. Preferences Modal
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("revisit_button")}
                className={cn(
                  "px-3 py-1 rounded-[4px] font-bold transition-all flex items-center gap-1",
                  previewTab === "revisit_button" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                3. Cookie Button 🍪
              </button>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-[4px] border border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={cn(
                  "p-1.5 rounded-[4px] text-xs transition-all",
                  previewDevice === "desktop" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-400 hover:text-slate-700"
                )}
              >
                <Monitor className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={cn(
                  "p-1.5 rounded-[4px] text-xs transition-all",
                  previewDevice === "mobile" ? "bg-[#1868db] text-white shadow-xs" : "text-slate-400 hover:text-slate-700"
                )}
              >
                <Smartphone className="size-4" />
              </button>
            </div>
          </div>

          {/* Viewport Frame */}
          <div className="rounded-[4px] border border-slate-200 bg-slate-100/50 p-4 flex items-center justify-center min-h-[500px]">
            <div
              className={cn(
                "relative bg-white border border-slate-200 rounded-[4px] overflow-hidden shadow-lg transition-all duration-300 flex flex-col justify-between",
                previewDevice === "desktop" ? "w-full h-[520px]" : "w-[340px] h-[520px]"
              )}
            >
              {/* Fake Website Header */}
              <div className="h-10 border-b border-slate-200 bg-slate-50 px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="size-2.5 rounded-full bg-rose-400" />
                  <div className="size-2.5 rounded-full bg-amber-400" />
                  <div className="size-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-white px-3 py-0.5 rounded-[4px] border border-slate-200">
                  {activeDomain || "yourwebsite.com"}
                </div>
                <div className="size-4" />
              </div>

              {/* Fake Website Body Content */}
              <div className="p-6 space-y-3 opacity-25 select-none pointer-events-none flex-1">
                <div className="h-5 w-44 bg-slate-300 rounded-[4px]" />
                <div className="h-3 w-full bg-slate-200 rounded" />
                <div className="h-3 w-5/6 bg-slate-200 rounded" />
                <div className="h-28 w-full bg-slate-50 rounded-[4px] border border-slate-200 mt-4" />
              </div>

              {/* ======================================================== */}
              {/* PREVIEW 1: PRIMARY BANNER (COOKIE YES RECTANGULAR STYLE) */}
              {/* ======================================================== */}
              {previewTab === "banner" && (
                <div
                  className={cn(
                    "p-4 bg-white border-t border-slate-200 shadow-xl transition-all",
                    config.layout === "floating_bottom_left" && "m-3 rounded-[4px] border shadow-2xl max-w-sm",
                    config.layout === "floating_bottom_right" && "m-3 ml-auto rounded-[4px] border shadow-2xl max-w-sm",
                    config.layout === "center_modal" && "m-auto rounded-[4px] border shadow-2xl max-w-md"
                  )}
                >
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{config.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{config.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewTab("preferences_modal")}
                        className="px-4 py-2 text-xs font-bold rounded-[4px] border-2 border-[#1868db] text-[#1868db] bg-white hover:bg-slate-50 transition-colors shadow-2xs"
                        style={{ borderColor: config.primary_color, color: config.primary_color }}
                      >
                        {config.preferences_label}
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 text-xs font-bold rounded-[4px] text-white shadow-xs transition-colors"
                        style={{ backgroundColor: config.primary_color }}
                      >
                        {config.reject_all_label}
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 text-xs font-bold rounded-[4px] text-white shadow-xs transition-colors ml-auto"
                        style={{ backgroundColor: config.primary_color }}
                      >
                        {config.accept_all_label}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PREVIEW 2: PREFERENCES MODAL (COOKIE YES REPLICA)       */}
              {/* ======================================================== */}
              {previewTab === "preferences_modal" && (
                <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-3 animate-in fade-in-0">
                  <div className="bg-white rounded-[4px] shadow-2xl w-full max-w-[480px] max-h-[460px] flex flex-col overflow-hidden border border-slate-200">
                    {/* Modal Header */}
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
                      <h3 className="text-xs font-bold text-slate-900">Customise Consent Preferences</h3>
                      <button
                        type="button"
                        onClick={() => setPreviewTab("banner")}
                        className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Modal Body with 5 Accordions */}
                    <div className="p-4 overflow-y-auto space-y-2.5 text-[11px] text-slate-600 flex-1">
                      <p className="text-slate-500 leading-relaxed mb-2">
                        We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below.
                      </p>

                      {/* 1. Necessary */}
                      <div className="border-t border-slate-200 pt-2">
                        <div
                          className="flex items-center justify-between cursor-pointer py-1"
                          onClick={() => toggleMockAccordion("necessary")}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <ChevronRight className={cn("size-3 transition-transform text-slate-500", mockExpanded.necessary && "rotate-90")} />
                            Necessary
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600">Always Active</span>
                        </div>
                        {mockExpanded.necessary && (
                          <div className="pl-4 text-[10px] text-slate-500 leading-relaxed mt-1">
                            Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences.
                          </div>
                        )}
                      </div>

                      {/* 2. Functional */}
                      {config.enable_functional_category && (
                        <div className="border-t border-slate-200 pt-2">
                          <div className="flex items-center justify-between py-1">
                            <div
                              className="flex items-center gap-1.5 font-bold text-slate-900 cursor-pointer"
                              onClick={() => toggleMockAccordion("functional")}
                            >
                              <ChevronRight className={cn("size-3 transition-transform text-slate-500", mockExpanded.functional && "rotate-90")} />
                              Functional
                            </div>
                            <input
                              type="checkbox"
                              checked={mockSwitches.functional}
                              onChange={(e) => setMockSwitches({ ...mockSwitches, functional: e.target.checked })}
                              className="size-3.5 rounded text-[#1868db] focus:ring-[#1868db]"
                            />
                          </div>
                          {mockExpanded.functional && (
                            <div className="pl-4 text-[10px] text-slate-500 leading-relaxed mt-1">
                              Functional cookies help perform certain functionalities like sharing content on social media, collecting feedback, and third-party widgets.
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. Analytics */}
                      {config.enable_analytics_category && (
                        <div className="border-t border-slate-200 pt-2">
                          <div className="flex items-center justify-between py-1">
                            <div
                              className="flex items-center gap-1.5 font-bold text-slate-900 cursor-pointer"
                              onClick={() => toggleMockAccordion("analytics")}
                            >
                              <ChevronRight className={cn("size-3 transition-transform text-slate-500", mockExpanded.analytics && "rotate-90")} />
                              Analytics
                            </div>
                            <input
                              type="checkbox"
                              checked={mockSwitches.analytics}
                              onChange={(e) => setMockSwitches({ ...mockSwitches, analytics: e.target.checked })}
                              className="size-3.5 rounded text-[#1868db] focus:ring-[#1868db]"
                            />
                          </div>
                          {mockExpanded.analytics && (
                            <div className="pl-4 text-[10px] text-slate-500 leading-relaxed mt-1">
                              Analytical cookies are used to understand visitor interaction, bounce rate, traffic source, etc.
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4. Performance */}
                      {config.enable_performance_category && (
                        <div className="border-t border-slate-200 pt-2">
                          <div className="flex items-center justify-between py-1">
                            <div
                              className="flex items-center gap-1.5 font-bold text-slate-900 cursor-pointer"
                              onClick={() => toggleMockAccordion("performance")}
                            >
                              <ChevronRight className={cn("size-3 transition-transform text-slate-500", mockExpanded.performance && "rotate-90")} />
                              Performance
                            </div>
                            <input
                              type="checkbox"
                              checked={mockSwitches.performance}
                              onChange={(e) => setMockSwitches({ ...mockSwitches, performance: e.target.checked })}
                              className="size-3.5 rounded text-[#1868db] focus:ring-[#1868db]"
                            />
                          </div>
                          {mockExpanded.performance && (
                            <div className="pl-4 text-[10px] text-slate-500 leading-relaxed mt-1">
                              Performance cookies analyze key performance indexes of the website to deliver better user experience.
                            </div>
                          )}
                        </div>
                      )}

                      {/* 5. Advertisement */}
                      {config.enable_advertisement_category && (
                        <div className="border-t border-slate-200 pt-2">
                          <div className="flex items-center justify-between py-1">
                            <div
                              className="flex items-center gap-1.5 font-bold text-slate-900 cursor-pointer"
                              onClick={() => toggleMockAccordion("advertisement")}
                            >
                              <ChevronRight className={cn("size-3 transition-transform text-slate-500", mockExpanded.advertisement && "rotate-90")} />
                              Advertisement
                            </div>
                            <input
                              type="checkbox"
                              checked={mockSwitches.advertisement}
                              onChange={(e) => setMockSwitches({ ...mockSwitches, advertisement: e.target.checked })}
                              className="size-3.5 rounded text-[#1868db] focus:ring-[#1868db]"
                            />
                          </div>
                          {mockExpanded.advertisement && (
                            <div className="pl-4 text-[10px] text-slate-500 leading-relaxed mt-1">
                              Advertisement cookies are used to provide customized ads and measure campaign effectiveness.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Modal 3-Button Action Row (CookieYes Style) */}
                    <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTab("banner")}
                        className="flex-1 py-2.5 text-xs font-bold rounded-[4px] text-white shadow-xs"
                        style={{ backgroundColor: config.primary_color }}
                      >
                        Reject All
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab("banner")}
                        className="flex-1 py-2.5 text-xs font-bold rounded-[4px] text-white shadow-xs"
                        style={{ backgroundColor: config.primary_color }}
                      >
                        Save My Preferences
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab("banner")}
                        className="flex-1 py-2.5 text-xs font-bold rounded-[4px] text-white shadow-xs"
                        style={{ backgroundColor: config.primary_color }}
                      >
                        Accept All
                      </button>
                    </div>

                    {/* Watermark */}
                    <div className="px-4 py-1.5 bg-slate-100 border-t border-slate-200 text-right text-[10px] text-slate-500">
                      Powered by <strong className="text-slate-900">usrly</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PREVIEW 3: FLOATING REVISIT COOKIE BUTTON WIDGET         */}
              {/* ======================================================== */}
              {previewTab === "revisit_button" && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-[4px] p-3 text-xs text-slate-700 pointer-events-auto max-w-xs shadow-xs">
                    <strong className="text-slate-900">Floating Revisit Widget</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      After accepting or saving preferences, this button stays visible on your site so visitors can easily re-open and update consent at any time.
                    </p>
                  </div>

                  <div className={cn("flex", config.revisit_button_position === "bottom_right" ? "justify-end" : "justify-start")}>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("preferences_modal")}
                      className="size-11 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform pointer-events-auto"
                      style={{ backgroundColor: config.primary_color }}
                      title="Consent Preferences"
                    >
                      <Cookie className="size-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
