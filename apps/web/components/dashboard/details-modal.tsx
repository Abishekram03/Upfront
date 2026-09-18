"use client"

import { useState } from "react"
import { X, Search, Download, ExternalLink } from "lucide-react"
import { SourceFavicon } from "./source-favicon"

export interface DetailItem {
  id: string
  label: string
  sublabel?: string
  value: number | string
  percentage?: number
  icon?: any
  link?: string
}

interface DetailsModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  columns: { label: string; key: string; align?: "left" | "right" }[]
  items: DetailItem[]
  onSelectItem?: (item: DetailItem) => void
}

export function DetailsModal({
  open,
  onClose,
  title,
  columns,
  items,
  onSelectItem,
}: DetailsModalProps) {
  const [search, setSearch] = useState("")

  if (!open) return null

  const isSourcesModal = title.toLowerCase().includes("source") || title.toLowerCase().includes("referrer")

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    (item.sublabel && item.sublabel.toLowerCase().includes(search.toLowerCase()))
  )

  const leftColumnTitle = columns[0]?.label || "Item"
  const rightColumnTitle = columns[1]?.label || "Visitors"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[88vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Table Column Headers */}
        <div className="flex items-center justify-between px-6 py-2.5 text-xs font-semibold text-neutral-500 border-b border-neutral-100 bg-neutral-50/40">
          <span>{leftColumnTitle}</span>
          <span>{rightColumnTitle}</span>
        </div>

        {/* Rows List with Horizontal Progress Fill */}
        <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-neutral-100/60">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-400">
              No matching entries found
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon
              const pct = item.percentage || 0

              return (
                <div
                  key={item.id || index}
                  onClick={() => onSelectItem?.(item)}
                  title="Double-click or click to filter by this record"
                  className="group relative flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neutral-100/80 cursor-pointer transition-colors text-xs font-medium overflow-hidden my-0.5"
                >
                  {/* Background Progress Bar (Light Indigo/Blue tint) */}
                  {pct > 0 && (
                    <div
                      style={{ width: `${pct}%` }}
                      className="absolute inset-y-0 left-0 bg-blue-50/70 -z-10 rounded transition-all group-hover:bg-blue-100/60"
                    />
                  )}

                  {/* Left Column (Icon + Flag + Label) */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-4 z-10 truncate">
                    {isSourcesModal ? (
                      <SourceFavicon label={item.label} />
                    ) : (
                      <>
                        {typeof item.icon === "string" && (
                          <span className="text-sm shrink-0 leading-none">{item.icon}</span>
                        )}
                        {Icon && typeof Icon === "function" && (
                          <Icon className="size-4 text-neutral-600 shrink-0" />
                        )}
                      </>
                    )}
                    <span className="font-medium text-neutral-900 truncate">
                      {item.label}
                    </span>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-neutral-400 hover:text-neutral-700 inline-flex shrink-0"
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>

                  {/* Right Column (Visitors & Percentage) */}
                  <div className="flex items-baseline gap-1 shrink-0 z-10 font-mono">
                    <span className="font-bold text-neutral-900">
                      {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
                    </span>
                    {pct > 0 && (
                      <span className="text-[11px] text-neutral-500 font-sans">
                        ({pct}%)
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-100 bg-neutral-50/60 text-xs text-neutral-500">
          <span>{filtered.length} total entries</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-1 rounded-md hover:bg-neutral-200/60 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
