import { NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { validateTargetUrl, SSRFValidationError } from "@/lib/scanner/ssrf-protection"

function sanitizeDomain(input?: string | null): string {
  if (!input) return ""
  const first = input.replace(/^https?:\/\//i, "").split("/")[0]
  return (first || "").trim().toLowerCase()
}

/**
 * Checks if HTML contains the UpFront / Userly tracking script tag
 */
export function detectUpfrontScriptInHtml(html: string, expectedDomain?: string): boolean {
  if (!html) return false
  const lower = html.toLowerCase()

  // 1. Check for script.js, upfront.js, or userly.js script source
  const hasScriptTag = /<script\b[^>]*\bsrc=["'][^"']*(script|upfront|userly)\.js(?:[?#][^"']*)?["'][^>]*>/i.test(html)
  
  // 2. Check for generic data-domain script tag matching UpFront pattern
  const hasDataDomainScript = /<script\b[^>]*\bdata-domain=["'][^"']+["'][^>]*>/i.test(html)

  // 3. Check for inline window.usrly, upfront, or userly initialization
  const hasInlineUsrly = /window\.(?:usrly|__usrly|upfront|__upfront)\b/i.test(html)

  if (hasScriptTag || (hasDataDomainScript && (lower.includes("script.js") || lower.includes("upfront") || lower.includes("userly"))) || hasInlineUsrly) {
    return true
  }

  // If expected domain is provided, also check if data-domain matches
  if (expectedDomain && lower.includes(`data-domain="${expectedDomain.toLowerCase()}"`)) {
    return true
  }

  return false
}

export async function POST(req: Request) {
  try {
    await ensureTables()
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const siteId = body.site_id || body.siteId
    let domain = sanitizeDomain(body.domain)

    let siteRecord: any = null

    if (siteId) {
      const sRes = await pool.query(
        `SELECT s.id, s.domain, s.workspace_id, s.name, s.installation_status
         FROM sites s
         LEFT JOIN workspace_members wm ON s.workspace_id = wm.workspace_id
         WHERE s.id = $1 AND (s.user_id = $2 OR wm.user_id = $2)`,
        [siteId, user.id]
      )
      if (sRes.rows.length > 0) {
        siteRecord = sRes.rows[0]
        domain = siteRecord.domain
      }
    } else if (domain) {
      const sRes = await pool.query(
        `SELECT s.id, s.domain, s.workspace_id, s.name, s.installation_status
         FROM sites s
         LEFT JOIN workspace_members wm ON s.workspace_id = wm.workspace_id
         WHERE s.domain = $1 AND (s.user_id = $2 OR wm.user_id = $2)`,
        [domain, user.id]
      )
      if (sRes.rows.length > 0) {
        siteRecord = sRes.rows[0]
      }
    }

    if (!domain) {
      return NextResponse.json({ detail: "Domain is required for verification." }, { status: 400 })
    }

    // SSRF Validation
    let targetUrl = `https://${domain}`
    try {
      await validateTargetUrl(targetUrl)
    } catch (ssrfErr: any) {
      if (ssrfErr instanceof SSRFValidationError) {
        return NextResponse.json(
          {
            success: false,
            status: "verification_failed",
            error: "Security validation failed: Invalid or restricted domain address.",
            message: ssrfErr.message || "Invalid website address.",
          },
          { status: 400 }
        )
      }
    }

    // Perform HTTP verification check
    let detected = false
    let httpErrorMsg = ""

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      // Try HTTPS first
      let res = await fetch(`https://${domain}`, {
        method: "GET",
        headers: {
          "User-Agent": "UpFront-Site-Verification/1.0 (+https://upfront.io/verify)",
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: controller.signal,
        redirect: "follow",
      }).catch(async (err) => {
        // Fallback to HTTP if HTTPS refused
        return await fetch(`http://${domain}`, {
          method: "GET",
          headers: {
            "User-Agent": "UpFront-Site-Verification/1.0 (+https://upfront.io/verify)",
            "Accept": "text/html,application/xhtml+xml",
          },
          signal: controller.signal,
          redirect: "follow",
        })
      })

      if (res && res.ok) {
        const text = await res.text()
        // Check first 512KB
        const snippet = text.slice(0, 524288)
        detected = detectUpfrontScriptInHtml(snippet, domain)
      } else {
        httpErrorMsg = `Website returned HTTP status ${res?.status || "unavailable"}`
      }
    } catch (fetchErr: any) {
      if (fetchErr.name === "AbortError") {
        httpErrorMsg = "Verification timed out. Please verify your website is reachable."
      } else {
        httpErrorMsg = fetchErr.message || "Could not reach website."
      }
    } finally {
      clearTimeout(timeout)
    }

    const newStatus = detected ? "detected" : "verification_failed"

    // Update site installation status in database
    if (siteRecord?.id) {
      await pool.query(
        `UPDATE sites
         SET installation_status = $1, last_verified_at = NOW()
         WHERE id = $2`,
        [newStatus, siteRecord.id]
      )

      // If detected and belongs to a workspace, complete onboarding
      if (detected && siteRecord.workspace_id) {
        await pool.query(
          `UPDATE workspaces
           SET onboarding_completed = TRUE, onboarding_step = 'completed', first_site_id = COALESCE(first_site_id, $1), updated_at = NOW()
           WHERE id = $2`,
          [siteRecord.id, siteRecord.workspace_id]
        )
      }
    }

    if (detected) {
      return NextResponse.json({
        success: true,
        status: "detected",
        domain,
        message: "Your website is connected.",
      })
    } else {
      return NextResponse.json({
        success: false,
        status: "verification_failed",
        domain,
        message: "We couldn't detect the UpFront script yet. Make sure you've published the changes and that the script is installed in your site's <head>.",
        detail: httpErrorMsg || undefined,
      })
    }
  } catch (err: any) {
    console.error("POST /api/v1/sites/verify error:", err)
    return NextResponse.json(
      {
        success: false,
        status: "verification_failed",
        message: "Verification failed due to an unexpected error. Please try again.",
        detail: err.message,
      },
      { status: 500 }
    )
  }
}
