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
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"
import { useDomain } from "@/lib/domain-context"
import { fetchConsentConfig, saveConsentConfig, ConsentConfig } from "@/lib/api"

const COLOR_PRESETS = [
  { name: "Userly Blue", hex: "#1868db" },
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
    enable_gpc: true,
    consent_version: "1.0",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")
  const [previewTab, setPreviewTab] = useState<"banner" | "preferences_modal" | "revisit_button">("banner")
  const [activeSettingsTab, setActiveSettingsTab] = useState<"layout" | "content" | "categories" | "checks">("layout")

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
          enable_gpc: data.enable_gpc !== undefined ? data.enable_gpc : true,
          consent_version: data.consent_version || "1.0",
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
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      alert(err?.message || "Failed to save consent configuration.")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleMockAccordion = (key: string) => {
    setMockExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Dark pattern & compliance analysis
  const hasEqualProminence = Boolean(config.reject_all_label && config.reject_all_label.trim().length > 0)
  const hasRevisitButton = Boolean(config.show_revisit_button)
  const hasGPC = Boolean(config.enable_gpc)
  const complianceScore = (hasEqualProminence ? 35 : 0) + (hasRevisitButton ? 30 : 0) + (hasGPC ? 35 : 0)

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Banner Studio</h1>
            <span className="rounded-[4px] bg-blue-50 px-2 py-0.5 text-xs font-bold text-[#1868db] border border-blue-200">
              Live Preview
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Customize banner aesthetics, 5-category preferences modal, and verify compliance best practices for <strong className="text-neutral-800">{activeDomain || "your site"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
              <Check className="size-3.5" /> Saved & Published
            </span>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving || !activeDomain}
            className="rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 py-2 h-9 shadow-xs transition-all flex items-center gap-1.5"
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
          </Button>
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
                    { id: "bottom_bar", label: "Bottom Bar", desc: "Classic full-width bar" },
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

          {/* TAB 4: COMPLIANCE & GPC CHECKS */}
          {activeSettingsTab === "checks" && (
            <div className="rounded-[4px] border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">Compliance Health Check</div>
                  <div className="text-[11px] text-slate-500">Anti-Dark Pattern & Best Practice Audit</div>
                </div>
                <span className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-[4px] border",
                  complianceScore === 100
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-amber-50 text-amber-700 border-amber-300"
                )}>
                  {complianceScore}% Score
                </span>
              </div>

              {/* Check 1: Equal Prominence */}
              <div className="p-3 rounded-[4px] border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {hasEqualProminence ? (
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="size-3.5 text-amber-600" />
                    )}
                    Equal Prominence (Reject Button)
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]",
                    hasEqualProminence ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  )}>
                    {hasEqualProminence ? "Pass" : "Missing Label"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Clear, single-click &quot;Reject All&quot; button ensures parity with &quot;Accept All&quot; across European EDPB guidelines.
                </p>
              </div>

              {/* Check 2: Global Privacy Control (GPC) */}
              <div className="p-3 rounded-[4px] border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Global Privacy Control (GPC)</span>
                    <p className="text-[11px] text-slate-500">Auto-reject ad trackers when browser sends GPC signal</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enable_gpc !== false}
                    onChange={(e) => setConfig({ ...config, enable_gpc: e.target.checked })}
                    className="size-4 rounded text-[#1868db] focus:ring-[#1868db]"
                  />
                </div>
              </div>

              {/* Check 3: Consent Versioning */}
              <div className="p-3 rounded-[4px] border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Consent Version</span>
                    <p className="text-[11px] text-slate-500">Incrementing version triggers automatic re-consent across visitors</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={config.consent_version || "1.0"}
                      onChange={(e) => setConfig({ ...config, consent_version: e.target.value })}
                      className="w-14 px-2 py-1 text-xs font-mono font-bold text-center rounded-[4px] border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseFloat(config.consent_version || "1.0") || 1.0
                        setConfig({ ...config, consent_version: (current + 0.1).toFixed(1) })
                      }}
                      className="px-2 py-1 text-[10px] font-bold bg-[#1868db] text-white rounded-[4px] hover:bg-[#1559be]"
                    >
                      +0.1
                    </button>
                  </div>
                </div>
              </div>

              {/* Link to Cookie Scanner */}
              <div className="pt-2">
                <Link
                  href="/consent/scanner"
                  className="w-full inline-flex items-center justify-center gap-1.5 p-2 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
                >
                  <Cookie className="size-3.5 text-[#1868db]" />
                  Run Cookie & Pre-Consent Leak Scanner
                </Link>
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
                <>
                  {config.layout === "center_modal" ? (
                    <div className="absolute inset-0 z-20 bg-slate-950/45 backdrop-blur-2xs flex items-center justify-center p-3 animate-in fade-in-0">
                      <div className="bg-white rounded-[6px] shadow-2xl w-full max-w-[420px] p-4.5 border border-slate-200 space-y-3.5 animate-in zoom-in-95">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{config.title}</h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{config.description}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 w-full">
                          <button
                            type="button"
                            onClick={() => setPreviewTab("preferences_modal")}
                            className="w-full px-1.5 py-2 text-xs font-bold rounded-[4px] border-2 bg-white hover:bg-slate-50 transition-colors shadow-2xs text-center truncate"
                            style={{ borderColor: config.primary_color, color: config.primary_color }}
                          >
                            {config.preferences_label}
                          </button>
                          <button
                            type="button"
                            className="w-full px-1.5 py-2 text-xs font-bold rounded-[4px] text-white shadow-xs transition-colors text-center truncate"
                            style={{ backgroundColor: config.primary_color }}
                          >
                            {config.reject_all_label}
                          </button>
                          <button
                            type="button"
                            className="w-full px-1.5 py-2 text-xs font-bold rounded-[4px] text-white shadow-xs transition-colors text-center truncate"
                            style={{ backgroundColor: config.primary_color }}
                          >
                            {config.accept_all_label}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : config.layout === "bottom_bar" ? (
                    <div className="p-4 bg-white border-t border-slate-200 shadow-xl transition-all z-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <h4 className="text-xs font-bold text-slate-900">{config.title}</h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{config.description}</p>
                        </div>

                        <div className={cn(
                          previewDevice === "mobile" 
                            ? "grid grid-cols-3 gap-2 w-full pt-1" 
                            : "flex items-center gap-2 shrink-0"
                        )}>
                          <button
                            type="button"
                            onClick={() => setPreviewTab("preferences_modal")}
                            className="px-3.5 py-2 text-xs font-bold rounded-[4px] border-2 bg-white hover:bg-slate-50 transition-colors shadow-2xs text-center truncate"
                            style={{ borderColor: config.primary_color, color: config.primary_color }}
                          >
                            {config.preferences_label}
                          </button>
                          <button
                            type="button"
                            className="px-3.5 py-2 text-xs font-bold rounded-[4px] text-white shadow-xs transition-colors text-center truncate"
                            style={{ backgroundColor: config.primary_color }}
                          >
                            {config.reject_all_label}
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 text-xs font-bold rounded-[4px] text-white shadow-xs transition-colors text-center truncate"
                            style={{ backgroundColor: config.primary_color }}
                          >
                            {config.accept_all_label}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Floating Bottom Left & Floating Bottom Right */
                    <div
                      className={cn(
                        "p-4 bg-white rounded-[6px] border border-slate-200 shadow-2xl transition-all z-10 max-w-sm m-3 space-y-3",
                        config.layout === "floating_bottom_left" ? "mr-auto" : "ml-auto"
                      )}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{config.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{config.description}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 w-full">
                        <button
                          type="button"
                          onClick={() => setPreviewTab("preferences_modal")}
                          className="w-full px-1.5 py-2 text-xs font-bold rounded-[4px] border-2 bg-white hover:bg-slate-50 transition-colors shadow-2xs text-center truncate"
                          style={{ borderColor: config.primary_color, color: config.primary_color }}
                        >
                          {config.preferences_label}
                        </button>
                        <button
                          type="button"
                          className="w-full px-1.5 py-2 text-xs font-bold rounded-[4px] text-white shadow-xs transition-colors text-center truncate"
                          style={{ backgroundColor: config.primary_color }}
                        >
                          {config.reject_all_label}
                        </button>
                        <button
                          type="button"
                          className="w-full px-1.5 py-2 text-xs font-bold rounded-[4px] text-white shadow-xs transition-colors text-center truncate"
                          style={{ backgroundColor: config.primary_color }}
                        >
                          {config.accept_all_label}
                        </button>
                      </div>
                    </div>
                  )}
                </>
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

                    {/* Modal 3-Button Action Row */}
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
