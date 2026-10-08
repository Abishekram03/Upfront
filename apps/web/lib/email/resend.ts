/**
 * Resend Email Integration & Transactional Templates for UpFront
 * 
 * Provides unified email sending for:
 * - Better Auth verification & password resets
 * - Two-Factor Authentication (MFA OTP)
 * - User onboarding & welcome series
 * - Cookie compliance scanner completion & new tracker discovery alerts
 */

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Base email dispatcher calling Resend's REST API.
 * Uses default testing domain "onboarding@resend.dev" until custom domain is connected.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const defaultFrom =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "UpFront <onboarding@resend.dev>"

  const recipientList = Array.isArray(to) ? to : [to]

  if (!apiKey) {
    console.warn(
      `[Resend Email] RESEND_API_KEY is not set. Email not sent.\n` +
      `To: ${recipientList.join(", ")}\n` +
      `Subject: ${subject}\n`
    )
    return {
      success: false,
      error: "RESEND_API_KEY environment variable is missing",
    }
  }

  try {
    const payload: Record<string, any> = {
      from: from || defaultFrom,
      to: recipientList,
      subject,
      html,
    }

    if (text) payload.text = text
    if (replyTo) payload.reply_to = replyTo

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      console.error("[Resend API Error]:", data)
      return {
        success: false,
        error: data?.message || `HTTP ${res.status}: Failed to send email via Resend`,
      }
    }

    return {
      success: true,
      id: data?.id,
    }
  } catch (err: any) {
    console.error("[Resend Network Exception]:", err)
    return {
      success: false,
      error: err?.message || "Internal network error while communicating with Resend",
    }
  }
}

// ============================================================================
// BRANDED HTML EMAIL TEMPLATE WRAPPER (UpFront)
// ============================================================================

function baseEmailTemplate({
  headline,
  bodyContent,
  footerText,
}: {
  headline: string
  bodyContent: string
  footerText?: string
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usrly-five.vercel.app"

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #334155;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      padding: 28px 32px 20px 32px;
      border-bottom: 1px solid #f1f5f9;
      background: #ffffff;
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      text-decoration: none;
      letter-spacing: -0.02em;
    }
    .logo span {
      color: #1868db;
    }
    .content {
      padding: 32px;
    }
    .h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    p {
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 15px;
      color: #475569;
    }
    .btn {
      display: inline-block;
      background-color: #1868db;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .code-box {
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      font-family: monospace;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 6px;
      text-align: center;
      color: #0f172a;
      margin: 24px 0;
    }
    .badge-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .footer {
      padding: 24px 32px;
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer a {
      color: #64748b;
      text-decoration: underline;
    }
    .subtext {
      font-size: 13px;
      color: #94a3b8;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="${appUrl}" class="logo">UpFront<span>.</span></a>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p style="margin-bottom: 6px;">${footerText || "Privacy-First Analytics & Consent Management Platform"}</p>
        <p style="margin-bottom: 0;">© ${new Date().getFullYear()} UpFront (Syft Technologies). All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

// ============================================================================
// 1. EMAIL VERIFICATION
// ============================================================================

export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
}: {
  to: string
  name?: string
  verificationUrl: string
}): Promise<SendEmailResult> {
  const greeting = name ? `Hi ${name},` : "Hello,"
  const html = baseEmailTemplate({
    headline: "Verify your UpFront account",
    bodyContent: `
      <h1 class="h1">Verify your email address</h1>
      <p>${greeting}</p>
      <p>Thanks for getting started with UpFront! Please confirm your email address by clicking the button below:</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${verificationUrl}" class="btn" target="_blank">Verify Email Address</a>
      </div>
      
      <p class="subtext">If the button above does not work, copy and paste this URL into your browser:<br><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p class="subtext">This link is valid for 24 hours. If you did not sign up for an account with UpFront, you can safely ignore this email.</p>
    `,
  })

  return sendEmail({
    to,
    subject: "Verify your email address — UpFront",
    html,
    text: `${greeting}\n\nPlease verify your email address by visiting:\n${verificationUrl}\n\nThis link will expire in 24 hours.`,
  })
}

// ============================================================================
// 2. PASSWORD RESET
// ============================================================================

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string
  name?: string
  resetUrl: string
}): Promise<SendEmailResult> {
  const greeting = name ? `Hi ${name},` : "Hello,"
  const html = baseEmailTemplate({
    headline: "Reset your UpFront password",
    bodyContent: `
      <h1 class="h1">Reset your password</h1>
      <p>${greeting}</p>
      <p>We received a request to reset the password for your UpFront account. Click the button below to choose a new password:</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      </div>
      
      <p class="subtext">If you did not request a password reset, you can safely ignore this email — your account remains completely secure.</p>
      <p class="subtext">This password reset link will expire in 1 hour.</p>
    `,
  })

  return sendEmail({
    to,
    subject: "Reset your UpFront password",
    html,
    text: `${greeting}\n\nReset your password here:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
  })
}

// ============================================================================
// 3. TWO-FACTOR AUTHENTICATION (MFA OTP)
// ============================================================================

export async function sendMfaOtpEmail({
  to,
  name,
  otp,
}: {
  to: string
  name?: string
  otp: string
}): Promise<SendEmailResult> {
  const greeting = name ? `Hi ${name},` : "Hello,"
  const html = baseEmailTemplate({
    headline: "Your UpFront Verification Code",
    bodyContent: `
      <h1 class="h1">Two-Factor Authentication Code</h1>
      <p>${greeting}</p>
      <p>Use the following 6-digit security code to complete your login to UpFront:</p>
      
      <div class="code-box">${otp}</div>
      
      <p class="subtext">This one-time code expires in 10 minutes. Never share this code with anyone.</p>
    `,
  })

  return sendEmail({
    to,
    subject: `${otp} is your UpFront verification code`,
    html,
    text: `${greeting}\n\nYour UpFront 2FA security code is: ${otp}\nValid for 10 minutes.`,
  })
}

// ============================================================================
// 4. WELCOME ONBOARDING EMAIL
// ============================================================================

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string
  name?: string
}): Promise<SendEmailResult> {
  const greeting = name ? `Hi ${name},` : "Welcome,"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usrly-five.vercel.app"

  const html = baseEmailTemplate({
    headline: "Welcome to UpFront",
    bodyContent: `
      <h1 class="h1">Welcome to UpFront 🎉</h1>
      <p>${greeting}</p>
      <p>You're now ready to deploy lightweight cookie consent, auto-updating legal policies, and privacy-friendly web analytics in a single script tag.</p>
      
      <div class="badge-card">
        <strong style="color: #0f172a; display: block; margin-bottom: 8px;">🚀 Quick Start in 3 Steps:</strong>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569;">
          <li style="margin-bottom: 6px;">Add your website domain in the Dashboard.</li>
          <li style="margin-bottom: 6px;">Run a live cookie scan to automatically discover trackers.</li>
          <li style="margin-bottom: 0;">Embed your single script tag into your website.</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${appUrl}/dashboard" class="btn" target="_blank">Go to Dashboard</a>
      </div>
      
      <p>If you have any questions or need help setting up Google Consent Mode v2 or custom policies, just reply directly to this email!</p>
    `,
  })

  return sendEmail({
    to,
    subject: "Welcome to UpFront — Getting Started",
    html,
    text: `${greeting}\n\nWelcome to UpFront! Go to your dashboard to get started:\n${appUrl}/dashboard`,
  })
}

// ============================================================================
// 5. COOKIE SCAN COMPLETED REPORT
// ============================================================================

export async function sendScanCompletedEmail({
  to,
  domain,
  cookiesFound,
  scriptsFound,
  leaksFound,
}: {
  to: string
  domain: string
  cookiesFound: number
  scriptsFound: number
  leaksFound: number
}): Promise<SendEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usrly-five.vercel.app"
  const scanUrl = `${appUrl}/dashboard/consent/scanner?domain=${encodeURIComponent(domain)}`

  const html = baseEmailTemplate({
    headline: `Cookie Audit Report for ${domain}`,
    bodyContent: `
      <h1 class="h1">Scan Completed: ${domain}</h1>
      <p>Your scheduled cookie compliance audit has completed successfully. Here is the summary of discovered trackers:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #0f172a;">Active Cookies Discovered</td>
          <td style="padding: 12px 16px; font-size: 16px; font-weight: 700; color: #1868db; text-align: right;">${cookiesFound}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #0f172a;">Third-Party Scripts</td>
          <td style="padding: 12px 16px; font-size: 16px; font-weight: 700; color: #475569; text-align: right;">${scriptsFound}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #0f172a;">Pre-Consent Leaks</td>
          <td style="padding: 12px 16px; font-size: 16px; font-weight: 700; color: ${leaksFound > 0 ? '#dc2626' : '#16a34a'}; text-align: right;">
            ${leaksFound > 0 ? `${leaksFound} detected` : '0 (Compliant)'}
          </td>
        </tr>
      </table>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${scanUrl}" class="btn" target="_blank">View Live Audit Report</a>
      </div>
      
      <p class="subtext">Your Cookie Policy and Preference Center have been synchronized automatically.</p>
    `,
  })

  return sendEmail({
    to,
    subject: `Cookie Audit Report: ${cookiesFound} cookies discovered on ${domain}`,
    html,
    text: `Cookie Audit Report for ${domain}\n\n- Cookies Discovered: ${cookiesFound}\n- Scripts: ${scriptsFound}\n- Pre-Consent Leaks: ${leaksFound}\n\nView report: ${scanUrl}`,
  })
}

// ============================================================================
// 6. NEW TRACKING COOKIE ALERT
// ============================================================================

export async function sendNewCookieAlertEmail({
  to,
  domain,
  newCookies,
}: {
  to: string
  domain: string
  newCookies: Array<{ name: string; category?: string; service_name?: string }>
}): Promise<SendEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usrly-five.vercel.app"
  const scanUrl = `${appUrl}/dashboard/consent/scanner?domain=${encodeURIComponent(domain)}`

  const itemsList = newCookies
    .slice(0, 5)
    .map(
      (c) =>
        `<li style="margin-bottom: 6px;"><code>${c.name}</code> (${c.category || "Uncategorized"}${
          c.service_name ? ` — ${c.service_name}` : ""
        })</li>`
    )
    .join("")

  const html = baseEmailTemplate({
    headline: `New Cookies Detected on ${domain}`,
    bodyContent: `
      <h1 class="h1" style="color: #b45309;">⚠️ New Tracking Cookies Detected</h1>
      <p>Our automated compliance scanner detected <strong>${newCookies.length} new cookies</strong> on <strong>${domain}</strong> that were not previously declared in your policy:</p>
      
      <div class="badge-card" style="background-color: #fffbeb; border-color: #fde68a;">
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #92400e;">
          ${itemsList}
        </ul>
        ${
          newCookies.length > 5
            ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #b45309;">+ ${newCookies.length - 5} more cookies</p>`
            : ""
        }
      </div>
      
      <p>To remain compliant with GDPR and ePrivacy directives, please review and classify these cookies in your dashboard.</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${scanUrl}" class="btn" style="background-color: #d97706;" target="_blank">Review & Classify Cookies</a>
      </div>
    `,
  })

  return sendEmail({
    to,
    subject: `[Action Required] New cookies detected on ${domain}`,
    html,
    text: `New cookies detected on ${domain}:\n\n${newCookies.map((c) => `- ${c.name} (${c.category || "Uncategorized"})`).join("\n")}\n\nReview now: ${scanUrl}`,
  })
}
