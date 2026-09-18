"use client"

import React, { useState, memo, useMemo } from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { BreakdownItem } from "@/lib/api"

// Standard real world TopoJSON atlas from world-atlas
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

export interface WorldMapProps {
  locations?: BreakdownItem[]
  onSelectCountry?: (countryName: string) => void
}

// Graduated Blue-600 palette based on visitor percentage
function getChoroplethColor(percentage?: number): string {
  if (!percentage || percentage <= 0) return "#f1f5f9" // Untracked / zero (slate-100)
  if (percentage >= 60) return "#1e40af" // Deep Blue-800 (60-100%, e.g. 67% India)
  if (percentage >= 40) return "#1d4ed8" // Rich Blue-700 (40-60%)
  if (percentage >= 25) return "#2563eb" // Brand Blue-600 (25-40%, e.g. 33% US)
  if (percentage >= 15) return "#3b82f6" // Mid Blue-500 (15-25%)
  if (percentage >= 8)  return "#60a5fa" // Soft Blue-400 (8-15%)
  if (percentage >= 4)  return "#93c5fd" // Pale Blue-300 (4-8%)
  return "#bfdbfe"                       // Light Blue-200 (<4%)
}

// Synonyms and standard ISO codes for reliable TopoJSON matching
const COUNTRY_ALIASES: Record<string, string[]> = {
  "united states": ["united states of america", "usa", "us", "840", "america"],
  "united kingdom": ["great britain", "uk", "gbr", "gb", "826", "england", "scotland", "wales"],
  "india": ["ind", "in", "356", "bharat"],
  "germany": ["deutschland", "deu", "de", "276"],
  "france": ["fra", "fr", "250"],
  "canada": ["can", "ca", "124"],
  "australia": ["aus", "au", "036"],
  "japan": ["jpn", "jp", "392", "nippon"],
  "brazil": ["brasil", "bra", "br", "076"],
  "netherlands": ["nld", "nl", "528", "holland"],
  "spain": ["espana", "esp", "es", "724"],
  "italy": ["italia", "ita", "it", "380"],
  "mexico": ["mex", "mx", "484"],
  "indonesia": ["idn", "id", "360"],
  "philippines": ["phl", "ph", "608"],
  "russian federation": ["russia", "rus", "ru", "643"],
  "poland": ["polska", "pol", "pl", "616"],
  "singapore": ["sgp", "sg", "702"],
  "turkey": ["turkiye", "tur", "tr", "792"],
  "sweden": ["sverige", "swe", "se", "752"],
}

export const WorldMap = memo(function WorldMap({ locations = [], onSelectCountry }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{
    name: string
    visitors: number
    percentage: number
    flag?: string | null
    x: number
    y: number
  } | null>(null)

  // Map locations with all known synonyms and codes for instant lookup
  const locationLookup = useMemo(() => {
    const map: Record<string, BreakdownItem> = {}

    locations.forEach((item) => {
      const labelLower = item.label.toLowerCase().trim()
      map[labelLower] = item

      // Check synonyms
      for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) {
        if (canonical === labelLower || aliases.includes(labelLower)) {
          map[canonical] = item
          aliases.forEach((alias) => {
            map[alias] = item
          })
        }
      }
    })

    return map
  }, [locations])

  return (
    <div className="relative w-full h-[240px] flex items-center justify-center bg-slate-50/50 rounded-xl overflow-hidden border border-slate-100 select-none">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{
          scale: 135,
          center: [0, 0],
        }}
        width={800}
        height={380}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const geoId = String(geo.id || "").toLowerCase().trim()
              const geoName = String(geo.properties?.name || "").toLowerCase().trim()
              const stat = locationLookup[geoId] || locationLookup[geoName]
              const fillColor = getChoroplethColor(stat?.percentage)

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (stat && onSelectCountry) {
                      onSelectCountry(stat.label)
                    }
                  }}
                  onMouseEnter={(e) => {
                    const countryLabel = stat?.label || geo.properties?.name || "Unknown"
                    setTooltip({
                      name: countryLabel,
                      visitors: stat?.value || 0,
                      percentage: stat?.percentage || 0,
                      flag: stat?.icon || "🌐",
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }}
                  onMouseMove={(e) => {
                    setTooltip((prev) =>
                      prev
                        ? {
                            ...prev,
                            x: e.clientX,
                            y: e.clientY,
                          }
                        : null
                    )
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: {
                      fill: fillColor,
                      stroke: "#ffffff",
                      strokeWidth: 0.5,
                      outline: "none",
                      transition: "fill 150ms ease",
                    },
                    hover: {
                      fill: stat ? "#1d4ed8" : "#e2e8f0",
                      stroke: "#ffffff",
                      strokeWidth: 0.75,
                      outline: "none",
                      cursor: stat ? "pointer" : "default",
                    },
                    pressed: {
                      fill: "#1e40af",
                      outline: "none",
                    },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Interactive Tooltip on Hover */}
      {tooltip && (
        <div
          className="fixed pointer-events-none z-50 rounded-xl border border-slate-800 bg-slate-900/95 px-3 py-2 text-white shadow-2xl backdrop-blur-xs min-w-[130px] animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${tooltip.x + 12}px`,
            top: `${tooltip.y - 45}px`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{tooltip.flag}</span>
            <span className="text-xs font-bold text-slate-100">{tooltip.name}</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-3 text-[11px]">
            <span className="text-slate-400">Visitors:</span>
            <span className="font-bold text-white font-mono">
              {tooltip.visitors.toLocaleString()}{" "}
              {tooltip.percentage > 0 && `(${tooltip.percentage}%)`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
})


