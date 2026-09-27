import { NextRequest, NextResponse } from "next/server"
import { pool, ensureTables } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// SSRF Guard: check for private, reserved, loopback, or cloud-metadata IP/host
function isBlockedTarget(hostname: string): boolean {
  const host = hostname.toLowerCase().trim()
  if (!host) return true

  // Cloud metadata services
  if (
    host === "169.254.169.254" ||
    host === "metadata.google.internal" ||
    host === "instance-data" ||
    host.endsWith(".internal")
  ) {
    return true
  }

  // IPv4 Private & Reserved Ranges
  // 10.0.0.0/8
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  // 127.0.0.0/8
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  // 169.254.0.0/16
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  // 172.16.0.0/12
  const octets172 = host.split(".")
  if (octets172.length === 4 && octets172[0] === "172") {
    const second = parseInt(octets172[1] || "", 10)
    if (second >= 16 && second <= 31) return true
  }
  // 192.168.0.0/16
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true
  // 0.0.0.0
  if (host === "0.0.0.0" || host === "0") return true

  // IPv6 Loopback & Link-local
  if (host === "::1" || host === "[::1]" || host.startsWith("fe80:") || host.startsWith("fc00:") || host.startsWith("fd00:")) {
    return true
  }

  return false
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawDomain = searchParams.get("domain") || searchParams.get("url") || ""

  // 1. Validate domain parameter presence
  if (!rawDomain || rawDomain.trim().length === 0) {
    return NextResponse.json({ error: "Domain parameter is required" }, { status: 400 })
  }

  let normalizedInput = rawDomain.trim()
  if (!normalizedInput.startsWith("http://") && !normalizedInput.startsWith("https://")) {
    if (normalizedInput.startsWith("localhost") || normalizedInput.startsWith("127.0.0.1")) {
      normalizedInput = `http://${normalizedInput}`
    } else {
      normalizedInput = `https://${normalizedInput}`
    }
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(normalizedInput)
  } catch {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
  }

  // Enforce HTTP / HTTPS protocols only
  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid protocol. Only HTTP and HTTPS are permitted." }, { status: 400 })
  }

  const hostname = targetUrl.hostname.toLowerCase()

  const safetyScript = `
    <script>
      (function() {
        window.__USRLY_PREVIEW_MODE__ = true;
        try {
          var origPushState = window.history.pushState;
          var origReplaceState = window.history.replaceState;
          window.history.pushState = function(state, title, url) {
            try { origPushState.apply(window.history, arguments); } catch(e) {}
          };
          window.history.replaceState = function(state, title, url) {
            try { origReplaceState.apply(window.history, arguments); } catch(e) {}
          };
        } catch(e) {}

        try {
          var style = document.createElement("style");
          style.id = "usrly-preview-suppress-styles";
          style.textContent = "#usrly-cmp-root, #usrly-revisit-root, .usrly-banner-wrapper, .usrly-modal-overlay { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }";
          (document.head || document.documentElement).appendChild(style);
        } catch(e) {}

        document.addEventListener("click", function(e) {
          var target = e.target.closest("a");
          if (target && target.href) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);
        document.addEventListener("submit", function(e) {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      })();
    </script>
  `

  // 2. Simulated Local Canvas Bypass
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "preview" ||
    hostname.includes("preview-canvas")
  ) {
    const simulatedHtml = `<!DOCTYPE html><html><head><title>Preview Canvas</title></head><body style="font-family:sans-serif;background:#f8fafc;padding:32px;"><div style="max-width:800px;margin:0 auto;background:#ffffff;padding:24px;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);"><h2 style="color:#0f172a;margin-top:0;">Preview Canvas</h2><p style="color:#64748b;font-size:14px;line-height:1.6;">Simulated Website Environment</p></div></body></html>`
    const baseTag = `<base href="http://localhost:3000/" />`
    const html = `<head>${baseTag}${safetyScript}</head>${simulatedHtml}`
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Frame-Options": "ALLOWALL",
      },
    })
  }

  // 3. SSRF Blocking for Private / Cloud Metadata Networks
  if (isBlockedTarget(hostname)) {
    return NextResponse.json({ error: "Access to private or metadata network targets is forbidden." }, { status: 403 })
  }

  // 4. Server-Side Site Authorization Check
  try {
    await ensureTables()
    const siteResult = await pool.query(
      "SELECT id, domain FROM sites WHERE domain = $1 OR domain = $2 LIMIT 1",
      [hostname, targetUrl.host]
    )

    // If domain is not registered in the system, render secure preview fallback without egress
    if (siteResult.rows.length === 0) {
      const fallbackHtml = `<!DOCTYPE html><html><head>${safetyScript}</head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#64748b;"><div style="text-align:center;padding:24px;"><h3>Preview Canvas</h3><p style="font-size:13px;color:#94a3b8;">${hostname}</p></div></body></html>`
      return new NextResponse(fallbackHtml, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    }
  } catch (dbErr) {
    console.warn("Site verification error in preview-proxy:", dbErr)
  }

  // 5. Fetch registered live site with timeout
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    let response: Response
    try {
      response = await fetch(targetUrl.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: controller.signal,
        next: { revalidate: 60 },
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      return new NextResponse(
        `<!DOCTYPE html><html><head>${safetyScript}</head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#64748b;"><div style="text-align:center;"><h3>Could not load ${hostname}</h3><p style="font-size:13px;">HTTP Status: ${response.status} ${response.statusText}</p></div></body></html>`,
        {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      )
    }

    let html = await response.text()

    // Inject <base href="..."> so relative scripts, styles, images resolve to target domain
    const baseTag = `<base href="${targetUrl.origin}/" />`

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${baseTag}${safetyScript}`)
    } else if (html.includes("<HEAD>")) {
      html = html.replace("<HEAD>", `<HEAD>${baseTag}${safetyScript}`)
    } else {
      html = `${baseTag}${safetyScript}${html}`
    }

    // Return HTML with stripped frame headers and framing permissions enabled
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Frame-Options": "ALLOWALL",
      },
    })
  } catch {
    return new NextResponse(
      `<!DOCTYPE html><html><head>${safetyScript}</head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#64748b;"><div style="text-align:center;"><h3>Preview Canvas</h3><p style="font-size:13px;color:#94a3b8;">${hostname}</p></div></body></html>`,
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    )
  }
}
