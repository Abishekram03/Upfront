import * as Sentry from "@sentry/nextjs"

/**
 * Capture security anomalies (rate-limiting triggers, suspicious domains, auth anomalies)
 */
export function captureSecurityEvent(message: string, extra?: Record<string, any>) {
  Sentry.captureMessage(`[SECURITY] ${message}`, {
    level: "warning",
    extra,
  })
}

/**
 * Capture backend API failures with structured request context
 */
export function captureApiError(error: unknown, context?: { route: string; domain?: string; [key: string]: any }) {
  Sentry.withScope((scope: any) => {
    if (context) {
      scope.setExtras(context)
    }
    Sentry.captureException(error)
  })
}

export { Sentry }
