"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { AVAILABLE_POLICIES, PolicyDefinition, DomainPolicyRecord, PolicyId } from "./policy-types"
import { PolicyCard } from "./policy-card"
import { PolicyPreviewModal } from "./policy-preview-modal"
import { PolicyWizardModal } from "./policy-wizard-modal"
import { PolicyDetailsView } from "./policy-details-view"
import { StagedPolicyEditor } from "./staged-policy-editor"
import { CookiePolicyGenerator } from "@/components/dashboard/consent/cookie-policy-generator"
import { useCMPCookiePolicy } from "./use-cmp-cookie-policy"
import { useDomain } from "@/lib/domain-context"
import { FileText, Loader2, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const INITIAL_RECORDS: Record<PolicyId, DomainPolicyRecord> = {
  privacy: {
    policyId: "privacy",
    status: "not_created",
  },
  cookies: {
    policyId: "cookies",
    status: "not_created",
  },
  terms: {
    policyId: "terms",
    status: "not_created",
  },
  eula: {
    policyId: "eula",
    status: "not_created",
  },
  return: {
    policyId: "return",
    status: "not_created",
  },
  disclaimer: {
    policyId: "disclaimer",
    status: "not_created",
  },
  shipping: {
    policyId: "shipping",
    status: "not_created",
  },
  acceptable_use: {
    policyId: "acceptable_use",
    status: "not_created",
  },
}

export function PolicyDashboardView() {
  const router = useRouter()
  const { sites, activeDomain } = useDomain()

  // Selected domain state — strictly isolated to active user's websites
  const selectedDomain = activeDomain || (sites && sites.length > 0 ? (sites[0]?.domain ?? "") : "")
  const cleanDomain = useMemo(() => {
    const raw = (selectedDomain || "").replace("https://", "").replace("http://", "")
    const first = raw.split("/")[0] || ""
    return first.trim().toLowerCase()
  }, [selectedDomain])

  // Policy records state (Cookie policy is dynamically populated from CMP, others from backend)
  const [records, setRecords] = useState<Record<PolicyId, DomainPolicyRecord>>(INITIAL_RECORDS)

  // Resolve shared configured company name across all policies/questionnaires for active domain
  const sharedCompanyName = useMemo(() => {
    for (const key of Object.keys(records) as PolicyId[]) {
      const name = records[key]?.config?.companyName?.trim() || (records[key]?.config as any)?.dbaName?.trim()
      if (name) return name
    }
    const matchingSite = sites?.find((s) => s.domain?.toLowerCase().includes(cleanDomain))
    if (matchingSite?.name && !matchingSite.name.toLowerCase().includes(".com") && !matchingSite.name.toLowerCase().includes(".one")) {
      return matchingSite.name
    }
    return ""
  }, [records, sites, cleanDomain])

  // Live CMP cookie policy data layer for the selected domain
  const cmpCookieData = useCMPCookiePolicy(cleanDomain, sharedCompanyName)

  // View state: "dashboard" | "details" | "editor"
  const [viewMode, setViewMode] = useState<"dashboard" | "details" | "editor">("dashboard")
  const [stagedEditingPolicy, setStagedEditingPolicy] = useState<PolicyDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch persisted policies from database for the active domain
  const fetchPolicies = useCallback(async () => {
    if (!cleanDomain) {
      setRecords(INITIAL_RECORDS)
      return
    }
    try {
      setIsLoading(true)
      const res = await fetch(`/api/v1/policies?domain=${encodeURIComponent(cleanDomain)}`)
      if (res.ok) {
        const data: DomainPolicyRecord[] = await res.json()
        const next = { ...INITIAL_RECORDS }
        if (Array.isArray(data)) {
          data.forEach((p) => {
            if (p.policyId && next[p.policyId]) {
              next[p.policyId] = {
                ...next[p.policyId],
                ...p,
              }
            }
          })
        }
        setRecords(next)
      } else {
        setRecords(INITIAL_RECORDS)
      }
    } catch (err) {
      console.error("Failed to fetch policies from backend:", err)
      setRecords(INITIAL_RECORDS)
    } finally {
      setIsLoading(false)
    }
  }, [cleanDomain])

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  // Dynamic merged records where "cookies" policy is dynamically powered by CMP
  const activeRecords = useMemo<Record<PolicyId, DomainPolicyRecord>>(() => {
    const hasCmpCookies = cmpCookieData.totalCookiesCount > 0 || Boolean(cmpCookieData.lastSyncedDate)
    const cookieStatus = records.cookies?.status === "published" || hasCmpCookies ? "published" : records.cookies?.status || "not_created"
    const cookieAgo = cmpCookieData.lastSyncedDate
      ? `Synced ${cmpCookieData.lastSyncedDate}`
      : cmpCookieData.lastScanDate
      ? `Scanned ${cmpCookieData.lastScanDate}`
      : cmpCookieData.totalCookiesCount > 0
      ? `${cmpCookieData.totalCookiesCount} cookies linked`
      : records.cookies?.publishedAgo || undefined

    return {
      ...records,
      cookies: {
        policyId: "cookies",
        status: cookieStatus,
        publishedAgo: cookieAgo,
        publishedAt: cmpCookieData.lastSyncedDate || cmpCookieData.lastScanDate || undefined,
        customTitle: "Cookie Policy",
        contentMarkdown: cmpCookieData.generatedMarkdown,
        contentHtml: cmpCookieData.generatedHtml,
      },
    }
  }, [records, cmpCookieData])

  // Modal interaction states
  const [previewPolicy, setPreviewPolicy] = useState<PolicyDefinition | null>(null)
  const [wizardPolicy, setWizardPolicy] = useState<PolicyDefinition | null>(null)

  const handleOpenCreate = (policy: PolicyDefinition) => {
    setStagedEditingPolicy(policy)
    setViewMode("editor")
  }

  const handleOpenDetails = (policy: PolicyDefinition) => {
    setStagedEditingPolicy(policy)
    setViewMode("details")
  }

  const handleOpenEdit = (policy: PolicyDefinition) => {
    setStagedEditingPolicy(policy)
    setViewMode("editor")
  }

  const handleOpenPreview = (policy: PolicyDefinition) => {
    setPreviewPolicy(policy)
  }

  const handleSavePolicy = (updatedRecord: DomainPolicyRecord) => {
    setRecords((prev) => ({
      ...prev,
      [updatedRecord.policyId]: {
        ...prev[updatedRecord.policyId],
        ...updatedRecord,
      },
    }))
  }

  // =========================================================================
  // EMPTY STATE: USER HAS NO WEBSITE CONNECTED
  // =========================================================================
  if (!cleanDomain) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-20">
        <div className="border-b border-slate-100 bg-white px-6 sm:px-10 py-6">
          <div className="max-w-[1400px] mx-auto flex items-center gap-2">
            <FileText className="size-5 text-[#1868db]" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Policies</h1>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-6 py-20 text-center flex flex-col items-center">
          <div className="size-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1868db] mb-4 shadow-2xs">
            <Globe className="size-8 stroke-[1.5]" />
          </div>
          <h2 className="text-xl font-normal text-slate-900 tracking-tight">No website connected</h2>
          <p className="text-sm font-light text-slate-500 mt-2 max-w-sm leading-relaxed">
            Please add or select a website in your dashboard to generate, view, and customize your legal policies.
          </p>
          <Button
            type="button"
            onClick={() => router.push("/analytics")}
            className="mt-6 h-11 px-6 text-sm font-normal bg-[#1868db] hover:bg-[#1559be] text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Add Website
          </Button>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW MODE: POLICY DETAILS SCREEN (PREVIEW + NOTICE/INFO PANEL)
  // =========================================================================
  if (viewMode === "details" && stagedEditingPolicy) {
    return (
      <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-10 py-6">
        <PolicyDetailsView
          policy={stagedEditingPolicy}
          record={activeRecords[stagedEditingPolicy.id]}
          domain={cleanDomain}
          sharedCompanyName={sharedCompanyName}
          onBack={() => {
            setViewMode("dashboard")
            setStagedEditingPolicy(null)
            fetchPolicies()
          }}
          onEdit={() => {
            setViewMode("editor")
          }}
          onPublish={(record) => {
            handleSavePolicy(record)
            fetchPolicies()
          }}
        />
      </div>
    )
  }

  // =========================================================================
  // VIEW MODE: DEDICATED STAGED QUESTIONNAIRE EDITORS (COOKIE-POLICY STYLE UI)
  // =========================================================================
  if (viewMode === "editor" && stagedEditingPolicy) {
    if (stagedEditingPolicy.id === "cookies") {
      return (
        <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-10 py-6">
          <CookiePolicyGenerator
            initialViewMode="editor"
            companyName={sharedCompanyName}
            onBack={() => {
              setViewMode("details")
              fetchPolicies()
            }}
          />
        </div>
      )
    }

    return (
      <div className="w-full">
        <StagedPolicyEditor
          policy={stagedEditingPolicy}
          domain={cleanDomain}
          existingRecord={activeRecords[stagedEditingPolicy.id]}
          onBack={() => {
            setViewMode("details")
            fetchPolicies()
          }}
          onSaveDraft={(record) => {
            handleSavePolicy(record)
          }}
          onPublish={(record) => {
            handleSavePolicy(record)
          }}
        />
      </div>
    )
  }

  // =========================================================================
  // VIEW MODE: CLEAN 4-COLUMN CARDS DASHBOARD (MATCHING USER SCREENSHOT)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-20">
      {/* Top Header Section */}
      <div className="border-b border-slate-100 bg-white px-6 sm:px-10 py-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-[#1868db]" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Policies
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Legal policies help you comply with data privacy and consumer protection laws, protect your business and limit your liability.
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Syncing policies...</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Policies Card Grid (3-Column Layout) */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {AVAILABLE_POLICIES.filter((p) => !p.hidden).map((policy) => {
            const record = activeRecords[policy.id]
            return (
              <PolicyCard
                key={policy.id}
                policy={policy}
                record={record}
                onGenerate={handleOpenDetails}
                onPreview={handleOpenDetails}
                onViewDetails={handleOpenDetails}
              />
            )
          })}
        </div>
      </div>

      {/* Modals */}
      <PolicyPreviewModal
        isOpen={!!previewPolicy}
        onClose={() => setPreviewPolicy(null)}
        policy={previewPolicy}
        record={previewPolicy ? activeRecords[previewPolicy.id] : null}
        domain={cleanDomain}
        sharedCompanyName={sharedCompanyName}
        onEdit={handleOpenEdit}
      />

      <PolicyWizardModal
        isOpen={!!wizardPolicy}
        onClose={() => setWizardPolicy(null)}
        policy={wizardPolicy}
        existingRecord={wizardPolicy ? activeRecords[wizardPolicy.id] : undefined}
        onSave={handleSavePolicy}
      />
    </div>
  )
}
