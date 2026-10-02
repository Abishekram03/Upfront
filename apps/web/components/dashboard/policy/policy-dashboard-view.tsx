"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { AVAILABLE_POLICIES, PolicyDefinition, DomainPolicyRecord, PolicyId } from "./policy-types"
import { PolicyCard } from "./policy-card"
import { PolicyPreviewModal } from "./policy-preview-modal"
import { PolicyWizardModal } from "./policy-wizard-modal"
import { StagedPolicyEditor } from "./staged-policy-editor"
import { CookiePolicyGenerator } from "@/components/dashboard/consent/cookie-policy-generator"
import { PolicyGenerator } from "@/components/dashboard/consent/policy-generator"
import { useCMPCookiePolicy } from "./use-cmp-cookie-policy"
import { useDomain } from "@/lib/domain-context"
import { FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

const INITIAL_RECORDS: Record<PolicyId, DomainPolicyRecord> = {
  privacy: {
    policyId: "privacy",
    status: "not_created",
  },
  cookies: {
    policyId: "cookies",
    status: "published",
    publishedAgo: "3 months ago",
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

  // Selected domain state
  const selectedDomain = activeDomain || (sites && sites.length > 0 ? (sites[0]?.domain ?? "onconnect.one") : "onconnect.one")
  const cleanDomain = useMemo(() => {
    const raw = (selectedDomain || "").replace("https://", "").replace("http://", "")
    const first = raw.split("/")[0] || ""
    return first.trim().toLowerCase()
  }, [selectedDomain])

  // Live CMP cookie policy data layer for the selected domain
  const cmpCookieData = useCMPCookiePolicy(cleanDomain)

  // View state: "dashboard" | "editor"
  const [viewMode, setViewMode] = useState<"dashboard" | "editor">("dashboard")
  const [stagedEditingPolicy, setStagedEditingPolicy] = useState<PolicyDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Policy records state (Cookie policy is dynamically populated from CMP, others from backend)
  const [records, setRecords] = useState<Record<PolicyId, DomainPolicyRecord>>(INITIAL_RECORDS)

  // Fetch persisted policies from database for the active domain
  const fetchPolicies = useCallback(async () => {
    if (!cleanDomain) return
    try {
      setIsLoading(true)
      const res = await fetch(`/api/v1/policies?domain=${encodeURIComponent(cleanDomain)}`)
      if (res.ok) {
        const data: DomainPolicyRecord[] = await res.json()
        if (Array.isArray(data)) {
          setRecords((prev) => {
            const next = { ...INITIAL_RECORDS }
            data.forEach((p) => {
              if (p.policyId && next[p.policyId]) {
                next[p.policyId] = {
                  ...next[p.policyId],
                  ...p,
                }
              }
            })
            return next
          })
        }
      }
    } catch (err) {
      console.error("Failed to fetch policies from backend:", err)
    } finally {
      setIsLoading(false)
    }
  }, [cleanDomain])

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  // Dynamic merged records where "cookies" policy is dynamically powered by CMP
  const activeRecords = useMemo<Record<PolicyId, DomainPolicyRecord>>(() => {
    const cookieStatus = "published"
    const cookieAgo = cmpCookieData.lastScanDate
      ? `Scanned ${cmpCookieData.lastScanDate}`
      : cmpCookieData.totalCookiesCount > 0
      ? `${cmpCookieData.totalCookiesCount} cookies linked`
      : "3 months ago"

    return {
      ...records,
      cookies: {
        policyId: "cookies",
        status: cookieStatus,
        publishedAgo: cookieAgo,
        publishedAt: cmpCookieData.lastScanDate || undefined,
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
  // VIEW MODE: STAGED QUESTIONNAIRE EDITOR (FOR ALL POLICIES)
  // =========================================================================
  if (viewMode === "editor" && stagedEditingPolicy) {
    if (stagedEditingPolicy.id === "cookies") {
      return (
        <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-10 py-6">
          <CookiePolicyGenerator
            initialViewMode="editor"
            onBack={() => {
              setViewMode("dashboard")
              setStagedEditingPolicy(null)
              fetchPolicies()
            }}
          />
        </div>
      )
    }

    return (
      <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-10 py-6">
        <StagedPolicyEditor
          policy={stagedEditingPolicy}
          domain={cleanDomain}
          existingRecord={activeRecords[stagedEditingPolicy.id]}
          onBack={() => {
            setViewMode("dashboard")
            setStagedEditingPolicy(null)
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

      {/* Main 4-Column Card Grid */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {AVAILABLE_POLICIES.map((policy) => {
            const record = activeRecords[policy.id]
            return (
              <PolicyCard
                key={policy.id}
                policy={policy}
                record={record}
                onGenerate={handleOpenCreate}
                onPreview={handleOpenPreview}
                onViewDetails={handleOpenEdit}
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
