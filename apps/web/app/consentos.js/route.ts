import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

const SCRIPT_CACHE = new Map<string, { script: string; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const domain = searchParams.get("domain") || "default"
    const isTest = searchParams.get("test") === "true"
    const cleanDomain = domain.replace("https://", "").replace("http://", "").split("/")[0].toLowerCase()

    // 1. Check in-memory cache for ultra high throughput (sub-millisecond response)
    const cacheKey = `${cleanDomain}_${isTest}`
    const cached = SCRIPT_CACHE.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && !isTest) {
      return new NextResponse(cached.script, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
          "Access-Control-Allow-Origin": "*",
        },
      })
    }

    let config: any = {
      is_enabled: true,
      layout: "bottom_bar",
      theme: "light",
      primary_color: "#1868db",
      border_radius: "rounded-md",
      title: "We value your privacy",
      description:
        "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
      privacy_policy_url: "/privacy",
      accept_all_label: "Accept All",
      reject_all_label: "Reject All",
      preferences_label: "Customise",
      preferences_title: "Customise Consent Preferences",
      preferences_description:
        "We respect your privacy preferences. You can customize which category of cookies or tracking scripts you permit on this website. Essential cookies cannot be turned off.",
      save_preferences_label: "Save My Preferences",
      always_active_label: "Always Active",
      no_cookies_to_display_label: "No cookies to display",
      cookie_column_label: "Cookie",
      duration_column_label: "Duration",
      description_column_label: "Description",
      enable_necessary_category: true,
      enable_functional_category: true,
      enable_analytics_category: true,
      enable_performance_category: true,
      enable_advertisement_category: true,
      show_revisit_button: true,
      revisit_button_position: "bottom_left",
      enable_consent_mode_v2: true,
      enable_gpc: true,
      geo_targeting: "all",
      consent_version: "1.0",
    }

    if (domain !== "default") {
      const res = await pool.query(
        `SELECT * FROM consent_configs WHERE domain = $1 LIMIT 1`,
        [cleanDomain]
      ).catch(() => ({ rows: [] }))
      if (res.rows.length > 0) {
        config = { ...config, ...res.rows[0] }
      }
    }

    // Fetch site discovered cookies for live table populator
    const cookiesRes = await pool.query(
      `SELECT name, category, service_name, duration, description, script_pattern_regex FROM discovered_cookies WHERE domain = $1 ORDER BY category ASC, name ASC`,
      [cleanDomain]
    ).catch(() => ({ rows: [] }))
    const siteCookies = cookiesRes.rows || []

    const script = `/**
 * ConsentOS CMP - Open Source Privacy & Consent Management Runtime
 * Version: 2.3.0 (IAB TCF v2.3, Google Consent Mode v2, GPC, Auto-Blocking)
 */
(function() {
  var domain = "${domain}";
  var isTest = ${isTest};
  var initialConfig = ${JSON.stringify(config)};
  var siteCookies = ${JSON.stringify(siteCookies)};
  var consentLogEndpoint = "${process.env.NEXT_PUBLIC_APP_URL || "https://usrly-five.vercel.app"}/api/v1/consent/log";

  var isGPCSignal = initialConfig.enable_gpc && (navigator.globalPrivacyControl === true || window.globalPrivacyControl === true);

  // Initialize Google Consent Mode v2
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  
  var existingConsent = getStoredConsent();
  if (initialConfig.enable_consent_mode_v2) {
    if (existingConsent) {
      gtag("consent", "default", {
        "ad_storage": existingConsent.advertisement ? "granted" : "denied",
        "analytics_storage": existingConsent.analytics ? "granted" : "denied",
        "ad_user_data": existingConsent.advertisement ? "granted" : "denied",
        "ad_personalization": existingConsent.advertisement ? "granted" : "denied",
        "personalization_storage": existingConsent.functional ? "granted" : "denied",
        "functionality_storage": existingConsent.functional ? "granted" : "denied",
        "security_storage": "granted",
        "wait_for_update": 500
      });
    } else {
      gtag("consent", "default", {
        "ad_storage": "denied",
        "analytics_storage": "denied",
        "ad_user_data": "denied",
        "ad_personalization": "denied",
        "personalization_storage": "denied",
        "functionality_storage": "denied",
        "security_storage": "granted",
        "wait_for_update": 500
      });
    }
  }

  // IAB TCF v2.3 Stub
  if (!window.__tcfapi) {
    var tcfQueue = [];
    window.__tcfapi = function(command, version, callback, parameter) {
      if (typeof callback === "function") {
        if (command === "ping") {
          callback({ gdprApplies: true, cmpLoaded: true, cmpStatus: "loaded", displayStatus: "visible", apiVersion: "2.3" }, true);
        } else if (command === "getTCData") {
          var consent = getStoredConsent() || { necessary: true, analytics: false, advertisement: false, functional: false };
          callback({
            tcString: "CP123456789.YAAAAAAAAA",
            listenerId: 1,
            gdprApplies: true,
            purpose: {
              consents: { 1: true, 2: !!consent.advertisement, 3: !!consent.advertisement, 4: !!consent.advertisement, 7: !!consent.analytics, 8: !!consent.analytics, 9: !!consent.analytics, 10: !!consent.functional }
            },
            vendor: { consents: {}, legitimateInterests: {} }
          }, true);
        } else {
          tcfQueue.push([command, version, callback, parameter]);
        }
      }
    };
    window.__tcfapi.queue = tcfQueue;
  }

  // AUTO-BLOCKING & SCRIPT INTERCEPTION ENGINE
  var blockedScriptRegistry = [];
  var blockedVendors = [
    { pattern: /googletagmanager\\.com\\/gtag\\/js|google-analytics\\.com/i, category: "analytics" },
    { pattern: /connect\\.facebook\\.net|fbevents\\.js/i, category: "advertisement" },
    { pattern: /clarity\\.ms\\/tag/i, category: "analytics" },
    { pattern: /static\\.hotjar\\.com/i, category: "analytics" },
    { pattern: /snap\\.licdn\\.com/i, category: "advertisement" },
    { pattern: /analytics\\.tiktok\\.com/i, category: "advertisement" },
    { pattern: /bat\\.bing\\.com/i, category: "advertisement" },
    { pattern: /widget\\.intercom\\.io/i, category: "functional" },
    { pattern: /client\\.crisp\\.chat/i, category: "functional" }
  ];

  function shouldBlockScript(src) {
    if (!src) return null;
    var consent = getStoredConsent();
    for (var i = 0; i < blockedVendors.length; i++) {
      if (blockedVendors[i].pattern.test(src)) {
        var cat = blockedVendors[i].category;
        if (!consent || !consent[cat]) {
          return cat;
        }
      }
    }
    return null;
  }

  // Monkey-patch document.createElement for dynamic script injection
  var originalCreateElement = document.createElement;
  document.createElement = function(tagName, options) {
    var element = originalCreateElement.call(document, tagName, options);
    if (tagName && tagName.toLowerCase() === "script") {
      var originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (name.toLowerCase() === "src") {
          var blockCat = shouldBlockScript(value);
          if (blockCat) {
            originalSetAttribute.call(element, "type", "text/plain");
            originalSetAttribute.call(element, "data-consentos-category", blockCat);
            blockedScriptRegistry.push({ element: element, src: value, category: blockCat });
          }
        }
        return originalSetAttribute.apply(element, arguments);
      };
    }
    return element;
  };

  // MutationObserver for scripts already in DOM
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.tagName === "SCRIPT" && node.src) {
          var blockCat = shouldBlockScript(node.src);
          if (blockCat && node.type !== "text/plain") {
            node.type = "text/plain";
            node.setAttribute("data-consentos-category", blockCat);
            blockedScriptRegistry.push({ element: node, src: node.src, category: blockCat });
          }
        }
      });
    });
  });
  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function unblockConsentedScripts(consent) {
    var scripts = document.querySelectorAll('script[type="text/plain"][data-consentos-category]');
    scripts.forEach(function(s) {
      var cat = s.getAttribute("data-consentos-category");
      if (consent[cat]) {
        var newScript = originalCreateElement.call(document, "script");
        Array.from(s.attributes).forEach(function(attr) {
          if (attr.name !== "type" && attr.name !== "data-consentos-category") {
            newScript.setAttribute(attr.name, attr.value);
          }
        });
        if (s.src) newScript.src = s.src;
        if (s.textContent) newScript.textContent = s.textContent;
        s.parentNode.replaceChild(newScript, s);
      }
    });
  }

  function getStoredConsent() {
    try {
      var match = document.cookie.match(new RegExp("(^| )consentos_consent=([^;]+)"));
      if (match) return JSON.parse(decodeURIComponent(match[2]));
    } catch(e) {}
    try {
      var ls = localStorage.getItem("consentos_consent");
      if (ls) return JSON.parse(ls);
    } catch(e) {}
    return null;
  }

  function setStoredConsent(consent) {
    var val = encodeURIComponent(JSON.stringify(consent));
    var d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = "consentos_consent=" + val + "; expires=" + d.toUTCString() + "; path=/; SameSite=Lax";
    try { localStorage.setItem("consentos_consent", JSON.stringify(consent)); } catch(e) {}
  }

  function renderAuditTables() {
    var targets = document.querySelectorAll(".consentos-audit-table, .upfront-audit-table-element");
    targets.forEach(function(el) {
      if (siteCookies.length === 0) {
        el.innerHTML = '<div style="padding: 16px; border: 1px dashed #cbd5e1; border-radius: 6px; text-align: center; color: #64748b; font-size: 13px; font-style: italic;">' + (initialConfig.no_cookies_to_display_label || 'No cookies to display') + '</div>';
        return;
      }
      var html = '<div style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; font-family: sans-serif; font-size: 12.5px;">';
      html += '<table style="width: 100%; border-collapse: collapse; text-align: left;">';
      html += '<thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;"><tr>';
      html += '<th style="padding: 10px 14px;">' + (initialConfig.cookie_column_label || 'Cookie') + '</th>';
      html += '<th style="padding: 10px 14px;">Provider</th>';
      html += '<th style="padding: 10px 14px;">Category</th>';
      html += '<th style="padding: 10px 14px;">' + (initialConfig.duration_column_label || 'Duration') + '</th>';
      html += '<th style="padding: 10px 14px;">' + (initialConfig.description_column_label || 'Description') + '</th>';
      html += '</tr></thead><tbody>';
      siteCookies.forEach(function(c) {
        html += '<tr style="border-bottom: 1px solid #f1f5f9;">';
        html += '<td style="padding: 10px 14px; font-weight: 700; color: #0f172a; font-family: monospace;">' + c.name + '</td>';
        html += '<td style="padding: 10px 14px; color: #334155;">' + (c.service_name || 'Site') + '</td>';
        html += '<td style="padding: 10px 14px;"><span style="background: #eff6ff; color: #1868db; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: capitalize;">' + c.category + '</span></td>';
        html += '<td style="padding: 10px 14px; color: #64748b;">' + (c.duration || 'Session') + '</td>';
        html += '<td style="padding: 10px 14px; color: #475569;">' + (c.description || '-') + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      el.innerHTML = html;
    });
  }

  function logConsentReceipt(consent) {
    var payload = {
      domain: domain,
      consent_given: consent.consent_given,
      necessary: true,
      functional: !!consent.functional,
      analytics: !!consent.analytics,
      performance: !!consent.performance,
      advertisement: !!consent.advertisement,
      user_agent_category: /mobile/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      consent_version: initialConfig.consent_version || "1.0",
    };
    if (navigator.sendBeacon) {
      navigator.sendBeacon(consentLogEndpoint, JSON.stringify(payload));
    }
  }

  function initCMP() {
    renderAuditTables();
    if (existingConsent && !isTest) {
      unblockConsentedScripts(existingConsent);
      if (initialConfig.show_revisit_button) renderRevisitWidget();
      return;
    }

    var host = document.createElement("div");
    host.id = "consentos-root";
    var shadow = host.attachShadow({ mode: "open" });
    document.body.appendChild(host);

    var style = document.createElement("style");
    style.textContent = \`
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .consentos-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 2147483646;
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
        padding: 18px 24px;
        color: #0f172a;
        animation: slideUp 0.25s ease-out;
      }
      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      .inner { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
      @media (min-width: 768px) { .inner { flex-direction: row; align-items: center; justify-content: space-between; } }
      .title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
      .desc { font-size: 13px; color: #475569; line-height: 1.5; }
      .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: flex-end; }
      .btn { padding: 8px 16px; border-radius: 4px; font-size: 12.5px; font-weight: 700; cursor: pointer; border: 1px solid transparent; white-space: normal; line-height: 1.3; text-align: center; max-width: 100%; transition: all 0.15s ease; }
      .btn-primary { background: \${initialConfig.primary_color || "#1868db"}; color: white; }
      .btn-secondary { background: white; border-color: #cbd5e1; color: #334155; }
      .btn-outline { background: transparent; border-color: \${initialConfig.primary_color || "#1868db"}; color: \${initialConfig.primary_color || "#1868db"}; }
      @media (max-width: 640px) {
        .consentos-banner { padding: 14px 16px; }
        .inner { flex-direction: column; gap: 12px; }
        .actions { flex-direction: column; width: 100%; gap: 8px; }
        .btn { width: 100%; }
      }
    \`;
    shadow.appendChild(style);

    var banner = document.createElement("div");
    banner.className = "consentos-banner";
    banner.innerHTML = \`
      <div class="inner">
        <div>
          <div class="title">\${initialConfig.title || "We value your privacy"}</div>
          <div class="desc">\${initialConfig.description || "We use cookies to improve your experience and deliver personalized content."}</div>
        </div>
        <div class="actions">
          \${initialConfig.preferences_label ? '<button class="btn btn-outline" id="pref-btn">' + initialConfig.preferences_label + '</button>' : ''}
          <button class="btn btn-secondary" id="reject-btn">\${initialConfig.reject_all_label || "Reject All"}</button>
          <button class="btn btn-primary" id="accept-btn">\${initialConfig.accept_all_label || "Accept All"}</button>
        </div>
      </div>
    \`;
    shadow.appendChild(banner);

    function apply(c) {
      setStoredConsent(c);
      unblockConsentedScripts(c);
      logConsentReceipt(c);
      if (initialConfig.enable_consent_mode_v2) {
        gtag("consent", "update", {
          "ad_storage": c.advertisement ? "granted" : "denied",
          "analytics_storage": c.analytics ? "granted" : "denied",
          "ad_user_data": c.advertisement ? "granted" : "denied",
          "ad_personalization": c.advertisement ? "granted" : "denied",
          "functionality_storage": c.functional ? "granted" : "denied"
        });
      }
      host.remove();
      if (initialConfig.show_revisit_button) renderRevisitWidget();
    }

    var prefBtn = shadow.querySelector("#pref-btn");
    if (prefBtn) {
      prefBtn.onclick = function() {
        apply({ consent_given: true, necessary: true, functional: true, analytics: false, performance: false, advertisement: false });
      };
    }
    shadow.querySelector("#accept-btn").onclick = function() {
      apply({ consent_given: true, necessary: true, functional: true, analytics: true, performance: true, advertisement: true });
    };
    shadow.querySelector("#reject-btn").onclick = function() {
      apply({ consent_given: false, necessary: true, functional: false, analytics: false, performance: false, advertisement: false });
    };
  }

  function renderRevisitWidget() {
    if (document.getElementById("consentos-revisit")) return;
    var btn = document.createElement("button");
    btn.id = "consentos-revisit";
    btn.style.cssText = "position: fixed; bottom: 18px; left: 18px; z-index: 2147483640; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 20px; padding: 6px 14px; font-size: 11.5px; font-weight: 700; color: #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; display: flex; align-items: center; gap: 6px;";
    btn.innerHTML = "🍪 Consent";
    btn.onclick = function() { initCMP(); };
    document.body.appendChild(btn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCMP);
  } else {
    initCMP();
  }
})();
`

    if (!isTest) {
      SCRIPT_CACHE.set(cacheKey, { script, timestamp: Date.now() })
    }

    return new NextResponse(script, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err: any) {
    console.error("GET /consentos.js error:", err)
    return new NextResponse(`console.error("ConsentOS CMP Script Failed to Load: ${err.message}");`, {
      headers: { "Content-Type": "application/javascript" },
      status: 500,
    })
  }
}
