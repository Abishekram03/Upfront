"use client"

import { Suspense, useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar"
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
    <div className="flex h-screen w-full overflow-hidden bg-[#f1f5f9] text-slate-900">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex h-full shrink-0">
        <Suspense fallback={<div className="w-64 border-r border-slate-200 bg-white" />}>
          <DashboardSidebar
            activeTool={activeTool}
            onSelectTool={handleSelectTool}
          />
        </Suspense>
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 h-full w-64 bg-white shadow-xl">
            <Suspense fallback={<div className="w-64 bg-white h-full" />}>
              <DashboardSidebar
                activeTool={activeTool}
                onSelectTool={(tool) => {
                  handleSelectTool(tool)
                  setIsMobileOpen(false)
                }}
              />
            </Suspense>
          </div>
        </div>
      )}


      {/* Main Content Area with Topbar */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar
          onToggleSidebar={() => setIsMobileOpen(!isMobileOpen)}
          sites={sites}
          activeDomain={activeDomain}
          onChangeDomain={setActiveDomain}
          onOpenSnippetModal={() => setSnippetModalOpen(true)}
          realtimeVisitors={realtimeVisitors}
          isLoadingSites={isLoadingSites}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>

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
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-neutral-50" />}>
      <DomainProvider>
        <DashboardInner>{children}</DashboardInner>
      </DomainProvider>
    </Suspense>
  )
}

