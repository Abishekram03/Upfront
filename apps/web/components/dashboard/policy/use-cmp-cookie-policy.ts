"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useEntitlements } from "@/lib/entitlements-context"
import { toast } from "@/components/ui/sonner"

export interface CMPCookieItem {
  id?: string
  name: string
  category: string
  service_name?: string
  duration?: string
  description?: string
  domain?: string
}

export interface CMPCookiePolicyData {
  cookies: CMPCookieItem[]
  discoveredCookies: CMPCookieItem[]
  isLoading: boolean
  isSyncing: boolean
  lastScanDate: string | null
  lastSyncedDate: string | null
  totalCookiesCount: number
  hasPendingSync: boolean
  pendingCount: number
  isAutoSyncActive: boolean
  isGrowthPlus: boolean
  syncCookies: () => void
  categorizedCount: {
    necessary: number
    analytics: number
    marketing: number
    functional: number
    performance: number
    uncategorized: number
  }
  aboutHeading: string
  aboutDescription: string
  useHeading: string
  useDescription: string
  typesHeading: string
  prefHeading: string
  prefDescription: string
  browserLinks: { name: string; url: string }[]
  generatedMarkdown: string
  generatedHtml: string
}

const DEFAULT_BASELINE_COOKIES: CMPCookieItem[] = [
  { name: "_ga", category: "analytics", service_name: "Google Analytics", duration: "2 years" },
  { name: "_gid", category: "analytics", service_name: "Google Analytics", duration: "24 hours" },
  { name: "upfront_test_functional", category: "functional", service_name: "Uncatalogued Provider", duration: "12 months" },
  { name: "upfront_cookie", category: "necessary", service_name: "Consent Management", duration: "12 months" },
  { name: "session", category: "necessary", service_name: "Session Management", duration: "Session" },
]

export function useCMPCookiePolicy(domain: string, companyName?: string): CMPCookiePolicyData {
  const [discoveredCookies, setDiscoveredCookies] = useState<CMPCookieItem[]>([])
  const [syncedCookies, setSyncedCookies] = useState<CMPCookieItem[]>([])
  const [hasLoadedSavedSync, setHasLoadedSavedSync] = useState(false)
  const [lastScanDate, setLastScanDate] = useState<string | null>(null)
  const [lastSyncedDate, setLastSyncedDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Safe Entitlements hook check
  let isGrowthPlus = false
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const entitlements = useEntitlements()
    isGrowthPlus = entitlements.plan === "growth" || entitlements.plan === "business" || Boolean(entitlements.isPaid)
  } catch {
    isGrowthPlus = false
  }

  const cleanDomain = useMemo(() => {
    const raw = (domain || "").replace("https://", "").replace("http://", "")
    const firstPart = raw.split("/")[0] ?? ""
    return firstPart.trim().toLowerCase()
  }, [domain])

  // 1. Load local synced cookies snapshot on Free Tier
  useEffect(() => {
    if (typeof window === "undefined" || !cleanDomain) return
    try {
      const stored = localStorage.getItem(`usrly_synced_cookies_${cleanDomain}`)
      const storedDate = localStorage.getItem(`usrly_synced_date_${cleanDomain}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setSyncedCookies(parsed)
        }
      }
      if (storedDate) {
        setLastSyncedDate(storedDate)
      }
    } catch {
      // ignore
    } finally {
      setHasLoadedSavedSync(true)
    }
  }, [cleanDomain])

  // 2. Fetch live discovered cookies from scanner API
  useEffect(() => {
    if (!cleanDomain) {
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)

    const fetchCMPData = async () => {
      try {
        const [cookiesRes, scanRes] = await Promise.all([
          fetch(`/api/v1/consent/cookies?domain=${encodeURIComponent(cleanDomain)}`),
          fetch(`/api/v1/consent/scanner?domain=${encodeURIComponent(cleanDomain)}`),
        ])

        if (cookiesRes.ok && isMounted) {
          const cookieData = await cookiesRes.json()
          let fetchedList: CMPCookieItem[] = []
          if (Array.isArray(cookieData) && cookieData.length > 0) {
            fetchedList = cookieData
          } else if (cookieData?.cookies && Array.isArray(cookieData.cookies) && cookieData.cookies.length > 0) {
            fetchedList = cookieData.cookies
          } else {
            fetchedList = DEFAULT_BASELINE_COOKIES
          }
          setDiscoveredCookies(fetchedList)
        } else if (isMounted) {
          setDiscoveredCookies(DEFAULT_BASELINE_COOKIES)
        }

        if (scanRes.ok && isMounted) {
          const scanData = await scanRes.json()
          const scanDate = scanData.latest_scan?.completed_at || scanData.latest_scan?.created_at
          if (scanDate) {
            const date = new Date(scanDate)
            setLastScanDate(
              date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            )
          }
        }
      } catch (err) {
        console.warn("Could not fetch CMP cookie policy data:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchCMPData()

    return () => {
      isMounted = false
    }
  }, [cleanDomain])

  // Manual sync function for Free tier
  const syncCookies = useCallback(() => {
    if (!cleanDomain) return
    setIsSyncing(true)
    const targetCookies = discoveredCookies.length > 0 ? discoveredCookies : DEFAULT_BASELINE_COOKIES
    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    setSyncedCookies(targetCookies)
    setLastSyncedDate(dateStr)

    try {
      localStorage.setItem(`usrly_synced_cookies_${cleanDomain}`, JSON.stringify(targetCookies))
      localStorage.setItem(`usrly_synced_date_${cleanDomain}`, dateStr)
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSyncing(false)
      toast.success(`Cookie policy synchronized with ${targetCookies.length} active cookies!`)
    }, 400)
  }, [cleanDomain, discoveredCookies])

  // Check if there are pending cookies from recent scan to sync
  const hasPendingSync = useMemo(() => {
    if (isGrowthPlus) return false // Growth+ auto-syncs live
    if (!hasLoadedSavedSync) return false
    if (discoveredCookies.length === 0) return false
    if (syncedCookies.length === 0) return true

    const syncedNames = new Set(syncedCookies.map((c) => c.name.toLowerCase()))
    const hasUnsynced = discoveredCookies.some((c) => !syncedNames.has(c.name.toLowerCase()))
    return hasUnsynced || syncedCookies.length !== discoveredCookies.length
  }, [isGrowthPlus, hasLoadedSavedSync, discoveredCookies, syncedCookies])

  const pendingCount = useMemo(() => {
    if (!hasPendingSync) return 0
    const syncedNames = new Set(syncedCookies.map((c) => c.name.toLowerCase()))
    const count = discoveredCookies.filter((c) => !syncedNames.has(c.name.toLowerCase())).length
    return count > 0 ? count : Math.abs(discoveredCookies.length - syncedCookies.length)
  }, [hasPendingSync, discoveredCookies, syncedCookies])

  // Active cookies to display: Growth+ uses discovered cookies in real-time, Free uses synced snapshot
  const activeCookies = useMemo(() => {
    if (isGrowthPlus) {
      return discoveredCookies.length > 0 ? discoveredCookies : DEFAULT_BASELINE_COOKIES
    }
    if (syncedCookies.length > 0) {
      return syncedCookies
    }
    return discoveredCookies.length > 0 ? discoveredCookies : DEFAULT_BASELINE_COOKIES
  }, [isGrowthPlus, discoveredCookies, syncedCookies])

  // Count by categories
  const categorizedCount = useMemo(() => {
    const counts = {
      necessary: 0,
      analytics: 0,
      marketing: 0,
      functional: 0,
      performance: 0,
      uncategorized: 0,
    }

    activeCookies.forEach((c) => {
      const cat = (c.category || "uncategorized").toLowerCase()
      if (cat in counts) {
        counts[cat as keyof typeof counts]++
      } else if (cat.includes("advert") || cat.includes("market")) {
        counts.marketing++
      } else if (cat.includes("essential") || cat.includes("strict")) {
        counts.necessary++
      } else {
        counts.uncategorized++
      }
    })

    return counts
  }, [activeCookies])

  // Standard headings and descriptions
  const aboutHeading = "What are cookies?"
  const aboutDescription = `This Cookie Policy explains what cookies are, how we use them, the types of cookies we use (i.e., the information we collect using cookies and how that information is used), and how to manage your cookie settings.\n\nCookies are small text files used to store small pieces of information. They are stored on your device when a website loads in your browser. These cookies help ensure that the website functions properly, enhance security, provide a better user experience, and analyse performance to identify what works and where improvements are needed.`

  const useHeading = "How do we use cookies?"
  const useDescription = `Like most online services, our website uses both first-party and third-party cookies for various purposes. First-party cookies are primarily necessary for the website to function properly and do not collect any personally identifiable data.\n\nThe third-party cookies used on our website primarily help us understand how the website performs, track how you interact with it, keep our services secure, deliver relevant advertisements, and enhance your overall user experience while improving the speed of your future interactions with our website.`

  const typesHeading = "Types of cookies we use"

  const prefHeading = "Manage cookie preferences"
  const prefDescription = `You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.\n\nAdditionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers:\n\nChrome: https://support.google.com/accounts/answer/32050\nSafari: https://support.apple.com/en-in/guide/safari/sfri11471/mac\nFirefox: https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox\nMicrosoft Edge: https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09\n\nIf you are using a different web browser, please refer to its official support documentation.`

  const browserLinks = [
    { name: "Chrome", url: "https://support.google.com/accounts/answer/32050" },
    { name: "Safari", url: "https://support.apple.com/en-in/guide/safari/sfri11471/mac" },
    { name: "Firefox", url: "https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" },
    { name: "Microsoft Edge", url: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
  ]

  // Generated Markdown perfectly matching CMP
  const generatedMarkdown = useMemo(() => {
    const updatedDate = lastSyncedDate || lastScanDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    const effectiveCompany = companyName?.trim() || cleanDomain || "example.com"
    
    let md = `# Cookie Policy for ${cleanDomain || "example.com"}\n\n`
    md += `*Last updated: ${updatedDate}*\n\n`
    
    md += `## ${aboutHeading}\n`
    md += `${aboutDescription}\n\n`
    
    md += `## ${useHeading}\n`
    md += `${useDescription}\n\n`
    
    md += `## ${typesHeading}\n`
    md += `**Live Cookie Table (${activeCookies.length} active cookies)**\n\n`
    md += `*Automatically rendered and synchronized from your website scans.*\n\n`

    if (activeCookies.length > 0) {
      md += `| Cookie Name | Category | Service Provider | Expiration |\n`
      md += `| :--- | :--- | :--- | :--- |\n`
      activeCookies.forEach((c) => {
        md += `| \`${c.name}\` | ${c.category} | ${c.service_name || cleanDomain} | ${c.duration || "Session"} |\n`
      })
      md += `\n`
    }

    md += `## ${prefHeading}\n`
    md += `[Consent Preferences](javascript:void(0))\n\n`
    md += `${prefDescription}\n`

    return md
  }, [cleanDomain, companyName, activeCookies, lastSyncedDate, lastScanDate])

  // Generated HTML perfectly matching CMP
  const generatedHtml = useMemo(() => {
    const updatedDate = lastSyncedDate || lastScanDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    const effectiveCompany = companyName?.trim() || cleanDomain || "example.com"
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cookie Policy - ${cleanDomain}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; }
    
    body, .legal-page-container {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-weight: 400;
      line-height: 1.7;
      color: #475569;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .legal-hero {
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid #e2e8f0;
      background-color: #f8fafc;
      padding: 64px 24px 56px 24px;
      text-align: center;
      margin-bottom: 40px;
    }

    .legal-hero-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 55%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 55%, transparent 100%);
      pointer-events: none;
    }

    .legal-hero-content {
      position: relative;
      max-width: 640px;
      margin: 0 auto;
    }

    .legal-eyebrow {
      font-size: 13.5px;
      font-weight: 500;
      color: #1868db;
      margin: 0 0 10px 0;
      letter-spacing: 0.02em;
    }

    .legal-hero-title {
      font-size: 38px;
      font-weight: 500;
      color: #0f172a;
      margin: 0 0 14px 0;
      letter-spacing: -0.02em;
      line-height: 1.25;
    }

    @media (max-width: 640px) {
      .legal-hero-title { font-size: 28px; }
      .legal-hero { padding: 48px 16px 40px 16px; }
    }

    .legal-subtitle {
      font-size: 15.5px;
      color: #64748b;
      margin: 0 auto;
      line-height: 1.6;
      max-width: 580px;
    }

    .legal-body {
      max-width: 768px;
      margin: 0 auto;
      padding: 0 24px 64px 24px;
    }

    .legal-last-updated {
      font-size: 13.5px;
      color: #64748b;
      margin-bottom: 32px;
    }

    h2, .legal-h2 {
      font-size: 20px;
      font-weight: 500;
      color: #0f172a;
      margin: 36px 0 14px 0;
      letter-spacing: -0.01em;
    }

    p, li {
      font-size: 15px;
      font-weight: 400;
      color: #475569;
      margin: 0 0 16px 0;
      line-height: 1.7;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 13px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      background: #ffffff;
    }

    th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #0f172a;
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
    }
    th:last-child { border-right: none; }

    td {
      padding: 12px 14px;
      color: #475569;
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
    }
    td:last-child { border-right: none; }
    tr:last-child td { border-bottom: none; }

    .btn-revisit {
      display: inline-flex;
      align-items: center;
      padding: 8px 18px;
      background: #1868db;
      color: #ffffff !important;
      text-decoration: none !important;
      border-radius: 6px;
      font-weight: 500;
      font-size: 13px;
      margin: 12px 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      transition: background 0.15s ease;
    }
    .btn-revisit:hover {
      background: #1559be;
    }
  </style>
</head>
<body>
  <div class="legal-page-container">
    <div class="legal-hero">
      <div class="legal-hero-grid" aria-hidden="true"></div>
      <div class="legal-hero-content">
        <p class="legal-eyebrow">Legal</p>
        <h1 class="legal-hero-title">Cookie Policy</h1>
        <p class="legal-subtitle">How ${effectiveCompany} uses cookies and tracking technologies across the ${cleanDomain} website.</p>
      </div>
    </div>

    <div class="legal-body">
      <div class="legal-last-updated">Last updated: ${updatedDate}</div>

      <h2>${aboutHeading}</h2>
      ${aboutDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("")}

      <h2>${useHeading}</h2>
      ${useDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("")}

      <h2>${typesHeading}</h2>
      <div id="usrly-cookie-declaration" data-domain="${cleanDomain}"></div>

      <h2>${prefHeading}</h2>
      <p><a href="javascript:void(0)" onclick="if(window.UserlyCMP)window.UserlyCMP.openPreferences()" class="btn-revisit">Consent Preferences</a></p>
      ${prefDescription.split("\n\n").map((p) => `<p>${p}</p>`).join("")}
    </div>
  </div>

  <script defer src="https://usrly-five.vercel.app/script.js"></script>
</body>
</html>`
  }, [cleanDomain, companyName, activeCookies, lastSyncedDate, lastScanDate])

  return {
    cookies: activeCookies,
    discoveredCookies,
    isLoading,
    isSyncing,
    lastScanDate,
    lastSyncedDate,
    totalCookiesCount: activeCookies.length,
    hasPendingSync,
    pendingCount,
    isAutoSyncActive: isGrowthPlus,
    isGrowthPlus,
    syncCookies,
    categorizedCount,
    aboutHeading,
    aboutDescription,
    useHeading,
    useDescription,
    typesHeading,
    prefHeading,
    prefDescription,
    browserLinks,
    generatedMarkdown,
    generatedHtml,
  }
}
