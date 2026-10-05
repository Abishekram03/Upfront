import path from "path"
import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  serverExternalPackages: ["playwright", "playwright-core", "pg"],
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
}

export default withSentryConfig(nextConfig, {
  // Suppresses verbose logs during build if auth token is omitted
  silent: !process.env.CI,
  // Tree-shakes Sentry logger statements to minimize bundle footprint
  disableLogger: true,
})
