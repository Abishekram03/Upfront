"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "@/lib/auth-client"

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  role: "owner" | "admin" | "member" | "viewer"
  plan_tier?: "free" | "growth" | "business" | string
  onboarding_completed?: boolean
  onboarding_step?: "welcome" | "website" | "install" | "verify" | "completed" | string
  first_site_id?: string | null
  members_count?: number
  sites_count?: number
  created_at: string
  updated_at: string
}

export const DEFAULT_WORKSPACE: Workspace = {
  id: "ws_default",
  name: "My Workspace",
  slug: "my-workspace",
  owner_id: "usr_local_admin",
  role: "owner",
  plan_tier: "open_source",
  onboarding_completed: true,
  onboarding_step: "completed",
  first_site_id: null,
  members_count: 1,
  sites_count: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  isLoadingWorkspaces: boolean
  hasNoWorkspace: boolean
  setActiveWorkspace: (workspace: Workspace | null) => void
  refreshWorkspaces: () => Promise<Workspace[]>
  createWorkspace: (name: string, slug?: string) => Promise<Workspace>
  updateWorkspace: (workspaceId: string, name: string) => Promise<Workspace>
  updateOnboardingState: (workspaceId: string, payload: { step?: string; onboarding_completed?: boolean; first_site_id?: string; skip?: boolean; installation_status?: string }) => Promise<void>
  deleteWorkspace: (workspaceId: string) => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const ACTIVE_WORKSPACE_KEY = "upfront_active_workspace_id"

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isPending: isSessionPending } = useSession()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([DEFAULT_WORKSPACE])
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(DEFAULT_WORKSPACE)
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false)

  const refreshWorkspaces = useCallback(async (): Promise<Workspace[]> => {
    try {
      setIsLoadingWorkspaces(true)
      const res = await fetch("/api/v1/workspaces")
      if (res.ok) {
        const data: Workspace[] = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setWorkspaces(data)
          const savedId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_WORKSPACE_KEY) : null
          const matching = data.find((w) => w.id === savedId)
          const selected = matching || data[0] || DEFAULT_WORKSPACE
          setActiveWorkspaceState(selected)
          if (selected && typeof window !== "undefined") {
            localStorage.setItem(ACTIVE_WORKSPACE_KEY, selected.id)
          }
          return data
        }
      }
    } catch {
      // Quietly fall back to default local workspace
    } finally {
      setIsLoadingWorkspaces(false)
    }

    setWorkspaces([DEFAULT_WORKSPACE])
    setActiveWorkspaceState(DEFAULT_WORKSPACE)
    return [DEFAULT_WORKSPACE]
  }, [])

  useEffect(() => {
    if (!isSessionPending) {
      refreshWorkspaces()
    }
  }, [isSessionPending, refreshWorkspaces])

  const setActiveWorkspace = (workspace: Workspace | null) => {
    const ws = workspace || DEFAULT_WORKSPACE
    setActiveWorkspaceState(ws)
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, ws.id)
    }
  }

  const createWorkspace = async (name: string, slug?: string): Promise<Workspace> => {
    try {
      const res = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      })

      if (res.ok) {
        const created: Workspace = await res.json()
        setWorkspaces((prev) => [...prev, created])
        setActiveWorkspace(created)
        return created
      }
    } catch {
      // Fallback
    }

    const fallback: Workspace = {
      id: `ws_${Date.now()}`,
      name: name || "My Workspace",
      slug: slug || "workspace",
      owner_id: "usr_local_admin",
      role: "owner",
      plan_tier: "open_source",
      onboarding_completed: true,
      onboarding_step: "completed",
      first_site_id: null,
      members_count: 1,
      sites_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setWorkspaces((prev) => [...prev, fallback])
    setActiveWorkspace(fallback)
    return fallback
  }

  const updateWorkspace = async (workspaceId: string, name: string): Promise<Workspace> => {
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        const updated: Workspace = await res.json()
        setWorkspaces((prev) => prev.map((w) => (w.id === workspaceId ? { ...w, ...updated } : w)))
        if (activeWorkspace?.id === workspaceId) {
          setActiveWorkspaceState((prev) => (prev ? { ...prev, ...updated } : null))
        }
        return updated
      }
    } catch {
      // Fallback
    }

    setWorkspaces((prev) => prev.map((w) => (w.id === workspaceId ? { ...w, name } : w)))
    return { ...DEFAULT_WORKSPACE, id: workspaceId, name }
  }

  const updateOnboardingState = async (
    workspaceId: string,
    payload: { step?: string; onboarding_completed?: boolean; first_site_id?: string; skip?: boolean; installation_status?: string }
  ) => {
    try {
      await fetch(`/api/v1/workspaces/${workspaceId}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch {
      // Ignore
    }

    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              onboarding_step: payload.step || w.onboarding_step,
              onboarding_completed: payload.onboarding_completed ?? w.onboarding_completed,
              first_site_id: payload.first_site_id ?? w.first_site_id,
            }
          : w
      )
    )
  }

  const deleteWorkspace = async (workspaceId: string): Promise<void> => {
    try {
      await fetch(`/api/v1/workspaces/${workspaceId}`, {
        method: "DELETE",
      })
    } catch {
      // Ignore
    }

    setWorkspaces((prev) => {
      const remaining = prev.filter((w) => w.id !== workspaceId)
      const next = remaining.length > 0 ? remaining[0] : DEFAULT_WORKSPACE
      setActiveWorkspace(next || DEFAULT_WORKSPACE)
      return remaining.length > 0 ? remaining : [DEFAULT_WORKSPACE]
    })
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoadingWorkspaces,
        hasNoWorkspace: false,
        setActiveWorkspace,
        refreshWorkspaces,
        createWorkspace,
        updateWorkspace,
        updateOnboardingState,
        deleteWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
