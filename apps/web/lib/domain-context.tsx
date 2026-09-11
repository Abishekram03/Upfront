"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { fetchSites, Site } from "./api"

interface DomainContextType {
  sites: Site[]
  activeDomain: string | null
  isLoadingSites: boolean
  realtimeVisitors: number
  setActiveDomain: (domain: string) => void
  refreshSites: () => Promise<void>
  setRealtimeVisitors: (count: number) => void
}

const DomainContext = createContext<DomainContextType>({
  sites: [],
  activeDomain: null,
  isLoadingSites: true,
  realtimeVisitors: 0,
  setActiveDomain: () => {},
  refreshSites: async () => {},
  setRealtimeVisitors: () => {},
})

export function DomainProvider({ children }: { children: React.ReactNode }) {
  const [sites, setSites] = useState<Site[]>([])
  const [isLoadingSites, setIsLoadingSites] = useState(true)
  const [activeDomain, setActiveDomainState] = useState<string | null>(null)
  const [realtimeVisitors, setRealtimeVisitors] = useState(0)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const refreshSites = useCallback(async () => {
    try {
      const data = await fetchSites()
      setSites(data)

      const urlDomain = searchParams.get("domain")
      if (urlDomain && data.some((s) => s.domain === urlDomain)) {
        setActiveDomainState(urlDomain)
      } else if (data.length > 0) {
        // If current active domain is still in the list, keep it; otherwise select first
        setActiveDomainState((prev) => {
          if (prev && data.some((s) => s.domain === prev)) return prev
          return data[0].domain
        })
      } else {
        setActiveDomainState(null)
      }
    } catch (err) {
      console.warn("Could not load sites in DomainProvider:", err)
      setSites([])
      setActiveDomainState(null)
    } finally {
      setIsLoadingSites(false)
    }
  }, [searchParams])

  useEffect(() => {
    refreshSites()
  }, [refreshSites])

  const setActiveDomain = (domain: string) => {
    setActiveDomainState(domain)
    // Update URL query param if on analytics page
    if (pathname.startsWith("/analytics")) {
      router.push(`/analytics?domain=${encodeURIComponent(domain)}`)
    }
  }

  return (
    <DomainContext.Provider
      value={{
        sites,
        activeDomain,
        isLoadingSites,
        realtimeVisitors,
        setActiveDomain,
        refreshSites,
        setRealtimeVisitors,
      }}
    >
      {children}
    </DomainContext.Provider>
  )
}

export function useDomain() {
  return useContext(DomainContext)
}
