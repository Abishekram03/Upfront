import path from "path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  serverExternalPackages: ["playwright", "playwright-core", "pg"],
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
}

export default nextConfig
