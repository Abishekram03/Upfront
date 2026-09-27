import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  serverExternalPackages: ["playwright", "playwright-core", "pg"],
}

export default nextConfig
