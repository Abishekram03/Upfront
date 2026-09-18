"use client"

import { Suspense, useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { TablerHeader } from "@/components/dashboard/tabler-header"
import { TablerNavbar } from "@/components/dashboard/tabler-navbar"
import { ScriptModal } from "@/components/dashboard/script-modal"
import { ToolType } from "@/components/dashboard/tool-switcher"
import { DomainProvider, useDomain } from "@/lib/domain-context"

function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { sites, activeDomain, setActiveDomain, isLoadingSites, realtimeVisitors } = useDomain()

  // Infer active tool from current path or state
  const isConsentPath = pathname.startsWith("/consent")
  const [activeTool, setActiveTool] = useState<ToolType>(
    isConsentPath ? "consent" : "analytics"
  )

  useEffect(() => {
    if (pathname.startsWith("/consent")) {
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

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col">
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

      {/* Main Content Area */}
      <main className="flex-1 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Tracking Script Modal */}
      {activeDomain && (
        <ScriptModal
          open={snippetModalOpen}
          onClose={() => setSnippetModalOpen(false)}
          domain={activeDomain}
        />
      )}
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
      <DomainProvider>
        <DashboardInner>{children}</DashboardInner>
      </DomainProvider>
    </Suspense>
  )
}


