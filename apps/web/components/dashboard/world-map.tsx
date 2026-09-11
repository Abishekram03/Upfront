"use client"

import React, { useState, memo, useMemo } from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { BreakdownItem } from "@/lib/api"

// Standard real world TopoJSON atlas from world-atlas
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

export interface WorldMapProps {
  locations?: BreakdownItem[]
}

function getChoroplethColor(percentage?: number): string {
  if (!percentage || percentage <= 0) return "#f3f4f6" // Light gray for untracked/zero
  if (percentage >= 30) return "#6366f1" // Deep Indigo (>30%)
  if (percentage >= 15) return "#818cf8" // Indigo (15-30%)
  if (percentage >= 8) return "#a5b4fc"  // Medium Violet (8-15%)
  if (percentage >= 4) return "#c7d2fe"  // Soft Violet (4-8%)
  return "#e0e7ff"                       // Light Lavender (<4%)
}

export const WorldMap = memo(function WorldMap({ locations = [] }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{
    name: string
    visitors: number
    percentage: number
    flag?: string | null
    x: number
    y: number
  } | null>(null)

  // Map locations by lowercase name or ISO code for fast lookup
  const locationMap = useMemo(() => {
    const map: Record<string, BreakdownItem> = {}
    locations.forEach((item) => {
      map[item.label.toLowerCase()] = item
      if (item.id) map[item.id.toLowerCase()] = item
    })
    return map
  }, [locations])

  return (
    <div className="relative w-full h-[240px] flex items-center justify-center bg-neutral-50/60 rounded-xl overflow-hidden border border-neutral-100 select-none">
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
              const geoId = String(geo.id || "").toLowerCase()
              const geoName = String(geo.properties?.name || "").toLowerCase()
              const stat = locationMap[geoId] || locationMap[geoName]
              const fillColor = getChoroplethColor(stat?.percentage)

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
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
                      fill: stat ? "#4f46e5" : "#e5e7eb",
                      stroke: "#ffffff",
                      strokeWidth: 0.75,
                      outline: "none",
                      cursor: stat ? "pointer" : "default",
                    },
                    pressed: {
                      fill: "#4338ca",
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
          className="fixed pointer-events-none z-50 rounded-xl border border-neutral-800 bg-neutral-900/95 px-3 py-2 text-white shadow-2xl backdrop-blur-xs min-w-[130px] animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${tooltip.x + 12}px`,
            top: `${tooltip.y - 45}px`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{tooltip.flag}</span>
            <span className="text-xs font-bold text-neutral-100">{tooltip.name}</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-3 text-[11px]">
            <span className="text-neutral-400">Visitors:</span>
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

