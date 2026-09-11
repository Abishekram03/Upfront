import { betterAuth } from "better-auth"
import { twoFactor } from "better-auth/plugins"
import { pool, ensureTables } from "./db"

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

// Ensure database tables exist in Supabase
ensureTables().catch((err) => {
  console.error("[Better Auth] ensureTables failed:", err)
})

export const auth: any = betterAuth({
  appName: "usrly",
  database: pool,
  baseURL: getBaseURL(),
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://usrly-five.vercel.app",
    process.env.NEXT_PUBLIC_APP_URL || "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "",
  ].filter(Boolean),
  secret: process.env.BETTER_AUTH_SECRET || "usrly_super_secret_auth_key_2026_dev",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      console.log(`[Better Auth] Password reset request for ${user.email}: ${url}`)
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
