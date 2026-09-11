import { betterAuth } from "better-auth"
import { twoFactor } from "better-auth/plugins"
import { DatabaseSync } from "node:sqlite"
import path from "path"

let db: any = undefined
try {
  const dbPath = path.resolve(process.cwd(), "usrly_auth.db")
  db = new DatabaseSync(dbPath)
} catch (err) {
  console.warn("[Better Auth] Could not initialize node:sqlite DatabaseSync, falling back to memory:", err)
}

export const auth = betterAuth({
  appName: "usrly",
  ...(db ? { database: db } : {}),
  baseURL: process.env.NEXT_PUBLIC_APP_URL || undefined,
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

