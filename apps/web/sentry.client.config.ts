import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Replay captures 100% of errors for visual debugging
    replaysOnErrorSampleRate: 1.0,
    // General session sampling for session replays
    replaysSessionSampleRate: 0.1,
    // Performance tracing sample rate
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // PII and Sensitive Data Sanitization before sending to Sentry
    beforeSend(event: any) {
      if (event.request?.headers) {
        delete event.request.headers["authorization"]
        delete event.request.headers["cookie"]
      }
      return event
    },
  })
}
