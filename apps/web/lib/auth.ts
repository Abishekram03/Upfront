import { betterAuth } from "better-auth"
import { twoFactor } from "better-auth/plugins"

export const auth = betterAuth({
  appName: "Userly",
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "userly_super_secret_auth_key_2026_dev",
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
      issuer: "Userly",
      otpOptions: {
        async sendOTP({ user, otp }) {
          console.log(`[Better Auth] MFA OTP for ${user.email}: ${otp}`)
        },
      },
    }),
  ],
})
