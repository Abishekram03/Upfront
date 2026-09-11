"use client"

import { BarChart3, ShieldCheck, Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

export type ToolType = "analytics" | "consent"

interface ToolSwitcherProps {
  activeTool: ToolType
  onSelectTool: (tool: ToolType) => void
  isCollapsed?: boolean
}

export const tools = [
  {
    id: "analytics" as const,
    name: "Web Analytics",
    shortName: "Analytics",
    icon: BarChart3,
    description: "Cookieless Traffic & Events",
    badge: "Active",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "consent" as const,
    name: "Consent Manager",
    shortName: "Consent",
    icon: ShieldCheck,
    description: "CookieYes CMP & Script Gating",
    badge: "CookieYes",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
]

export function ToolSwitcher({
  activeTool,
  onSelectTool,
  isCollapsed = false,
}: ToolSwitcherProps) {
  const [open, setOpen] = useState(false)
  const current = tools.find((t) => t.id === activeTool) || tools[0]
  const Icon = current.icon

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white p-2 text-left transition-all hover:border-blue-400 hover:bg-neutral-50/80 shadow-2xs",
          isCollapsed ? "justify-center p-2" : "justify-between"
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white shadow-xs">
            <Icon className="size-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-900 truncate">
                  {current.name}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 truncate">
                {current.description}
              </span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <ChevronsUpDown className="size-4 shrink-0 text-neutral-400" />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[220px] rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Switch Workspace Tool
            </div>
            <div className="space-y-1 pt-1">
              {tools.map((tool) => {
                const ToolIcon = tool.icon
                const isSelected = tool.id === activeTool
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      onSelectTool(tool.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between rounded-md px-2.5 py-2 text-left transition-colors",
                      isSelected
                        ? "bg-blue-50 text-blue-900 font-semibold border border-blue-200/70"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex size-7 items-center justify-center rounded-md border",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-neutral-50 text-neutral-600 border-neutral-200"
                        )}
                      >
                        <ToolIcon className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-neutral-900 truncate">
                          {tool.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 truncate">
                          {tool.description}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="size-3.5 text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
