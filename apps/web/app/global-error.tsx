"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans antialiased text-slate-900">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="size-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-xs">
            <AlertCircle className="size-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Something went wrong</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              An unexpected error occurred. Our team has automatically received the crash diagnostics and is looking into it.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1868db] hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="size-3.5" />
              <span>Try again</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
