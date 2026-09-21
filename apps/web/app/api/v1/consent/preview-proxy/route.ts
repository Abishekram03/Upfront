import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  let domain = searchParams.get("domain") || searchParams.get("url") || ""

  if (!domain) {
    return new NextResponse("Domain parameter is required", { status: 400 })
  }

  // Normalize URL
  if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
    domain = `https://${domain}`
  }

  try {
    const targetUrl = new URL(domain)

    const response = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      return new NextResponse(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#64748b;"><div style="text-align:center;"><h3>Could not load ${domain}</h3><p style="font-size:13px;">HTTP Status: ${response.status} ${response.statusText}</p></div></body></html>`,
        {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      )
    }

    let html = await response.text()

    // 1. Inject <base href="..."> so relative scripts, styles, images resolve to target domain
    const baseTag = `<base href="${targetUrl.origin}/" />`
    
    // 2. Inject preview sandbox safety script (prevent History replaceState errors, disable form submits & link redirects)
    const safetyScript = `
      <script>
        (function() {
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
  } catch (err: any) {
    console.error("Preview proxy error:", err)
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#64748b;"><div style="text-align:center;"><h3>Preview Unavailable</h3><p style="font-size:13px;color:#94a3b8;">${err?.message || "Failed to fetch website"}</p></div></body></html>`,
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    )
  }
}
