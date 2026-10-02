"use client"

import { BarChart3, ShieldCheck, FileText, Check, ChevronsUpDown } from "lucide-react"
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
    shortName: "Consent & Legal",
    icon: ShieldCheck,
    description: "Cookie Banner, CMP & Legal Policies",
    badge: "CMP",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
]

export function ToolSwitcher({
  activeTool,
  onSelectTool,
  isCollapsed = false,
}: ToolSwitcherProps) {
  const [open, setOpen] = useState(false)
  const current = tools.find((t) => t.id === activeTool) ?? tools[0] ?? {
    id: "analytics" as const,
    name: "Web Analytics",
    shortName: "Analytics",
    icon: BarChart3,
    description: "Cookieless Traffic & Events",
    badge: "Active",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  }
  const Icon = current.icon

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-[4px] border border-slate-200 bg-white p-2 text-left transition-all hover:border-slate-300 hover:bg-slate-50 shadow-2xs",
          isCollapsed ? "justify-center p-2" : "justify-between"
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[4px] bg-[#1868db] text-white shadow-xs">
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
          <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[220px] rounded-[4px] border border-slate-200 bg-white p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                      "w-full flex items-center justify-between rounded-[4px] px-2.5 py-2 text-left transition-colors",
                      isSelected
                        ? "bg-blue-50 text-[#1868db] font-semibold border border-blue-200/70"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex size-7 items-center justify-center rounded-[4px] border",
                          isSelected
                            ? "bg-[#1868db] text-white border-[#1868db]"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                      >
                        <ToolIcon className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {tool.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {tool.description}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="size-3.5 text-[#1868db] shrink-0 ml-2" />
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
