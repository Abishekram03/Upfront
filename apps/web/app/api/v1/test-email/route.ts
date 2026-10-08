import { NextResponse } from "next/server"
import {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMfaOtpEmail,
  sendWelcomeEmail,
  sendScanCompletedEmail,
} from "@/lib/email/resend"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { to, type = "welcome" } = body

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email ('to') is required" },
        { status: 400 }
      )
    }

    let result
    switch (type) {
      case "verification":
        result = await sendVerificationEmail({
          to,
          name: "Test Founder",
          verificationUrl: "https://usrly-five.vercel.app/verify-email?token=test_token_123",
        })
        break
      case "password_reset":
        result = await sendPasswordResetEmail({
          to,
          name: "Test Founder",
          resetUrl: "https://usrly-five.vercel.app/reset-password?token=test_token_123",
        })
        break
      case "mfa_otp":
        result = await sendMfaOtpEmail({
          to,
          name: "Test Founder",
          otp: "849201",
        })
        break
      case "scan_completed":
        result = await sendScanCompletedEmail({
          to,
          domain: "example.com",
          cookiesFound: 8,
          scriptsFound: 4,
          leaksFound: 0,
        })
        break
      case "welcome":
      default:
        result = await sendWelcomeEmail({
          to,
          name: "Test Founder",
        })
        break
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test ${type} email dispatched successfully via Resend`,
      resendId: result.id,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to dispatch test email" },
      { status: 500 }
    )
  }
}
