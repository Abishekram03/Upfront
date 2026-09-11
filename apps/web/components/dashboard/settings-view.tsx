"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Globe,
  Plus,
  Code2,
  Copy,
  Check,
  Trash2,
  BarChart3,
  X,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"
import { fetchSites, createSite, deleteSite, Site, API_BASE } from "@/lib/api"
import { useDomain } from "@/lib/domain-context"

export function SettingsView() {
  const { refreshSites: refreshContextSites } = useDomain()
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedSiteForSnippet, setSelectedSiteForSnippet] = useState<Site | null>(null)
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null)

  // Add Site Form state
  const [newDomain, setNewDomain] = useState("")
  const [newTimezone, setNewTimezone] = useState("UTC")
  const [modalStep, setModalStep] = useState<"input" | "snippet">("input")
  const [createdSite, setCreatedSite] = useState<Site | null>(null)
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadSites = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchSites()
      setSites(data)
    } catch (err: any) {
      console.error("Failed to load sites:", err)
      setError(err?.message || "Failed to load sites from analytics backend.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSites()
  }, [])

  const handleOpenAddModal = () => {
    setNewDomain("")
    setNewTimezone("UTC")
    setErrorMessage("")
    setModalStep("input")
    setCreatedSite(null)
    setAddModalOpen(true)
  }

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    // Basic domain cleanup
    const cleanDomain = (newDomain
      .replace("https://", "")
      .replace("http://", "")
      .split("/")[0] || "")
      .trim()

    if (!cleanDomain) {
      setErrorMessage("Please enter a valid domain name")
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createSite(cleanDomain, newTimezone)
      setCreatedSite(created)
      setSites((prev) => [created, ...prev])
      await refreshContextSites()
      setModalStep("snippet")
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create site.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!siteToDelete) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteSite(siteToDelete.id)
      setSites((prev) => prev.filter((s) => s.id !== siteToDelete.id))
      await refreshContextSites()
      setSiteToDelete(null)
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete website. Please ensure the backend is running.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header & Add Site Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Site Settings
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your registered websites, embed tracking scripts, and setup domains
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 py-2 rounded-[4px] shadow-xs transition-colors"
        >
          <Plus className="size-4" />
          Add Site
        </button>
      </div>

      {/* 1. SKELETON LOADING STATE */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-[6px] border border-neutral-200 bg-white p-5 shadow-xs animate-pulse"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-[4px] bg-neutral-100" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-neutral-100 rounded" />
                      <div className="h-2.5 w-20 bg-neutral-100 rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-14 bg-neutral-100 rounded-full" />
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                <div className="h-8 flex-1 bg-neutral-100 rounded-[4px]" />
                <div className="h-8 w-20 bg-neutral-100 rounded-[4px]" />
                <div className="size-8 bg-neutral-100 rounded-[4px]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* 2. ERROR STATE */
        <div className="rounded-[6px] border border-rose-200 bg-rose-50/50 p-10 text-center shadow-xs">
          <div className="mx-auto flex max-w-md flex-col items-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-[6px] bg-rose-100 text-rose-600">
              <AlertCircle className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-rose-900">Unable to load websites</h3>
            <p className="text-xs text-rose-600">{error}</p>
            <button
              type="button"
              onClick={loadSites}
              className="mt-2 bg-white text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-[4px] px-3 py-1.5 inline-flex items-center gap-1.5"
            >
              <RefreshCw className="size-3.5" /> Retry Connection
            </button>
          </div>
        </div>
      ) : sites.length === 0 ? (
        /* 3. EMPTY STATE */
        <div className="rounded-[8px] border border-neutral-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex max-w-sm flex-col items-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-[6px] bg-neutral-100 text-[#1868db]">
              <Globe className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">No sites added yet</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Add your first domain to start tracking privacy-friendly, cookieless web analytics and managing CookieYes consent banners.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-2 bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 py-2 rounded-[4px] shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="size-3.5" /> Add Your First Site
            </button>
          </div>
        </div>
      ) : (
        /* 4. SUCCESS STATE: SITES CARDS GRID */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <div
              key={site.id}
              className="flex flex-col justify-between rounded-[6px] border border-neutral-200 bg-white p-5 shadow-2xs transition-all hover:border-[#1868db] hover:shadow-md"
            >
              <div>
                {/* Card Top: Domain & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-[4px] bg-neutral-50 border border-neutral-200 text-[#1868db]">
                      <Globe className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 truncate">
                        {site.domain}
                      </h3>
                      <p className="text-[11px] text-neutral-400">Timezone: {site.timezone}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10px] font-bold border",
                      site.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        site.status === "active" ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    />
                    {site.status === "active" ? "Active" : "Waiting"}
                  </span>
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="mt-6 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSiteForSnippet(site)}
                  className="h-8 text-xs font-semibold border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 rounded-[4px] px-3 gap-1.5 flex-1 inline-flex items-center justify-center transition-colors"
                >
                  <Code2 className="size-3.5 text-neutral-500" />
                  Embed Script
                </button>

                <Link
                  href={`/analytics?domain=${encodeURIComponent(site.domain)}`}
                  className="inline-flex h-8 items-center justify-center rounded-[4px] bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-3 gap-1 shadow-xs transition-colors"
                >
                  <BarChart3 className="size-3.5" />
                  Analytics
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null)
                    setSiteToDelete(site)
                  }}
                  title="Delete site"
                  className="flex size-8 shrink-0 items-center justify-center rounded-[4px] text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-transparent hover:border-rose-200"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP MODAL: Add New Site */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div
            className="fixed inset-0"
            onClick={() => setAddModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-[8px] border border-neutral-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-[4px] bg-[#1868db] text-white">
                  <Globe className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    {modalStep === "input" ? "Add New Site" : "Site Added Successfully"}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {modalStep === "input"
                      ? "Enter your website domain to start tracking"
                      : "Install this snippet on your website"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-[4px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            {modalStep === "input" ? (
              <form onSubmit={handleCreateSite} className="space-y-4 pt-4">
                {errorMessage && (
                  <div className="p-2.5 rounded-[4px] bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">
                    Website URL / Domain
                  </label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g. yourwebsite.com or myblog.io"
                    autoFocus
                    required
                    className="w-full rounded-[4px] border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#1868db] focus:bg-white transition-colors"
                  />
                  <p className="text-[10px] text-neutral-400">
                    Enter your root domain or subdomain. No protocols or paths needed.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">
                    Reporting Timezone
                  </label>
                  <select
                    value={newTimezone}
                    onChange={(e) => setNewTimezone(e.target.value)}
                    className="w-full rounded-[4px] border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#1868db] focus:bg-white transition-colors"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="text-xs font-semibold px-4 py-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-[4px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 py-2 rounded-[4px] shadow-xs inline-flex items-center gap-1.5"
                  >
                    {isSubmitting ? "Adding..." : "Add Site"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="rounded-[6px] border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900 flex items-start gap-2">
                  <Sparkles className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{createdSite?.domain}</span> has been added! Add the snippet below to start tracking.
                  </div>
                </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Paste this snippet into your website's &lt;head&gt;
                    </label>
                    <div className="relative rounded-[6px] border border-neutral-800 bg-neutral-950 p-3 text-neutral-100 shadow-inner">
                      <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap select-all">
                        {`<script defer data-domain="${createdSite?.domain}" src="${typeof window !== "undefined" ? window.location.origin : "https://usrly-five.vercel.app"}/userly.js"></script>`}
                      </pre>
                    <button
                      type="button"
                      onClick={() => {
                        const host = typeof window !== "undefined" ? window.location.origin : "https://usrly-five.vercel.app"
                        navigator.clipboard.writeText(
                          `<script defer data-domain="${createdSite?.domain}" src="${host}/userly.js"></script>`
                        )
                        setCopiedSnippet(true)
                        setTimeout(() => setCopiedSnippet(false), 2000)
                      }}
                      className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-[4px] bg-[#1868db] hover:bg-[#1559be] px-2.5 py-1 text-xs font-semibold text-white transition-colors"
                    >
                      {copiedSnippet ? (
                        <>
                          <Check className="size-3 text-white" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 py-2 rounded-[4px]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL: Embed Snippet on existing site */}
      {selectedSiteForSnippet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedSiteForSnippet(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-[8px] border border-neutral-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-[4px] bg-[#1868db] text-white">
                  <Code2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Tracking Code — {selectedSiteForSnippet.domain}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Paste this snippet in the &lt;head&gt; tag of your site
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSiteForSnippet(null)}
                className="rounded-[4px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="relative rounded-[6px] border border-neutral-800 bg-neutral-950 p-3 text-neutral-100 shadow-inner">
                <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap select-all">
                  {`<script defer data-domain="${selectedSiteForSnippet.domain}" src="${typeof window !== "undefined" ? window.location.origin : "https://usrly-five.vercel.app"}/userly.js"></script>`}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    const host = typeof window !== "undefined" ? window.location.origin : "https://usrly-five.vercel.app"
                    navigator.clipboard.writeText(
                      `<script defer data-domain="${selectedSiteForSnippet.domain}" src="${host}/userly.js"></script>`
                    )
                    setCopiedSnippet(true)
                    setTimeout(() => setCopiedSnippet(false), 2000)
                  }}
                  className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-[4px] bg-[#1868db] hover:bg-[#1559be] px-2.5 py-1 text-xs font-semibold text-white transition-colors"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="size-3 text-white" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setSelectedSiteForSnippet(null)}
                  className="bg-[#1868db] hover:bg-[#1559be] text-white text-xs font-semibold px-4 py-2 rounded-[4px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Delete Confirmation Dialog */}
      {siteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-0">
          <div
            className="fixed inset-0"
            onClick={() => !isDeleting && setSiteToDelete(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-[8px] border border-neutral-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-200">
              <div className="flex size-10 items-center justify-center rounded-[6px] bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Delete Website
                </h3>
                <p className="text-xs text-neutral-500">
                  This action is permanent and cannot be undone
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 py-4">
              <p className="text-xs text-neutral-600 leading-relaxed">
                Are you sure you want to delete <strong className="text-neutral-900">{siteToDelete.domain}</strong>?
              </p>
              <div className="rounded-[4px] bg-rose-50 border border-rose-200/80 p-3 text-[11px] text-rose-800 leading-normal">
                All traffic sessions, pageview metrics, historical trends, and CookieYes consent receipts associated with this domain will be permanently purged.
              </div>

              {deleteError && (
                <div className="p-2.5 rounded-[4px] bg-rose-100/70 border border-rose-300 text-xs text-rose-700 font-medium">
                  {deleteError}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSiteToDelete(null)}
                className="text-xs font-semibold px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-[4px] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-[4px] shadow-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                {isDeleting ? "Deleting..." : "Delete Website"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
