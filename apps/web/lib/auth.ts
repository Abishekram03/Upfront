import { betterAuth } from "better-auth"
import { twoFactor } from "better-auth/plugins"
import { memoryAdapter } from "better-auth/adapters/memory"
import fs from "node:fs"
import path from "node:path"

const DB_PATH = path.resolve(process.cwd(), "usrly_auth_store.json")

function loadStore(): Record<string, any[]> {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8")
      return JSON.parse(data)
    }
  } catch (err) {
    console.warn("[Better Auth] Failed to read auth store from disk, starting fresh:", err)
  }
  return {}
}

const loaded = loadStore()

// Plain JavaScript object without Proxies so structuredClone inside memoryAdapter works smoothly
const store: Record<string, any[]> = {
  user: loaded.user || [],
  session: loaded.session || [],
  account: loaded.account || [],
  verification: loaded.verification || [],
  twoFactor: loaded.twoFactor || [],
  ...loaded,
}

function persistStore() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), "utf-8")
  } catch (err) {
    console.error("[Better Auth] Failed to save auth store to disk:", err)
  }
}

export const auth: any = betterAuth({
  appName: "usrly",
  database: memoryAdapter(store),
  databaseHooks: {
    user: {
      create: {
        after: async () => persistStore(),
      },
      update: {
        after: async () => persistStore(),
      },
    },
    session: {
      create: {
        after: async () => persistStore(),
      },
      update: {
        after: async () => persistStore(),
      },
      delete: {
        after: async () => persistStore(),
      },
    },
    account: {
      create: {
        after: async () => persistStore(),
      },
      update: {
        after: async () => persistStore(),
      },
    },
    verification: {
      create: {
        after: async () => persistStore(),
      },
      delete: {
        after: async () => persistStore(),
      },
    },
    twoFactor: {
      create: {
        after: async () => persistStore(),
      },
      update: {
        after: async () => persistStore(),
      },
    },
  },
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "usrly_super_secret_auth_key_2026_dev",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      console.log(`[Better Auth] Password reset request for ${user.email}: ${url}`)
      // In production, integrate Resend or SMTP to email the reset URL
    },
  },
  plugins: [
    twoFactor({
      issuer: "usrly",
      otpOptions: {
        async sendOTP({ user, otp }) {
          console.log(`[Better Auth] MFA OTP for ${user.email}: ${otp}`)
        },
      },
    }),
  ],
})


