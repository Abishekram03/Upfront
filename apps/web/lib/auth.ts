import { betterAuth } from "better-auth"
import { twoFactor } from "better-auth/plugins"
import { pool, ensureTables } from "./db"
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMfaOtpEmail,
} from "./email/resend"

const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

export const auth: any = betterAuth({
  appName: "UpFront",
  database: pool,
  baseURL: getBaseURL(),
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "https://userly-five.vercel.app",
    "https://usrly-five.vercel.app",
    "https://upfront.syfttechnologies.com",
    process.env.NEXT_PUBLIC_APP_URL || "",
    process.env.BETTER_AUTH_URL || "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "",
  ].filter(Boolean),
  secret: process.env.BETTER_AUTH_SECRET || "usrly_super_secret_auth_key_2026_dev",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendVerificationEmail({ user, url }: { user: any; url: string }) {
      console.log(`[Better Auth] Sending verification email to ${user.email}`)
      await sendVerificationEmail({
        to: user.email,
        name: user.name || user.email.split("@")[0],
        verificationUrl: url,
      })
    },
    async sendResetPassword({ user, url }: { user: any; url: string }) {
      console.log(`[Better Auth] Sending password reset email to ${user.email}`)
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name || user.email.split("@")[0],
        resetUrl: url,
      })
    },
  },
  plugins: [
    twoFactor({
      issuer: "UpFront",
      otpOptions: {
        async sendOTP({ user, otp }: { user: any; otp: string }) {
          console.log(`[Better Auth] Sending 2FA OTP to ${user.email}`)
          await sendMfaOtpEmail({
            to: user.email,
            name: user.name || user.email.split("@")[0],
            otp,
          })
        },
      },
    }),
  ],
})

export async function initAuthDatabase() {
  await ensureTables()
}
