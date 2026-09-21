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
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"

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
}

const CATEGORY_COLORS: Record<string, { badge: string; border: string; icon: any }> = {
  necessary: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", border: "border-l-emerald-500", icon: ShieldCheck },
  functional: { badge: "bg-blue-50 text-blue-700 border-blue-200", border: "border-l-blue-500", icon: Zap },
  analytics: { badge: "bg-purple-50 text-purple-700 border-purple-200", border: "border-l-purple-500", icon: BarChart2 },
  performance: { badge: "bg-amber-50 text-amber-700 border-amber-200", border: "border-l-amber-500", icon: Layers },
  advertisement: { badge: "bg-rose-50 text-rose-700 border-rose-200", border: "border-l-rose-500", icon: Sparkles },
  uncategorised: { badge: "bg-slate-100 text-slate-700 border-slate-300", border: "border-l-slate-400", icon: AlertTriangle },
}

export function CookieManager() {
  const { activeDomain } = useDomain()
  const [cookies, setCookies] = useState<CookieRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [editingCookie, setEditingCookie] = useState<CookieRecord | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // New Cookie Form State
  const [newCookie, setNewCookie] = useState<Partial<CookieRecord>>({
    name: "",
    category: "functional",
    service_name: "",
    duration: "1 year",
    description: "",
    script_pattern_regex: "",
  })

  useEffect(() => {
    if (!activeDomain) {
      setIsLoading(false)
      return
    }
    fetchCookies()
  }, [activeDomain])

  const fetchCookies = async () => {
    if (!activeDomain) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/v1/consent/cookies?domain=${encodeURIComponent(activeDomain)}`)
      if (res.ok) {
        const data = await res.json()
        setCookies(data || [])
      }
    } catch (err) {
      console.error("Failed to load cookies:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingCookie) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/consent/cookies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingCookie,
          domain: activeDomain,
        }),
      })
      if (res.ok) {
        await fetchCookies()
        setEditingCookie(null)
      } else {
        alert("Failed to update cookie details.")
      }
    } catch (err) {
      console.error("Error updating cookie:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateCookie = async () => {
    if (!newCookie.name || !activeDomain) {
      alert("Please provide a valid cookie name.")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/v1/consent/cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCookie,
          domain: activeDomain,
        }),
      })
      if (res.ok) {
        await fetchCookies()
        setIsAddingNew(false)
        setNewCookie({
          name: "",
          category: "functional",
          service_name: "",
          duration: "1 year",
          description: "",
          script_pattern_regex: "",
        })
      } else {
        alert("Failed to create cookie.")
      }
    } catch (err) {
      console.error("Error creating cookie:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCookie = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete cookie "${name}"?`)) return
    try {
      const res = await fetch(`/api/v1/consent/cookies?id=${id}&domain=${encodeURIComponent(activeDomain || "")}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setCookies((prev) => prev.filter((c) => c.id !== id))
      }
    } catch (err) {
      console.error("Error deleting cookie:", err)
    }
  }

  const filteredCookies = cookies.filter((c) => {
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.service_name && c.service_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const categoryCounts = {
    all: cookies.length,
    necessary: cookies.filter((c) => c.category === "necessary").length,
    functional: cookies.filter((c) => c.category === "functional").length,
    analytics: cookies.filter((c) => c.category === "analytics").length,
    performance: cookies.filter((c) => c.category === "performance").length,
    advertisement: cookies.filter((c) => c.category === "advertisement").length,
    uncategorised: cookies.filter((c) => c.category === "uncategorised").length,
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Cookie className="size-5 text-[#1868db]" />
            <h2 className="text-base font-bold text-slate-900">Discovered Cookies & Trackers</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {cookies.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage cookie categories, durations, descriptions, and automatic script blocking regexes for{" "}
            <strong className="text-slate-700">{activeDomain || "your domain"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddingNew(true)}
            className="rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold px-3.5 py-1.5 h-8.5 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            Add Cookie
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "all", label: "All Cookies", count: categoryCounts.all },
          { key: "necessary", label: "Necessary", count: categoryCounts.necessary },
          { key: "functional", label: "Functional", count: categoryCounts.functional },
          { key: "analytics", label: "Analytics", count: categoryCounts.analytics },
          { key: "performance", label: "Performance", count: categoryCounts.performance },
          { key: "advertisement", label: "Advertisement", count: categoryCounts.advertisement },
          ...(categoryCounts.uncategorised > 0
            ? [{ key: "uncategorised", label: "Uncategorised ⚠", count: categoryCounts.uncategorised }]
            : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedCategory(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border",
              selectedCategory === tab.key
                ? "bg-[#1868db] text-white border-[#1868db]"
                : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full",
                selectedCategory === tab.key ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="relative">
        <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search cookies by name, provider, or purpose..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-[4px] text-xs focus:outline-hidden focus:border-[#1868db]"
        />
      </div>

      {/* Cookie Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading discovered cookies...</div>
        ) : filteredCookies.length === 0 ? (
          <div className="p-12 text-center">
            <Cookie className="size-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700">No cookies found in this category</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Run a website scan or manually click &quot;Add Cookie&quot; to populate your catalog.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                  <th className="py-2.5 px-4">Cookie ID</th>
                  <th className="py-2.5 px-4">Provider / Service</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Purpose Description</th>
                  <th className="py-2.5 px-4">Script Auto-Blocker</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCookies.map((c) => {
                  const catStyle = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.functional
                  const Icon = catStyle.icon
                  return (
                    <tr key={c.id || c.name} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{c.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {c.service_name || "Custom"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border",
                            catStyle.badge
                          )}
                        >
                          <Icon className="size-3" />
                          {c.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{c.duration || "Session"}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={c.description}>
                        {c.description || "No description provided."}
                      </td>
                      <td className="py-3 px-4">
                        {c.script_pattern_regex ? (
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[120px] inline-block">
                            /{c.script_pattern_regex}/
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingCookie(c)}
                            title="Edit Cookie"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCookie(c.id, c.name)}
                            title="Delete Cookie"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Cookie Modal */}
      {editingCookie && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Cookie className="size-4 text-[#1868db]" />
                <h3 className="text-sm font-bold text-slate-900">Edit Cookie: {editingCookie.name}</h3>
              </div>
              <button
                onClick={() => setEditingCookie(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={editingCookie.category}
                  onChange={(e) =>
                    setEditingCookie({ ...editingCookie, category: e.target.value as any })
                  }
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
                >
                  <option value="necessary">Necessary</option>
                  <option value="functional">Functional</option>
                  <option value="analytics">Analytics</option>
                  <option value="performance">Performance</option>
                  <option value="advertisement">Advertisement</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Provider / Service Name</label>
                <input
                  type="text"
                  value={editingCookie.service_name || ""}
                  onChange={(e) =>
                    setEditingCookie({ ...editingCookie, service_name: e.target.value })
                  }
                  placeholder="e.g. Google Analytics, Meta, Stripe"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Duration</label>
                <input
                  type="text"
                  value={editingCookie.duration || ""}
                  onChange={(e) =>
                    setEditingCookie({ ...editingCookie, duration: e.target.value })
                  }
                  placeholder="e.g. 1 year, 24 hours, Session"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Purpose Description</label>
                <textarea
                  rows={3}
                  value={editingCookie.description || ""}
                  onChange={(e) =>
                    setEditingCookie({ ...editingCookie, description: e.target.value })
                  }
                  placeholder="Explain why this cookie is placed and what data it processes..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Code2 className="size-3.5 text-slate-500" />
                  Script URL Auto-Blocker Pattern (Regex)
                </label>
                <input
                  type="text"
                  value={editingCookie.script_pattern_regex || ""}
                  onChange={(e) =>
                    setEditingCookie({ ...editingCookie, script_pattern_regex: e.target.value })
                  }
                  placeholder="e.g. googletagmanager\.com|google-analytics\.com"
                  className="w-full font-mono text-[11px] px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Scripts matching this regex will be held in memory until the user opts in to this category.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingCookie(null)}
                className="text-xs font-bold rounded-[4px] h-8"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold rounded-[4px] h-8 flex items-center gap-1.5"
              >
                <Save className="size-3.5" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Cookie Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-[#1868db]" />
                <h3 className="text-sm font-bold text-slate-900">Add New Cookie</h3>
              </div>
              <button
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cookie Identifier *</label>
                <input
                  type="text"
                  value={newCookie.name || ""}
                  onChange={(e) => setNewCookie({ ...newCookie, name: e.target.value })}
                  placeholder="e.g. _ga, custom_session_id"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newCookie.category}
                  onChange={(e) =>
                    setNewCookie({ ...newCookie, category: e.target.value as any })
                  }
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
                >
                  <option value="necessary">Necessary</option>
                  <option value="functional">Functional</option>
                  <option value="analytics">Analytics</option>
                  <option value="performance">Performance</option>
                  <option value="advertisement">Advertisement</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Provider / Service Name</label>
                <input
                  type="text"
                  value={newCookie.service_name || ""}
                  onChange={(e) => setNewCookie({ ...newCookie, service_name: e.target.value })}
                  placeholder="e.g. Google, Intercom, First Party"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Duration</label>
                <input
                  type="text"
                  value={newCookie.duration || ""}
                  onChange={(e) => setNewCookie({ ...newCookie, duration: e.target.value })}
                  placeholder="e.g. 1 year, 30 days, Session"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Purpose Description</label>
                <textarea
                  rows={3}
                  value={newCookie.description || ""}
                  onChange={(e) => setNewCookie({ ...newCookie, description: e.target.value })}
                  placeholder="Describe the function of this cookie..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] focus:outline-hidden focus:border-[#1868db]"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddingNew(false)}
                className="text-xs font-bold rounded-[4px] h-8"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCookie}
                disabled={isSaving}
                className="bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-bold rounded-[4px] h-8 flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                {isSaving ? "Saving..." : "Add to Catalog"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
