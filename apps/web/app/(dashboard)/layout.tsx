"use client"

import { Suspense, useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { TablerHeader } from "@/components/dashboard/tabler-header"
import { TablerNavbar } from "@/components/dashboard/tabler-navbar"
import { ScriptModal } from "@/components/dashboard/script-modal"
import { ToolType } from "@/components/dashboard/tool-switcher"
import { DomainProvider, useDomain } from "@/lib/domain-context"

import { WorkspaceProvider } from "@/lib/workspace-context"
import { EntitlementsProvider } from "@/lib/entitlements-context"
import { WorkspaceWizardModal } from "@/components/dashboard/workspace-wizard-modal"
import { UpgradeModal } from "@/components/dashboard/billing/upgrade-modal"
import { useWorkspace } from "@/lib/workspace-context"
import { useEntitlements } from "@/lib/entitlements-context"
import { OnboardingWizard } from "@/components/dashboard/onboarding/onboarding-wizard"
import { AlertCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"

function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { sites, activeDomain, setActiveDomain, isLoadingSites, realtimeVisitors } = useDomain()
  const { activeWorkspace, workspaces, isLoadingWorkspaces } = useWorkspace()
  const { isPaid, plan } = useEntitlements()

  // Infer active tool from current path or state
  const isConsentOrPolicyPath = pathname.startsWith("/consent") || pathname.startsWith("/policy")
  const [activeTool, setActiveTool] = useState<ToolType>(
    isConsentOrPolicyPath ? "consent" : "analytics"
  )

  useEffect(() => {
    if (pathname.startsWith("/consent") || pathname.startsWith("/policy")) {
      setActiveTool("consent")
    } else if (pathname.startsWith("/analytics") || pathname.startsWith("/settings")) {
      setActiveTool("analytics")
    }
  }, [pathname])

  const [snippetModalOpen, setSnippetModalOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleSelectTool = (tool: ToolType) => {
    setActiveTool(tool)
    if (tool === "analytics") {
      router.push(activeDomain ? `/analytics?domain=${encodeURIComponent(activeDomain)}` : "/analytics")
    } else {
      router.push("/consent")
    }
  }

  // Check if active domain has pending installation
  const activeSite = sites.find((s) => s.domain === activeDomain)
  const isInstallationPending = activeSite && (activeSite.installation_status === "pending" || activeSite.installation_status === "verification_failed")

  // Check if we are on full-bleed Studio page
  const isFullBleedStudio = pathname.startsWith("/consent/studio")

  // Onboarding wizard is STRICTLY for brand-new users with zero sites, zero plans, who have never added a domain
  const hasExistingSites = (sites && sites.length > 0) || Boolean(activeWorkspace?.first_site_id) || Boolean(activeWorkspace?.sites_count && activeWorkspace.sites_count > 0) || workspaces.some((w) => (w.sites_count && w.sites_count > 0) || Boolean(w.first_site_id))
  const isExistingAccount = Boolean(
    hasExistingSites ||
    activeWorkspace?.onboarding_completed === true ||
    isPaid ||
    plan !== "free" ||
    workspaces.some((w) => w.onboarding_completed === true || (w as any).plan_tier === "growth" || (w as any).plan_tier === "business")
  )

  const shouldShowOnboarding =
    !isLoadingSites &&
    !isLoadingWorkspaces &&
    activeWorkspace &&
    activeWorkspace.onboarding_completed === false &&
    !isExistingAccount &&
    (!sites || sites.length === 0)

  return (
    <div className={cn("w-full bg-[#f8fafc] text-slate-900 flex flex-col", isFullBleedStudio ? "h-screen overflow-hidden" : "min-h-screen overflow-x-hidden")}>
      {/* Workspace Creation Wizard (if user has no workspace) */}
      <WorkspaceWizardModal />

      {/* Workspace Onboarding Wizard (strictly for brand new users without existing sites/account) */}
      {shouldShowOnboarding && (
        <OnboardingWizard workspace={activeWorkspace} />
      )}

      {/* Global Upgrade Modal for Feature Gating */}
      <UpgradeModal />

      {/* Tabler Top Header */}
      <TablerHeader
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        sites={sites}
        activeDomain={activeDomain}
        onChangeDomain={setActiveDomain}
        onOpenSnippetModal={() => setSnippetModalOpen(true)}
        realtimeVisitors={realtimeVisitors}
        isLoadingSites={isLoadingSites}
        isMobileOpen={isMobileOpen}
        onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
      />

      {/* Tabler Horizontal Navigation Bar */}
      <TablerNavbar
        activeTool={activeTool}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Installation Pending Notice Banner */}
      {isInstallationPending && !isFullBleedStudio && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 sm:px-6">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-900">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <span>
                <strong>Installation pending:</strong> UpFront script is not yet verified on <strong>{activeDomain}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSnippetModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/90 hover:bg-amber-200 px-3 py-1 rounded-md transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
            >
              Finish Setup
              <ArrowRight className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={isFullBleedStudio || pathname.startsWith("/policy") ? "flex-1 w-full min-h-0 flex flex-col" : "flex-1 py-6"}>
        {isFullBleedStudio || pathname.startsWith("/policy") ? (
          children
        ) : (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        )}
      </main>

      {/* Tracking Script Modal */}
      {activeDomain && (
        <ScriptModal
          open={snippetModalOpen}
          onClose={() => setSnippetModalOpen(false)}
          domain={activeDomain}
        />
      )}

      {/* Global Modern Sonner Toaster */}
      <Toaster position="bottom-right" />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-slate-50" />}>
      <WorkspaceProvider>
        <EntitlementsProvider>
          <DomainProvider>
            <DashboardInner>{children}</DashboardInner>
          </DomainProvider>
        </EntitlementsProvider>
      </WorkspaceProvider>
    </Suspense>
  )
}


