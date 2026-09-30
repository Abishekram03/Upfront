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
  const { data: session, isPending: isSessionPending } = useSession()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null)
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)

  const refreshWorkspaces = useCallback(async (): Promise<Workspace[]> => {
    if (!session?.user?.id) {
      setWorkspaces([])
      setActiveWorkspaceState(null)
      setIsLoadingWorkspaces(false)
      return []
    }

    try {
      setIsLoadingWorkspaces(true)
      const res = await fetch("/api/v1/workspaces")
      if (!res.ok) {
        throw new Error("Failed to load workspaces")
      }
      const data: Workspace[] = await res.json()
      setWorkspaces(data)

      if (data.length > 0) {
        const savedId = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_WORKSPACE_KEY) : null
        const matching = data.find((w) => w.id === savedId)
        // Smart workspace selection: saved workspace -> paid workspace -> workspace with sites -> first workspace
        const paidWorkspace = data.find((w) => w.plan_tier && w.plan_tier !== "free")
        const workspaceWithSites = data.find((w) => (w.sites_count || 0) > 0)
        const selected = matching || paidWorkspace || workspaceWithSites || data[0] || null

        setActiveWorkspaceState(selected)
        if (selected && typeof window !== "undefined") {
          localStorage.setItem(ACTIVE_WORKSPACE_KEY, selected.id)
        }
      } else {
        setActiveWorkspaceState(null)
      }
      return data
    } catch (err) {
      console.error("Workspace fetch error:", err)
      setWorkspaces([])
      setActiveWorkspaceState(null)
      return []
    } finally {
      setIsLoadingWorkspaces(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!isSessionPending) {
      refreshWorkspaces()
    }
  }, [isSessionPending, refreshWorkspaces])

  const setActiveWorkspace = (workspace: Workspace | null) => {
    setActiveWorkspaceState(workspace)
    if (typeof window !== "undefined") {
      if (workspace) {
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspace.id)
      } else {
        localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
      }
    }
  }

  const createWorkspace = async (name: string, slug?: string): Promise<Workspace> => {
    const res = await fetch("/api/v1/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "Failed to create workspace")
    }

    const created: Workspace = await res.json()
    setWorkspaces((prev) => [...prev, created])
    setActiveWorkspace(created)
    return created
  }

  const updateWorkspace = async (workspaceId: string, name: string): Promise<Workspace> => {
    const res = await fetch(`/api/v1/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "Failed to update workspace")
    }

    const updated: Workspace = await res.json()
    setWorkspaces((prev) => prev.map((w) => (w.id === workspaceId ? { ...w, ...updated } : w)))
    if (activeWorkspace?.id === workspaceId) {
      setActiveWorkspaceState((prev) => (prev ? { ...prev, ...updated } : null))
    }
    return updated
  }

  const deleteWorkspace = async (workspaceId: string): Promise<void> => {
    const res = await fetch(`/api/v1/workspaces/${workspaceId}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "Failed to delete workspace")
    }

    const remaining = workspaces.filter((w) => w.id !== workspaceId)
    setWorkspaces(remaining)
    if (activeWorkspace?.id === workspaceId) {
      setActiveWorkspace(remaining[0] || null)
    }
  }

  const updateOnboardingState = async (
    workspaceId: string,
    payload: { step?: string; onboarding_completed?: boolean; first_site_id?: string; skip?: boolean; installation_status?: string }
  ): Promise<void> => {
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.workspace) {
          setWorkspaces((prev) =>
            prev.map((w) => (w.id === workspaceId ? { ...w, ...data.workspace } : w))
          )
          if (activeWorkspace?.id === workspaceId) {
            setActiveWorkspaceState((prev) => (prev ? { ...prev, ...data.workspace } : null))
          }
        }
      }
    } catch (err) {
      console.error("Failed to update onboarding state:", err)
    }
  }

  const hasNoWorkspace = !isLoadingWorkspaces && Boolean(session?.user?.id) && workspaces.length === 0

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoadingWorkspaces,
        hasNoWorkspace,
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
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
