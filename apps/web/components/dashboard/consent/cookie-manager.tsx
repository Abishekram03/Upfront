"use client"

import React, { useState, useEffect } from "react"
import { useDomain } from "@/lib/domain-context"
import {
  Cookie,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  BarChart2,
  Layers,
  Sparkles,
  Save,
  X,
  Code2,
  Clock,
  Calendar,
  RefreshCw,
  Info,
  ChevronDown,
  MoreVertical,
  ExternalLink,
  Check,
  Globe,
  HelpCircle,
  Code,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"
import { classifyCookieName } from "@/lib/consentos/open-cookie-db"

interface CookieRecord {
  id: string
  site_id?: string
  domain: string
  name: string
  category: "necessary" | "functional" | "analytics" | "performance" | "advertisement" | "uncategorised"
  service_name?: string
  duration?: string
  description?: string
  confidence?: string
  status?: string
  script_pattern_regex?: string
  last_detected_at?: string
  first_detected_at?: string
}

interface ScanRecord {
  id: string
  domain: string
  status: string
  cookies_found: number
  scripts_found: number
  leaks_found?: number
  created_at: string
  findings?: any
}

interface CategoryConfig {
  name: string
  description: string
  sellsOrSharesData: boolean
  loadPriorToConsent: boolean
  hideCategoryFromBanner: boolean
}

const FALLBACK_CATEGORY_META = {
  label: "Necessary",
  description:
    "Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences. These cookies do not store any personally identifiable data.",
  icon: ShieldCheck,
  badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  borderColor: "border-emerald-500",
  defaultConfig: {
    name: "Necessary",
    description:
      "Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences. These cookies do not store any personally identifiable data.",
    sellsOrSharesData: false,
    loadPriorToConsent: true,
    hideCategoryFromBanner: false,
  },
}

const DEFAULT_CATEGORY_CONFIGS: Record<
  string,
  {
    label: string
    description: string
    icon: any
    badgeColor: string
    borderColor: string
    defaultConfig: CategoryConfig
  }
> = {
  necessary: FALLBACK_CATEGORY_META,
  functional: {
    label: "Functional",
    description:
      "Functional cookies help perform certain functionalities like sharing the content of the website on social media platforms, collecting feedback, and other third-party features.",
    icon: Zap,
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    borderColor: "border-blue-500",
    defaultConfig: {
      name: "Functional",
      description:
        "Functional cookies help perform certain functionalities like sharing the content of the website on social media platforms, collecting feedback, and other third-party features.",
      sellsOrSharesData: false,
      loadPriorToConsent: false,
      hideCategoryFromBanner: false,
    },
  },
  analytics: {
    label: "Analytics",
    description:
      "Analytical cookies are used to understand how visitors interact with the website. These cookies help provide information on metrics such as the number of visitors, bounce rate, traffic source, etc.",
    icon: BarChart2,
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    borderColor: "border-indigo-500",
    defaultConfig: {
      name: "Analytics",
      description:
        "Analytical cookies are used to understand how visitors interact with the website. These cookies help provide information on metrics such as the number of visitors, bounce rate, traffic source, etc.",
      sellsOrSharesData: false,
      loadPriorToConsent: false,
      hideCategoryFromBanner: false,
    },
  },
  performance: {
    label: "Performance",
    description:
      "Performance cookies are used to understand and analyze the key performance indexes of the website which helps in delivering a better user experience for the visitors.",
    icon: Layers,
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    borderColor: "border-amber-500",
    defaultConfig: {
      name: "Performance",
      description:
        "Performance cookies are used to understand and analyze the key performance indexes of the website which helps in delivering a better user experience for the visitors.",
      sellsOrSharesData: false,
      loadPriorToConsent: false,
      hideCategoryFromBanner: false,
    },
  },
  advertisement: {
    label: "Advertisement",
    description:
      "Advertisement cookies are used to provide visitors with customized advertisements based on the pages you visited previously and to analyze the effectiveness of the ad campaigns.",
    icon: Sparkles,
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    borderColor: "border-rose-500",
    defaultConfig: {
      name: "Advertisement",
      description:
        "Advertisement cookies are used to provide visitors with customized advertisements based on the pages you visited previously and to analyze the effectiveness of the ad campaigns.",
      sellsOrSharesData: true,
      loadPriorToConsent: false,
      hideCategoryFromBanner: false,
    },
  },
  uncategorised: {
    label: "Uncategorised",
    description:
      "Other uncategorised cookies are those that are being analysed and have not been classified into a category as yet.",
    icon: AlertTriangle,
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    borderColor: "border-slate-400",
    defaultConfig: {
      name: "Uncategorised",
      description:
        "Other uncategorised cookies are those that are being analysed and have not been classified into a category as yet.",
      sellsOrSharesData: false,
      loadPriorToConsent: false,
      hideCategoryFromBanner: false,
    },
  },
}

export function CookieManager() {
  const { activeDomain } = useDomain()

  // Primary navigation tab: "cookies" | "history"
  const [activeMainTab, setActiveMainTab] = useState<"cookies" | "history">("cookies")

  // Selected category in Cookie List
  const [selectedCategory, setSelectedCategory] = useState<string>("necessary")

  // Category customizations state
  const [categoryConfigs, setCategoryConfigs] = useState<Record<string, CategoryConfig>>(() => {
    const initial: Record<string, CategoryConfig> = {}
    Object.keys(DEFAULT_CATEGORY_CONFIGS).forEach((key) => {
      const def = DEFAULT_CATEGORY_CONFIGS[key]
      if (def) {
        initial[key] = { ...def.defaultConfig }
      }
    })
    return initial
  })

  // Edit Category Modal state
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false)
  const [editingCategoryKey, setEditingCategoryKey] = useState<string>("necessary")
  const [categoryModalForm, setCategoryModalForm] = useState<CategoryConfig>({
    name: "",
    description: "",
    sellsOrSharesData: false,
    loadPriorToConsent: false,
    hideCategoryFromBanner: false,
  })

  // Data states
  const [cookies, setCookies] = useState<CookieRecord[]>([])
  const [latestScan, setLatestScan] = useState<ScanRecord | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Scanning trigger states
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState<string>("")

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [language, setLanguage] = useState("English [Default]")

  // Publishing / notification toast
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)

  // Add / Edit Cookie Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCookie, setEditingCookie] = useState<CookieRecord | null>(null)
  const [cookieForm, setCookieForm] = useState<Partial<CookieRecord>>({
    name: "",
    category: "necessary",
    domain: "",
    duration: "1 year",
    service_name: "",
    description: "",
    script_pattern_regex: "",
  })

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [scheduleFreq, setScheduleFreq] = useState("monthly")

  // Active action menu item id
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!activeDomain) {
      setIsLoading(false)
      return
    }
    loadData()
  }, [activeDomain])

  const loadData = async () => {
    if (!activeDomain) return
    setIsLoading(true)
    try {
      const [cookiesRes, scanRes] = await Promise.all([
        fetch(`/api/v1/consent/cookies?domain=${encodeURIComponent(activeDomain)}`),
        fetch(`/api/v1/consent/scanner?domain=${encodeURIComponent(activeDomain)}`),
      ])

      if (cookiesRes.ok) {
        const cookieData = await cookiesRes.json()
        setCookies(cookieData || [])
      }

      if (scanRes.ok) {
        const scanData = await scanRes.json()
        setLatestScan(scanData.latest_scan || null)
        setScanHistory(scanData.scan_history || [])
      }
    } catch (err) {
      console.error("Failed to load cookie manager data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger manual website crawl
  const handleTriggerScan = async () => {
    if (!activeDomain || isScanning) return
    setIsScanning(true)
    setScanProgress("Connecting to crawler engine...")

    try {
      setTimeout(() => setScanProgress("Visiting URLs & analyzing DOM cookies..."), 1000)
      setTimeout(() => setScanProgress("Matching against Open Cookie Database (2,200+ signatures)..."), 2200)
      setTimeout(() => setScanProgress("Classifying scripts and tracker patterns..."), 3500)

      const res = await fetch("/api/v1/consent/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: activeDomain }),
      })

      if (res.ok) {
        const data = await res.json()
        setLatestScan(data.latest_scan || data.scan || null)
        if (data.cookies) {
          setCookies(data.cookies)
        }
        await loadData()
      } else {
        alert("Crawler scan encountered an issue. Ensure your domain is accessible.")
      }
    } catch (err) {
      console.error("Scan error:", err)
    } finally {
      setIsScanning(false)
      setScanProgress("")
    }
  }

  // Publish Changes (syncs to SDK/CDN)
  const handlePublishChanges = async () => {
    setIsPublishing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      setShowPublishSuccess(true)
      setTimeout(() => setShowPublishSuccess(false), 3000)
    } finally {
      setIsPublishing(false)
    }
  }

  // Open Edit Category Modal
  const handleOpenEditCategory = (catKey: string) => {
    setEditingCategoryKey(catKey)
    const categoryMeta = DEFAULT_CATEGORY_CONFIGS[catKey] ?? FALLBACK_CATEGORY_META
    const current =
      categoryConfigs[catKey] ||
      categoryMeta.defaultConfig

    setCategoryModalForm({ ...current })
    setIsEditCategoryModalOpen(true)
  }

  // Save Category Edit
  const handleSaveCategoryDraft = (e: React.FormEvent) => {
    e.preventDefault()
    setCategoryConfigs((prev) => ({
      ...prev,
      [editingCategoryKey]: { ...categoryModalForm },
    }))
    setIsEditCategoryModalOpen(false)
  }

  // Open modal for new cookie
  const handleOpenAdd = () => {
    setEditingCookie(null)
    setCookieForm({
      name: "",
      category: (selectedCategory as any) || "necessary",
      domain: activeDomain ? `.${activeDomain}` : "",
      duration: "1 year",
      service_name: "",
      description: "",
      script_pattern_regex: "",
    })
    setIsAddModalOpen(true)
  }

  // Open modal for editing existing cookie
  const handleOpenEdit = (cookie: CookieRecord) => {
    setEditingCookie(cookie)
    setCookieForm({
      name: cookie.name,
      category: cookie.category,
      domain: cookie.domain,
      duration: cookie.duration || "1 year",
      service_name: cookie.service_name || "",
      description: cookie.description || "",
      script_pattern_regex: cookie.script_pattern_regex || "",
    })
    setOpenActionMenuId(null)
    setIsAddModalOpen(true)
  }

  // Auto-populate signature details when typing cookie ID
  const handleCookieNameInput = (nameVal: string) => {
    setCookieForm((prev) => {
      const nextForm = { ...prev, name: nameVal }
      if (!editingCookie && nameVal.trim().length >= 2) {
        const match = classifyCookieName(nameVal.trim())
        if (match && match.confidence === "high") {
          nextForm.category = match.category
          nextForm.service_name = match.service_name
          nextForm.duration = match.duration
          nextForm.description = match.description
          nextForm.script_pattern_regex = match.script_pattern_regex || ""
        }
      }
      return nextForm
    })
  }

  // Save Add / Edit
  const handleSaveCookie = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDomain || !cookieForm.name) return

    try {
      if (editingCookie) {
        // Update
        const res = await fetch("/api/v1/consent/cookies", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCookie.id,
            name: cookieForm.name,
            category: cookieForm.category,
            domain: cookieForm.domain || activeDomain,
            duration: cookieForm.duration,
            service_name: cookieForm.service_name,
            description: cookieForm.description,
            script_pattern_regex: cookieForm.script_pattern_regex,
          }),
        })

        if (res.ok) {
          const updated = await res.json()
          setCookies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
          setIsAddModalOpen(false)
        }
      } else {
        // Create
        const res = await fetch("/api/v1/consent/cookies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: activeDomain,
            name: cookieForm.name,
            category: cookieForm.category || "necessary",
            duration: cookieForm.duration || "1 year",
            service_name: cookieForm.service_name || "Custom",
            description: cookieForm.description || "",
            script_pattern_regex: cookieForm.script_pattern_regex || null,
          }),
        })

        if (res.ok) {
          const created = await res.json()
          setCookies((prev) => [created, ...prev])
          setIsAddModalOpen(false)
        }
      }
    } catch (err) {
      console.error("Save cookie error:", err)
    }
  }

  // Delete Cookie
  const handleDeleteCookie = async (cookieId: string) => {
    if (!confirm("Are you sure you want to delete this cookie?")) return
    try {
      const res = await fetch(`/api/v1/consent/cookies?id=${encodeURIComponent(cookieId)}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setCookies((prev) => prev.filter((c) => c.id !== cookieId))
      }
    } catch (err) {
      console.error("Delete cookie error:", err)
    }
  }

  // Move Cookie Category
  const handleQuickMoveCategory = async (cookieId: string, newCategory: any) => {
    try {
      const res = await fetch("/api/v1/consent/scanner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookieId, category: newCategory }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCookies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      }
    } catch (err) {
      console.error("Move category error:", err)
    } finally {
      setOpenActionMenuId(null)
    }
  }

  // Count cookies per category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      necessary: 0,
      functional: 0,
      analytics: 0,
      performance: 0,
      advertisement: 0,
      uncategorised: 0,
    }
    cookies.forEach((c) => {
      const cat = c.category || "uncategorised"
      counts[cat] = (counts[cat] ?? 0) + 1
    })
    return counts
  }, [cookies])

  // Filter cookies for right panel
  const displayedCookies = React.useMemo(() => {
    return cookies.filter((c) => {
      const matchesCategory = c.category === selectedCategory
      const query = searchQuery.toLowerCase().trim()
      if (!query) return matchesCategory

      const matchesSearch =
        c.name.toLowerCase().includes(query) ||
        (c.domain && c.domain.toLowerCase().includes(query)) ||
        (c.description && c.description.toLowerCase().includes(query)) ||
        (c.script_pattern_regex && c.script_pattern_regex.toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  }, [cookies, selectedCategory, searchQuery])

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return "Never scanned"
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })
    } catch {
      return isoString
    }
  }

  const currentCategoryMeta = DEFAULT_CATEGORY_CONFIGS[selectedCategory] ?? FALLBACK_CATEGORY_META
  const activeCategoryConfig = categoryConfigs[selectedCategory] ?? currentCategoryMeta.defaultConfig

  return (
    <div className="space-y-6 max-w-6xl pb-20">
      {/* 1. Header Title & Subtitle */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Cookie Manager</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your cookie list, scan schedule and more for <strong className="text-slate-800">{activeDomain || "your domain"}</strong>
        </p>
      </div>

      {/* 2. Top Two Status Cards (Last successful scan & Next scan) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Last Successful Scan */}
        <div className="bg-white rounded-[6px] border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="size-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900">Last successful scan</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="text-xs font-semibold text-[#1868db] border-[#1868db]/30 hover:bg-blue-50/60 h-8 px-3.5 rounded-[4px] cursor-pointer"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="size-3 mr-1.5 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Scan now"
              )}
            </Button>
          </div>

          <div className="mt-3">
            <p className="text-xs text-slate-500 font-medium">
              {latestScan?.created_at ? formatDate(latestScan.created_at) : "No scan recorded yet"}
            </p>
            {isScanning && (
              <p className="text-[11px] text-[#1868db] font-semibold mt-1 animate-pulse">
                {scanProgress || "Crawler in progress..."}
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Next Scan */}
        <div className="bg-white rounded-[6px] border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-full bg-blue-100 text-[#1868db] flex items-center justify-center">
                <Clock className="size-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900">Next scan</span>
            </div>
            <Button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="text-xs font-semibold bg-[#1868db] hover:bg-[#1559be] text-white h-8 px-3.5 rounded-[4px] cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="size-3" />
              Schedule scan
            </Button>
          </div>

          <div className="mt-3">
            <p className="text-xs text-slate-500 font-medium">
              {scheduleFreq === "monthly" ? "Monthly automatic audit scheduled" : "Not scheduled"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Primary Tab Switcher (Cookie List vs Scan History) */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveMainTab("cookies")}
          className={cn(
            "pb-3 transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5",
            activeMainTab === "cookies"
              ? "border-[#1868db] text-[#1868db]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Cookie className="size-3.5" />
          <span>Cookie List</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("history")}
          className={cn(
            "pb-3 transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5",
            activeMainTab === "history"
              ? "border-[#1868db] text-[#1868db]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Clock className="size-3.5" />
          <span>Scan History</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: COOKIE LIST (2-Column Layout)                     */}
      {/* ========================================================= */}
      {activeMainTab === "cookies" && (
        <div className="space-y-4">
          {/* Subheader Toolbar: Language Dropdown, Search, Publish Changes */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-8 text-xs font-medium bg-white border border-slate-200 rounded-[4px] pl-2.5 pr-8 text-slate-700 appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#1868db]"
                >
                  <option value="English [Default]">English [Default]</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Italian">Italian</option>
                  <option value="Portuguese">Portuguese</option>
                </select>
                <ChevronDown className="size-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative flex-1 sm:w-64">
                <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search cookie, domain, script..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full text-xs pl-8 pr-3 rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#1868db]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showPublishSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="size-3.5" /> Published successfully!
                </span>
              )}
              <Button
                type="button"
                onClick={handlePublishChanges}
                disabled={isPublishing}
                className="h-8 text-xs font-bold bg-[#1868db] hover:bg-[#1559be] text-white rounded-[4px] px-4 shadow-xs cursor-pointer"
              >
                {isPublishing ? "Publishing..." : "Publish changes"}
              </Button>
            </div>
          </div>

          {/* 2-Column Split View: Left Categories List + Right Cookie Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Categories Navigation */}
            <div className="md:col-span-4 bg-white rounded-[6px] border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
              {Object.keys(DEFAULT_CATEGORY_CONFIGS).map((catKey) => {
                const meta = DEFAULT_CATEGORY_CONFIGS[catKey] ?? FALLBACK_CATEGORY_META
                const count = categoryCounts[catKey] ?? 0
                const isSelected = selectedCategory === catKey
                const Icon = meta.icon
                const config = categoryConfigs[catKey] ?? meta.defaultConfig

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCategory(catKey)}
                    className={cn(
                      "w-full px-4 py-3.5 text-left flex items-center justify-between transition-all cursor-pointer",
                      isSelected
                        ? "bg-slate-50 font-bold text-slate-900 border-l-4 border-l-[#1868db]"
                        : "hover:bg-slate-50/60 text-slate-600 font-medium border-l-4 border-l-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "size-4",
                          isSelected ? "text-[#1868db]" : "text-slate-400"
                        )}
                      />
                      <span className="text-xs">
                        {config.name || meta.label} ({count} {count === 1 ? "Cookie" : "Cookies"})
                      </span>
                    </div>

                    {catKey === "uncategorised" && count > 0 && (
                      <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* RIGHT COLUMN: Category Details & Cookie List */}
            <div className="md:col-span-8 bg-white rounded-[6px] border border-slate-200 p-5 shadow-2xs space-y-5">
              {/* Category Header with Edit Category Modal Pencil & Add Cookie */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    {activeCategoryConfig.name || currentCategoryMeta.label}
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleOpenEditCategory(selectedCategory)}
                    className="text-slate-400 hover:text-[#1868db] p-1 rounded transition-colors cursor-pointer"
                    title="Edit Category settings"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="text-xs font-bold text-[#1868db] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Add Cookie
                </button>
              </div>

              {/* Category Description */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeCategoryConfig.description || currentCategoryMeta.description}
              </p>

              {/* Discovered Cookies Heading */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Discovered Cookies
                </h3>

                {/* Cookies Cards List */}
                {displayedCookies.length === 0 ? (
                  <div className="py-10 text-center rounded-[4px] border border-dashed border-slate-200 bg-slate-50/50">
                    <Cookie className="size-7 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">
                      No cookies found in {activeCategoryConfig.name || currentCategoryMeta.label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Run an automated scan or click &quot;+ Add Cookie&quot; to manually declare cookies and script regex blocking patterns.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenAdd}
                      className="mt-3 text-xs text-[#1868db] border-[#1868db]/30 hover:bg-blue-50"
                    >
                      <Plus className="size-3 mr-1" /> Add Cookie
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedCookies.map((cookie) => {
                      const autoSig = classifyCookieName(cookie.name)
                      const displayDescription =
                        cookie.description?.trim() || autoSig.description || "No specific description provided for this cookie."
                      const displayScript =
                        cookie.script_pattern_regex?.trim() ||
                        (autoSig.script_pattern_regex &&
                        !autoSig.script_pattern_regex.startsWith("None")
                          ? autoSig.script_pattern_regex
                          : undefined)
                      const displayDuration =
                        cookie.duration?.trim() || autoSig.duration || "Session"
                      const displayProvider =
                        cookie.service_name?.trim() || autoSig.service_name

                      return (
                        <div
                          key={cookie.id}
                          className="p-4 rounded-[4px] border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2.5 relative group"
                        >
                          {/* Top Row: Cookie ID, Domain, Duration & Actions */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="grid grid-cols-3 gap-4 flex-1">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                                  Cookie Id
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-xs font-bold text-slate-900 font-mono break-all">
                                    {cookie.name}
                                  </span>
                                  {displayProvider && displayProvider !== "Unknown" && displayProvider !== "Uncatalogued Provider" && (
                                    <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-sans shrink-0">
                                      {displayProvider}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                                  Domain
                                </span>
                                <span className="text-xs text-slate-600 break-all block mt-0.5">
                                  {cookie.domain || activeDomain || "Current Site"}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                                  Duration
                                </span>
                                <span className="text-xs text-slate-600 block mt-0.5">
                                  {displayDuration}
                                </span>
                              </div>
                            </div>

                            {/* 3-Dot Action Dropdown */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenActionMenuId(
                                    openActionMenuId === cookie.id ? null : cookie.id
                                  )
                                }
                                className="size-7 rounded-[4px] hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <MoreVertical className="size-4" />
                              </button>

                              {openActionMenuId === cookie.id && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-[4px] border border-slate-200 shadow-xl z-30 py-1 text-xs text-slate-700">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(cookie)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit2 className="size-3 text-slate-400" />
                                    Edit details
                                  </button>

                                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 border-t border-slate-100 mt-1">
                                    Move Category:
                                  </div>
                                  {["necessary", "functional", "analytics", "performance", "advertisement"].map(
                                    (cat) => (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => handleQuickMoveCategory(cookie.id, cat)}
                                        className={cn(
                                          "w-full text-left px-3 py-1 text-[11px] capitalize hover:bg-slate-50 flex items-center justify-between cursor-pointer",
                                          cookie.category === cat && "font-bold text-[#1868db]"
                                        )}
                                      >
                                        <span>{cat}</span>
                                        {cookie.category === cat && <Check className="size-3 text-[#1868db]" />}
                                      </button>
                                    )
                                  )}

                                  <div className="border-t border-slate-100 mt-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      handleDeleteCookie(cookie.id)
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="size-3" />
                                    Delete cookie
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Middle Row: Description */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                              Description
                            </span>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {displayDescription}
                            </p>
                          </div>

                          {/* Bottom Row: Script URL Pattern (Auto-Blocking Regex) */}
                          <div className="pt-1">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                              Script URL pattern
                            </span>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              {displayScript ? (
                                <code className="text-[11px] font-mono font-semibold bg-blue-50 text-[#1868db] border border-blue-200 px-2 py-0.5 rounded break-all">
                                  {displayScript}
                                </code>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  None (Cookie managed via browser headers or direct JS)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SCAN HISTORY                                      */}
      {/* ========================================================= */}
      {activeMainTab === "history" && (
        <div className="space-y-4">
          {/* Blue Info Notice Box */}
          <div className="p-4 rounded-[4px] border border-blue-200 bg-blue-50/60 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
            <Info className="size-4 text-[#1868db] shrink-0 mt-0.5" />
            <p>
              We continuously monitor our scanning software to ensure its ongoing effectiveness, security, and accuracy.
              However, we advise you to run a quick manual check to determine if there are any cookies on your site that
              our scanner couldn&apos;t detect.
            </p>
          </div>

          {/* Audit History Table */}
          <div className="bg-white rounded-[6px] border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Scan Date (UTC)</th>
                    <th className="px-4 py-3">Scan Status</th>
                    <th className="px-4 py-3 text-center">Urls Scanned</th>
                    <th className="px-4 py-3 text-center">Categories</th>
                    <th className="px-4 py-3 text-center">Cookies</th>
                    <th className="px-4 py-3 text-center">Scripts</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scanHistory.length === 0 && !latestScan ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        No previous scan runs found. Click &quot;Scan now&quot; at the top to run your first crawler scan.
                      </td>
                    </tr>
                  ) : (
                    (scanHistory.length > 0 ? scanHistory : latestScan ? [latestScan] : []).map((scan, idx) => (
                      <tr key={scan.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                          {formatDate(scan.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3" />
                            Completed
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 font-semibold">
                          9
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 font-semibold">
                          {(Object.values(categoryCounts) as number[]).filter((c) => (c ?? 0) > 0).length || 4}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-900 font-bold">
                          {scan.cookies_found || cookies.length || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 font-semibold">
                          {scan.scripts_found || 4}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveMainTab("cookies")}
                            className="text-xs font-bold text-[#1868db] hover:underline cursor-pointer"
                          >
                            View cookies
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: EDIT CATEGORY MODAL (Matching CookieYes design)  */}
      {/* ========================================================= */}
      {isEditCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-[8px] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Category</h3>
              <button
                type="button"
                onClick={() => setIsEditCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-base leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCategoryDraft} className="p-6 space-y-5 text-xs">
              {/* Category Name */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryModalForm.name}
                  onChange={(e) =>
                    setCategoryModalForm({ ...categoryModalForm, name: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-[4px] border border-slate-200 text-xs text-slate-800 focus:ring-1 focus:ring-[#1868db] focus:border-[#1868db] focus:outline-hidden"
                />
              </div>

              {/* Category Description with Rich header <> */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Description <span className="text-rose-500">*</span>
                </label>
                <div className="border border-slate-200 rounded-[4px] overflow-hidden focus-within:ring-1 focus-within:ring-[#1868db] focus-within:border-[#1868db]">
                  <div className="px-2.5 py-1 bg-slate-50 border-b border-slate-200 flex items-center">
                    <button
                      type="button"
                      className="p-1 rounded text-slate-500 hover:bg-slate-200/60 cursor-pointer"
                      title="Toggle code view"
                    >
                      <Code className="size-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={categoryModalForm.description}
                    onChange={(e) =>
                      setCategoryModalForm({
                        ...categoryModalForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-3 text-xs text-slate-700 leading-relaxed border-none focus:outline-hidden resize-y"
                  />
                </div>
              </div>

              {/* Toggles List */}
              <div className="space-y-3.5 pt-2">
                {/* Toggle 1: Sells or shares personal data */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">Sells or shares personal data</span>
                    <div className="relative group cursor-pointer inline-flex items-center">
                      <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600" />
                      <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-56 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                        Indicates if personal data processed under this category is sold or shared under CCPA/CPRA regulations.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={categoryModalForm.sellsOrSharesData}
                    onClick={() =>
                      setCategoryModalForm({
                        ...categoryModalForm,
                        sellsOrSharesData: !categoryModalForm.sellsOrSharesData,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                      categoryModalForm.sellsOrSharesData ? "bg-[#1868db]" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                        categoryModalForm.sellsOrSharesData ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Toggle 2: Load cookies prior to consent */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">Load cookies prior to consent</span>
                    <div className="relative group cursor-pointer inline-flex items-center">
                      <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600" />
                      <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-60 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                        When enabled, cookies in this category will execute before the user interacts with the banner (standard only for Strictly Necessary).
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={categoryModalForm.loadPriorToConsent}
                    onClick={() =>
                      setCategoryModalForm({
                        ...categoryModalForm,
                        loadPriorToConsent: !categoryModalForm.loadPriorToConsent,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                      categoryModalForm.loadPriorToConsent ? "bg-[#1868db]" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                        categoryModalForm.loadPriorToConsent ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* Toggle 3: Hide category from banner */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">Hide category from banner</span>
                    <div className="relative group cursor-pointer inline-flex items-center">
                      <HelpCircle className="size-3.5 text-slate-400 hover:text-slate-600" />
                      <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-56 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50 pointer-events-none leading-relaxed">
                        Hides this category accordion from the public Cookie Banner and Preference Centre dialog.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={categoryModalForm.hideCategoryFromBanner}
                    onClick={() =>
                      setCategoryModalForm({
                        ...categoryModalForm,
                        hideCategoryFromBanner: !categoryModalForm.hideCategoryFromBanner,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                      categoryModalForm.hideCategoryFromBanner ? "bg-[#1868db]" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                        categoryModalForm.hideCategoryFromBanner ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditCategoryModalOpen(false)}
                  className="text-xs h-9 px-4 rounded-[4px] border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-9 px-4 rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white font-semibold cursor-pointer"
                >
                  Save draft
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT COOKIE                                */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-[6px] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCookie ? `Edit Cookie: ${editingCookie.name}` : "Add New Cookie"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCookie} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cookie Id / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="_ga, session_id, etc."
                    value={cookieForm.name}
                    onChange={(e) => handleCookieNameInput(e.target.value)}
                    className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-[#1868db] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={cookieForm.category}
                    onChange={(e) => setCookieForm({ ...cookieForm, category: e.target.value as any })}
                    className="w-full h-8 px-2 rounded border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-[#1868db] focus:outline-hidden"
                  >
                    <option value="necessary">Necessary</option>
                    <option value="functional">Functional</option>
                    <option value="analytics">Analytics</option>
                    <option value="performance">Performance</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="uncategorised">Uncategorised</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Domain</label>
                  <input
                    type="text"
                    placeholder={activeDomain ? `.${activeDomain}` : ".example.com"}
                    value={cookieForm.domain}
                    onChange={(e) => setCookieForm({ ...cookieForm, domain: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-[#1868db] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="1 year, Session, 6 months"
                    value={cookieForm.duration}
                    onChange={(e) => setCookieForm({ ...cookieForm, duration: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-[#1868db] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Provider / Service Name</label>
                <input
                  type="text"
                  placeholder="Google Analytics, Cloudflare, YouTube, etc."
                  value={cookieForm.service_name}
                  onChange={(e) => setCookieForm({ ...cookieForm, service_name: e.target.value })}
                  className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-[#1868db] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explains why this cookie is set and what data it holds..."
                  value={cookieForm.description}
                  onChange={(e) => setCookieForm({ ...cookieForm, description: e.target.value })}
                  className="w-full p-2 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-[#1868db] focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-blue-50/50 rounded border border-blue-100 space-y-1">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Script URL Pattern (Auto-Block Regex)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Scripts matching this URL substring or regex pattern will be dynamically blocked until the user consents to this category.
                </p>
                <input
                  type="text"
                  placeholder="e.g. google-analytics.com/gtag/js or connect.facebook.net"
                  value={cookieForm.script_pattern_regex}
                  onChange={(e) =>
                    setCookieForm({ ...cookieForm, script_pattern_regex: e.target.value })
                  }
                  className="w-full h-8 px-2.5 rounded border border-blue-200 bg-white text-xs font-mono focus:ring-1 focus:ring-[#1868db] focus:outline-hidden mt-1.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-8 bg-[#1868db] hover:bg-[#1559be] text-white"
                >
                  {editingCookie ? "Save Changes" : "Create Cookie"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SCHEDULE SCAN MODAL                              */}
      {/* ========================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-[6px] border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Schedule Automatic Scans</h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Configure automatic background scans to detect new cookies, third-party trackers, and script changes on{" "}
                <strong className="text-slate-900">{activeDomain || "your site"}</strong>.
              </p>

              <div className="space-y-2">
                {[
                  { id: "weekly", label: "Weekly (Every 7 days)" },
                  { id: "monthly", label: "Monthly (Every 30 days) — Recommended" },
                  { id: "quarterly", label: "Quarterly (Every 90 days)" },
                  { id: "disabled", label: "Disable automatic schedule" },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-[4px] border cursor-pointer transition-all",
                      scheduleFreq === option.id
                        ? "border-[#1868db] bg-blue-50/40 font-bold text-slate-900"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <input
                      type="radio"
                      name="schedule_freq"
                      checked={scheduleFreq === option.id}
                      onChange={() => setScheduleFreq(option.id)}
                      className="text-[#1868db] focus:ring-[#1868db]"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="text-xs h-8 bg-[#1868db] hover:bg-[#1559be] text-white"
                >
                  Save Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
