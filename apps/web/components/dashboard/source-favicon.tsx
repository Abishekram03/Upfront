"use client"

import React, { useState } from "react"
import { Compass, Globe } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface SourceFaviconProps {
  label: string
  className?: string
  size?: number
}

// Extract or resolve domain for common names and raw URLs
export function resolveDomain(source: string): string | null {
  if (!source) return null
  const clean = source.trim().toLowerCase()
  if (
    clean === "direct" ||
    clean === "direct / none" ||
    clean === "none" ||
    clean === "unknown" ||
    clean === "internal" ||
    clean.includes("direct")
  ) {
    return null
  }

  const map: Record<string, string> = {
    google: "google.com",
    github: "github.com",
    twitter: "x.com",
    "twitter / x": "x.com",
    "t.co": "x.com",
    x: "x.com",
    linkedin: "linkedin.com",
    reddit: "reddit.com",
    facebook: "facebook.com",
    "facebook / meta": "facebook.com",
    instagram: "instagram.com",
    youtube: "youtube.com",
    duckduckgo: "duckduckgo.com",
    bing: "bing.com",
    yahoo: "yahoo.com",
    baidu: "baidu.com",
    yandex: "yandex.com",
    "hacker news": "news.ycombinator.com",
    hackernews: "news.ycombinator.com",
    "product hunt": "producthunt.com",
    producthunt: "producthunt.com",
    vercel: "vercel.com",
    medium: "medium.com",
    substack: "substack.com",
    tiktok: "tiktok.com",
    threads: "threads.net",
    pinterest: "pinterest.com",
    slack: "slack.com",
    discord: "discord.com",
    wikipedia: "wikipedia.org",
    whatsapp: "whatsapp.com",
    telegram: "telegram.org",
    twitch: "twitch.tv",
    notion: "notion.so",
    gitlab: "gitlab.com",
    stackoverflow: "stackoverflow.com",
    "stack overflow": "stackoverflow.com",
    dribbble: "dribbble.com",
    behance: "behance.net",
    figma: "figma.com",
  }

  if (map[clean]) return map[clean]

  for (const [key, val] of Object.entries(map)) {
    if (clean.includes(key)) return val
  }

  // If it's already a domain or URL
  const domainMatch = clean.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split("/")[0]?.split("?")[0]
  if (domainMatch && domainMatch.includes(".")) {
    return domainMatch
  }

  // Default assumption for alphanumeric words
  if (/^[a-z0-9-]+$/.test(clean)) {
    return `${clean}.com`
  }

  return null
}

export function SourceFavicon({ label, className, size = 16 }: SourceFaviconProps) {
  const [imgError, setImgError] = useState(false)
  const isDirect = !label || label.trim().toLowerCase().includes("direct") || label.trim().toLowerCase() === "none"
  const domain = resolveDomain(label)

  if (isDirect) {
    return (
      <div className={cn("flex size-4 items-center justify-center rounded-[3px] bg-blue-50 text-[#1868db] shrink-0", className)}>
        <Compass className="size-3 text-[#1868db]" />
      </div>
    )
  }

  if (!domain || imgError) {
    return (
      <div className={cn("flex size-4 items-center justify-center rounded-[3px] bg-slate-100 text-slate-400 shrink-0", className)}>
        <Globe className="size-3 text-slate-400" />
      </div>
    )
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`

  return (
    <div className={cn("size-4 rounded-[3px] overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60", className)}>
      <img
        src={faviconUrl}
        alt={label}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setImgError(true)}
        className="size-3.5 object-contain"
      />
    </div>
  )
}

