import React from "react"
import { Info, AlertTriangle, Lightbulb, ShieldAlert } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

interface DocsCalloutProps {
  type?: "info" | "tip" | "warning" | "important"
  title?: string
  children: React.ReactNode
  className?: string
}

export function DocsCallout({
  type = "info",
  title,
  children,
  className,
}: DocsCalloutProps) {
  const styles = {
    info: {
      border: "border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200",
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
      defaultTitle: "Note",
    },
    tip: {
      border: "border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200",
      icon: <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
      defaultTitle: "Tip",
    },
    warning: {
      border: "border-amber-500/25 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200",
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
      defaultTitle: "Warning",
    },
    important: {
      border: "border-purple-500/25 bg-purple-50/60 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200",
      icon: <ShieldAlert className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />,
      defaultTitle: "Important",
    },
  }

  const current = styles[type]

  return (
    <div
      className={cn(
        "my-6 flex gap-3.5 rounded-xl border p-4 text-sm leading-relaxed shadow-xs",
        current.border,
        className
      )}
    >
      {current.icon}
      <div className="flex-1 space-y-1">
        {title && <p className="font-semibold">{title || current.defaultTitle}</p>}
        <div className="text-sm opacity-90 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
