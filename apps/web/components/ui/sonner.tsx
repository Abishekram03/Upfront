"use client"

import React, { useEffect, useState, useCallback } from "react"
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "default" | "success" | "error" | "info" | "warning" | "loading"

export interface ToastOptions {
  id?: string
  description?: React.ReactNode
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
}

export interface ToastItem extends ToastOptions {
  id: string
  type: ToastType
  message: React.ReactNode
  createdAt: number
}

type ToastListener = (toasts: ToastItem[]) => void

class ToastStore {
  private toasts: ToastItem[] = []
  private listeners: Set<ToastListener> = new Set()

  subscribe(listener: ToastListener) {
    this.listeners.add(listener)
    listener(this.toasts)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]))
  }

  add(type: ToastType, message: React.ReactNode, options?: ToastOptions): string {
    const id = options?.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const duration = options?.duration ?? (type === "error" ? 5000 : 3500)
    
    // Remove if already exists with same ID
    this.toasts = this.toasts.filter((t) => t.id !== id)
    
    const newToast: ToastItem = {
      id,
      type,
      message,
      description: options?.description,
      duration,
      action: options?.action,
      cancel: options?.cancel,
      createdAt: Date.now(),
    }

    this.toasts = [newToast, ...this.toasts].slice(0, 5) // keep max 5
    this.notify()

    if (duration > 0 && type !== "loading") {
      setTimeout(() => {
        this.dismiss(id)
      }, duration)
    }

    return id
  }

  dismiss(id?: string) {
    if (id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    } else {
      this.toasts = []
    }
    this.notify()
  }
}

const toastStore = new ToastStore()

export const toast = (message: React.ReactNode, options?: ToastOptions) => {
  return toastStore.add("default", message, options)
}

toast.success = (message: React.ReactNode, options?: ToastOptions) => {
  return toastStore.add("success", message, options)
}

toast.error = (message: React.ReactNode, options?: ToastOptions) => {
  return toastStore.add("error", message, options)
}

toast.info = (message: React.ReactNode, options?: ToastOptions) => {
  return toastStore.add("info", message, options)
}

toast.warning = (message: React.ReactNode, options?: ToastOptions) => {
  return toastStore.add("warning", message, options)
}

toast.loading = (message: React.ReactNode, options?: ToastOptions) => {
  return toastStore.add("loading", message, options)
}

toast.dismiss = (id?: string) => {
  toastStore.dismiss(id)
}

export function Toaster({
  position = "bottom-right",
  className,
}: {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
  className?: string
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    return toastStore.subscribe(setToasts)
  }, [])

  if (toasts.length === 0) return null

  const positionClasses = {
    "top-right": "top-4 right-4 items-end",
    "top-left": "top-4 left-4 items-start",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-left": "bottom-4 left-4 items-start",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  }[position]

  return (
    <div
      aria-live="polite"
      role="region"
      aria-label="Notifications"
      className={cn(
        "fixed z-[9999] flex flex-col gap-2 pointer-events-none max-w-[420px] w-full p-2 select-none",
        positionClasses,
        className
      )}
    >
      {toasts.map((t, idx) => {
        const isSuccess = t.type === "success"
        const isError = t.type === "error"
        const isInfo = t.type === "info"
        const isWarning = t.type === "warning"
        const isLoading = t.type === "loading"

        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto relative w-full flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 ease-out transform",
              "animate-in fade-in-0 slide-in-from-bottom-3 zoom-in-95",
              isSuccess && "bg-emerald-950/90 text-emerald-50 border-emerald-700/60 shadow-emerald-950/30",
              isError && "bg-rose-950/90 text-rose-50 border-rose-700/60 shadow-rose-950/30",
              isInfo && "bg-slate-900/90 text-slate-50 border-slate-700/60 shadow-slate-950/30",
              isWarning && "bg-amber-950/90 text-amber-50 border-amber-700/60 shadow-amber-950/30",
              (t.type === "default" || isLoading) && "bg-slate-900/90 text-white border-slate-800 shadow-2xl"
            )}
            style={{
              zIndex: 100 - idx,
            }}
          >
            {/* Type Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="size-4 text-emerald-400" />}
              {isError && <AlertCircle className="size-4 text-rose-400" />}
              {isInfo && <Info className="size-4 text-sky-400" />}
              {isWarning && <AlertTriangle className="size-4 text-amber-400" />}
              {isLoading && <Loader2 className="size-4 text-slate-300 animate-spin" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="text-xs font-semibold leading-snug break-words">
                {t.message}
              </div>
              {t.description && (
                <div className="text-[11px] opacity-80 mt-1 leading-normal break-words">
                  {t.description}
                </div>
              )}

              {/* Actions */}
              {(t.action || t.cancel) && (
                <div className="flex items-center gap-2 mt-2.5">
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick()
                        toastStore.dismiss(t.id)
                      }}
                      className="text-[11px] font-bold px-2.5 py-1 rounded bg-white text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {t.action.label}
                    </button>
                  )}
                  {t.cancel && (
                    <button
                      type="button"
                      onClick={() => {
                        t.cancel?.onClick?.()
                        toastStore.dismiss(t.id)
                      }}
                      className="text-[11px] font-semibold opacity-75 hover:opacity-100 px-2 py-1 transition-opacity cursor-pointer"
                    >
                      {t.cancel.label}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Close / Dismiss */}
            <button
              type="button"
              onClick={() => toastStore.dismiss(t.id)}
              className="shrink-0 text-white/50 hover:text-white transition-colors p-0.5 rounded cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
