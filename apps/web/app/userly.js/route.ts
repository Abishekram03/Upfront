import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"

const TRACKER_SCRIPT = `(function () {
  "use strict";

  var currentScript = document.currentScript;
  var domain = (currentScript && currentScript.getAttribute("data-domain")) || window.location.hostname;
  var apiHost = (currentScript && currentScript.getAttribute("data-api")) || (currentScript ? currentScript.src.replace(/\\/userly\\.js.*/, "") : "");
  if (!apiHost) apiHost = window.location.origin;

  var analyticsEndpoint = apiHost + "/api/v1/event";
  var consentConfigEndpoint = apiHost + "/api/v1/consent/config?domain=" + encodeURIComponent(domain);
  var consentLogEndpoint = apiHost + "/api/v1/consent/log";

  var STORAGE_KEY = "usrly_consent_" + domain;
  var consentListeners = [];
  var activeConfig = null;
  var isGPCSignal = typeof navigator !== "undefined" && Boolean(navigator.globalPrivacyControl);

  // 1. CONSENT MANAGEMENT PLATFORM (CMP) CORE STATE
  function getStoredConsent() {
    try {
      var item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  }

  function setStoredConsent(consentObj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consentObj));
    } catch (e) {}
  }

  function isAnalyticsPermitted() {
    var stored = getStoredConsent();
    if (stored) {
      return Boolean(stored.analytics);
    }
    if (isGPCSignal) {
      return false;
    }
    if (activeConfig) {
      if (!activeConfig.is_enabled) return true;
      if (activeConfig.law_template === "notice_only") return true;
      if (activeConfig.law_template === "ccpa") {
        return activeConfig.default_analytics !== false;
      }
      return false;
    }
    return false;
  }

  // 2. COOKIELESS ANALYTICS ENGINE (CONSENT-GATED)
  function sendEvent(name, props) {
    if (!isAnalyticsPermitted()) {
      return;
    }

    var payload = {
      domain: domain,
      name: name || "pageview",
      url: window.location.href,
      referrer: document.referrer || null,
      screen_width: window.innerWidth,
      props: props || null,
    };

    var body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(analyticsEndpoint, body);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", analyticsEndpoint, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(body);
    }
  }

  var lastUrl = window.location.href;
  function triggerPageview() {
    if (!isAnalyticsPermitted()) {
      return;
    }
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
    }
    sendEvent("pageview");
  }

  // SPA History Listeners
  var history = window.history;
  if (history && history.pushState) {
    var originalPush = history.pushState;
    history.pushState = function () {
      originalPush.apply(this, arguments);
      setTimeout(triggerPageview, 50);
    };

    var originalReplace = history.replaceState;
    history.replaceState = function () {
      originalReplace.apply(this, arguments);
      setTimeout(triggerPageview, 50);
    };

    window.addEventListener("popstate", triggerPageview);
  }

  function triggerConsentListeners(consent) {
    for (var i = 0; i < consentListeners.length; i++) {
      try {
        consentListeners[i](consent);
      } catch (e) {
        if (typeof console !== "undefined" && console.error) console.error(e);
      }
    }
  }

  function dispatchGoogleConsent(consent) {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }

    var consentPayload = {
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_storage: (consent.advertisement || consent.marketing) ? "granted" : "denied",
      ad_user_data: (consent.advertisement || consent.marketing) ? "granted" : "denied",
      ad_personalization: (consent.advertisement || consent.marketing) ? "granted" : "denied",
      functionality_storage: consent.functional ? "granted" : "denied",
      personalization_storage: consent.performance ? "granted" : "denied",
      security_storage: "granted",
    };

    try {
      gtag("consent", "update", consentPayload);
      window.dataLayer.push({
        event: "userly_consent_update",
        userly_consent: consent,
      });
    } catch (e) {}
  }

  function unblockGatedScripts(consent) {
    var gatedScripts = document.querySelectorAll(
      'script[type="text/userly-block"], script[type="text/usrly-block"]'
    );
    for (var i = 0; i < gatedScripts.length; i++) {
      var script = gatedScripts[i];
      var category = (script.getAttribute("data-category") || "").toLowerCase().trim();

      var isAllowed = false;
      if (category === "necessary") isAllowed = true;
      else if (category === "functional" && consent.functional) isAllowed = true;
      else if (category === "analytics" && consent.analytics) isAllowed = true;
      else if (category === "performance" && consent.performance) isAllowed = true;
      else if ((category === "advertisement" || category === "marketing") && (consent.advertisement || consent.marketing)) isAllowed = true;

      if (isAllowed) {
        var unblocked = document.createElement("script");
        for (var a = 0; a < script.attributes.length; a++) {
          var attr = script.attributes[a];
          if (attr.name !== "type" && attr.name !== "data-category") {
            unblocked.setAttribute(attr.name, attr.value);
          }
        }
        unblocked.setAttribute("type", "text/javascript");
        unblocked.innerHTML = script.innerHTML;
        if (script.parentNode) {
          script.parentNode.replaceChild(unblocked, script);
        }
      }
    }
  }

  function logConsentReceipt(consent, version) {
    var payload = {
      domain: domain,
      consent_given: consent.consent_given,
      necessary: true,
      functional: !!consent.functional,
      analytics: !!consent.analytics,
      performance: !!consent.performance,
      advertisement: !!(consent.advertisement || consent.marketing),
      user_agent_category: /mobile/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      consent_version: version || (activeConfig && activeConfig.consent_version) || "1.0",
    };

    var body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(consentLogEndpoint, body);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", consentLogEndpoint, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(body);
    }
  }

  function checkAndRenderPolicyDeclaration(storedConsent) {
    var declarationEl = document.getElementById("usrly-cookie-declaration") || document.getElementById("usrly-cookie-policy");
    if (!declarationEl) return;

    var isGranted = function(cat) {
      if (!storedConsent) return "Pending Consent";
      if (cat === "necessary") return "Always Active";
      return storedConsent[cat] ? "Active / Consented" : "Disabled / Blocked";
    };

    declarationEl.innerHTML = \`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; border: 1px solid #e0ebf8; border-radius: 6px; padding: 24px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e0ebf8; padding-bottom: 16px; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">Cookie Declaration for \${domain}</h3>
            <p style="font-size: 12px; color: #64748b; margin: 0;">Verified and updated dynamically by Userly CMP</p>
          </div>
          <button id="usrly-open-prefs-btn" style="background: #1868db; color: #ffffff; border: none; padding: 8px 16px; font-size: 12px; font-weight: 700; border-radius: 4px; cursor: pointer; transition: background 0.2s;">
            Change Consent Preferences
          </button>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left;">
          <thead>
            <tr style="background: #f8fbff; border-bottom: 2px solid #e0ebf8; color: #64748b; font-weight: 700;">
              <th style="padding: 10px 12px;">Category</th>
              <th style="padding: 10px 12px;">Purpose</th>
              <th style="padding: 10px 12px;">Current Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Necessary</td>
              <td style="padding: 10px 12px; color: #475569;">Essential for website security, user authentication, and preference storage.</td>
              <td style="padding: 10px 12px; color: #16a34a; font-weight: 700;">Always Active</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Functional</td>
              <td style="padding: 10px 12px; color: #475569;">Social media sharing widgets, user feedback, and interactive tools.</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">\${isGranted("functional")}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Analytics</td>
              <td style="padding: 10px 12px; color: #475569;">Aggregated cookieless traffic metrics, bounce rate, and referrer data.</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">\${isGranted("analytics")}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Performance</td>
              <td style="padding: 10px 12px; color: #475569;">Page speed monitoring, latency analysis, and crash reporting.</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">\${isGranted("performance")}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Advertisement</td>
              <td style="padding: 10px 12px; color: #475569;">Targeted advertising scripts (Meta Pixel, Google Ads, TikTok).</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">\${isGranted("advertisement")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    \`;

    var btn = declarationEl.querySelector("#usrly-open-prefs-btn");
    if (btn) {
      btn.onclick = function() {
        if (activeConfig) {
          renderCMP(activeConfig, true);
        } else {
          fetchConfigAndRender(true);
        }
      };
    }
  }

  function fetchConfigAndRender(openPreferencesDirectly) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", consentConfigEndpoint, true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          activeConfig = JSON.parse(xhr.responseText);
          renderCMP(activeConfig, openPreferencesDirectly);
        } catch (e) {}
      }
    };
    xhr.send();
  }

  function initCMP() {
    var stored = getStoredConsent();
    checkAndRenderPolicyDeclaration(stored);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", consentConfigEndpoint, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var config = JSON.parse(xhr.responseText);
            activeConfig = config;

            if (!config.is_enabled) {
              triggerPageview();
              return;
            }

            // GPC Signal Check: if GPC enabled & signal present & no explicit storage yet
            if (config.enable_gpc && isGPCSignal && !stored) {
              var gpcConsent = {
                consent_given: false,
                necessary: true,
                functional: false,
                analytics: false,
                performance: false,
                advertisement: false,
                gpc_applied: true,
                consent_version: config.consent_version || "1.0",
                timestamp: new Date().toISOString(),
              };
              setStoredConsent(gpcConsent);
              dispatchGoogleConsent(gpcConsent);
              triggerConsentListeners(gpcConsent);
              renderRevisitButtonOnly(gpcConsent);
              return;
            }

            // Version check: re-prompt if consent_version upgraded
            if (stored && config.consent_version && stored.consent_version && stored.consent_version !== config.consent_version) {
              renderCMP(config);
              return;
            }

            if (stored) {
              if (stored.analytics) {
                triggerPageview();
              }
              dispatchGoogleConsent(stored);
              unblockGatedScripts(stored);
              triggerConsentListeners(stored);
              if (config.show_revisit_button) {
                renderRevisitButtonOnly(stored);
              }
            } else {
              if (config.law_template === "notice_only" || (config.law_template === "ccpa" && config.default_analytics !== false)) {
                triggerPageview();
              }
              renderCMP(config);
            }
          } catch (e) {
            if (isAnalyticsPermitted()) {
              triggerPageview();
            }
          }
        } else {
          if (isAnalyticsPermitted()) {
            triggerPageview();
          }
        }
      }
    };
    xhr.send();
  }

  function renderRevisitButtonOnly(storedConsent) {
    var existingRevisit = document.getElementById("usrly-revisit-root");
    if (existingRevisit) existingRevisit.remove();

    var host = document.createElement("div");
    host.id = "usrly-revisit-root";
    document.body.appendChild(host);
    var shadow = host.attachShadow({ mode: "open" });

    var posClass = "pos-bottom-left";
    var posStyle = "bottom: 18px; left: 18px;";
    if (activeConfig && activeConfig.revisit_button_position === "bottom_right") {
      posStyle = "bottom: 18px; right: 18px;";
    }

    var style = document.createElement("style");
    style.textContent = \`
      .usrly-revisit-btn {
        position: fixed;
        \${posStyle}
        z-index: 2147483645;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: \${(activeConfig && activeConfig.primary_color) || "#1868db"};
        color: #ffffff;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(24, 104, 219, 0.35);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
      }
      .usrly-revisit-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 20px rgba(24, 104, 219, 0.45);
      }
      .usrly-revisit-btn svg {
        width: 22px;
        height: 22px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    \`;
    shadow.appendChild(style);

    var btn = document.createElement("button");
    btn.className = "usrly-revisit-btn";
    btn.title = "Consent Preferences";
    btn.setAttribute("aria-label", "Cookie Consent Preferences");
    btn.innerHTML = \`
      <svg viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5v.01" />
        <path d="M7.5 15.5v.01" />
        <path d="M12 12v.01" />
        <path d="M15.5 15.5v.01" />
      </svg>
    \`;
    btn.onclick = function () {
      host.remove();
      if (activeConfig) {
        renderCMP(activeConfig, true);
      } else {
        fetchConfigAndRender(true);
      }
    };
    shadow.appendChild(btn);
  }

  function renderCMP(config, openPreferencesDirectly) {
    var existingRoot = document.getElementById("usrly-cmp-root");
    if (existingRoot) existingRoot.remove();

    var host = document.createElement("div");
    host.id = "usrly-cmp-root";
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: "open" });
    var primaryColor = config.primary_color || "#1868db";
    var isDark = config.theme === "dark";
    var layout = config.layout || "bottom_bar";

    var radiusMap = {
      "rounded-none": "0px",
      "rounded-sm": "4px",
      "rounded-md": "8px",
      "rounded-lg": "12px",
      "rounded-full": "24px",
    };
    var borderRadius = radiusMap[config.border_radius] || "8px";

    var bgCard = isDark ? "#0f172a" : "#ffffff";
    var textPrimary = isDark ? "#f8fafc" : "#0f172a";
    var textMuted = isDark ? "#94a3b8" : "#475569";
    var borderCard = isDark ? "#334155" : "#e2e8f0";

    var layoutStyles = "";
    if (layout === "top_bar") {
      layoutStyles = \`
        .usrly-banner-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          border-bottom: 1px solid \${borderCard};
          border-radius: 0;
        }
      \`;
    } else if (layout === "floating_bottom_left" || (layout === "box" && config.revisit_button_position !== "bottom_right")) {
      layoutStyles = \`
        .usrly-banner-wrapper {
          position: fixed;
          bottom: 24px;
          left: 24px;
          max-width: 440px;
          width: calc(100% - 32px);
          border-radius: \${borderRadius};
          border: 1px solid \${borderCard};
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
        }
        .usrly-banner-inner {
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        .usrly-btn-group {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          width: 100% !important;
          gap: 6px !important;
        }
        .usrly-btn-group .usrly-btn {
          width: 100% !important;
          padding: 8px 4px !important;
          font-size: 12px !important;
          text-align: center !important;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      \`;
    } else if (layout === "floating_bottom_right" || (layout === "box" && config.revisit_button_position === "bottom_right") || layout === "floating_box") {
      layoutStyles = \`
        .usrly-banner-wrapper {
          position: fixed;
          bottom: 24px;
          right: 24px;
          max-width: 440px;
          width: calc(100% - 32px);
          border-radius: \${borderRadius};
          border: 1px solid \${borderCard};
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
        }
        .usrly-banner-inner {
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        .usrly-btn-group {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          width: 100% !important;
          gap: 6px !important;
        }
        .usrly-btn-group .usrly-btn {
          width: 100% !important;
          padding: 8px 4px !important;
          font-size: 12px !important;
          text-align: center !important;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      \`;
    } else if (layout === "center_modal" || layout === "popup" || layout === "modal") {
      layoutStyles = \`
        .usrly-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(2px);
          z-index: 2147483645;
        }
        .usrly-banner-wrapper {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          max-width: 440px;
          width: calc(100% - 32px);
          border-radius: \${borderRadius};
          border: 1px solid \${borderCard};
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          z-index: 2147483646;
        }
        .usrly-banner-inner {
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        .usrly-btn-group {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          width: 100% !important;
          gap: 6px !important;
        }
        .usrly-btn-group .usrly-btn {
          width: 100% !important;
          padding: 8px 4px !important;
          font-size: 12px !important;
          text-align: center !important;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      \`;
    } else {
      // Default bottom_bar
      layoutStyles = \`
        .usrly-banner-wrapper {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          border-top: 1px solid \${borderCard};
          border-radius: 0;
        }
      \`;
    }

    var style = document.createElement("style");
    style.textContent = \`
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      
      .usrly-banner-wrapper {
        z-index: 2147483646;
        background: \${bgCard};
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
        padding: 20px 24px;
        color: \${textPrimary};
        animation: usrlySlideUp 0.3s ease-out;
      }
      \${layoutStyles}
      @keyframes usrlySlideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .usrly-banner-inner {
        max-width: 1280px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      @media (min-width: 768px) {
        .usrly-banner-inner {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
      }
      .usrly-banner-text {
        flex: 1;
      }
      .usrly-banner-title {
        font-size: 15px;
        font-weight: 700;
        color: \${textPrimary};
        margin-bottom: 4px;
      }
      .usrly-banner-desc {
        font-size: 13px;
        color: \${textMuted};
        line-height: 1.5;
      }
      .usrly-banner-desc a {
        color: \${primaryColor};
        text-decoration: underline;
      }
      .usrly-btn-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      
      .usrly-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 9px 18px;
        font-size: 13px;
        font-weight: 600;
        border-radius: \${borderRadius};
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
        text-decoration: none;
        white-space: nowrap;
      }
      .usrly-btn-primary {
        background: \${primaryColor};
        color: #ffffff;
        border-color: \${primaryColor};
      }
      .usrly-btn-primary:hover {
        filter: brightness(0.92);
      }
      .usrly-btn-outline {
        background: transparent;
        color: \${primaryColor};
        border-color: \${primaryColor};
      }
      .usrly-btn-outline:hover {
        background: \${isDark ? "rgba(24, 104, 219, 0.15)" : "#eff6ff"};
      }
      .usrly-btn-secondary {
        background: \${isDark ? "#1e293b" : "#ffffff"};
        color: \${textPrimary};
        border-color: \${borderCard};
      }
      .usrly-btn-secondary:hover {
        background: \${isDark ? "#334155" : "#f8fafc"};
      }

      @media (max-width: 640px) {
        .usrly-banner-inner {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        .usrly-btn-group {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          width: 100% !important;
          gap: 6px !important;
        }
        .usrly-btn-group .usrly-btn {
          width: 100% !important;
          padding: 8px 4px !important;
          font-size: 11.5px !important;
          text-align: center !important;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      }

      .usrly-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: usrlyFadeIn 0.2s ease-out;
      }
      @keyframes usrlyFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .usrly-modal-card {
        background: \${bgCard};
        width: 100%;
        max-width: 680px;
        max-height: 90vh;
        border-radius: \${borderRadius};
        box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.35);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid \${borderCard};
      }
      .usrly-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 24px;
        border-bottom: 1px solid \${borderCard};
      }
      .usrly-modal-title {
        font-size: 17px;
        font-weight: 700;
        color: \${textPrimary};
      }
      .usrly-modal-close {
        background: transparent;
        border: none;
        cursor: pointer;
        color: \${textMuted};
        font-size: 20px;
        line-height: 1;
        padding: 4px;
      }
      .usrly-modal-close:hover {
        color: \${textPrimary};
      }
      .usrly-modal-body {
        padding: 20px 24px;
        overflow-y: auto;
        flex: 1;
        font-size: 13px;
        color: \${textMuted};
        line-height: 1.55;
      }
      .usrly-intro-text {
        margin-bottom: 18px;
        color: \${textMuted};
      }

      .usrly-category-item {
        border-top: 1px solid \${borderCard};
        padding: 14px 0;
      }
      .usrly-cat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
      }
      .usrly-cat-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .usrly-cat-arrow {
        font-size: 12px;
        color: \${textMuted};
        transition: transform 0.2s;
      }
      .usrly-cat-arrow.expanded {
        transform: rotate(90deg);
      }
      .usrly-cat-title {
        font-size: 14px;
        font-weight: 700;
        color: \${textPrimary};
      }
      .usrly-cat-always-active {
        color: #16a34a;
        font-size: 12px;
        font-weight: 700;
      }
      .usrly-cat-desc {
        padding: 10px 0 4px 20px;
        font-size: 12.5px;
        color: \${textMuted};
        line-height: 1.5;
        display: none;
      }
      .usrly-cat-desc.visible {
        display: block;
      }

      .usrly-switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
      }
      .usrly-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .usrly-slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background-color: \${isDark ? "#334155" : "#cbd5e1"};
        transition: 0.2s;
        border-radius: 24px;
      }
      .usrly-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.2s;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      }
      input:checked + .usrly-slider {
        background-color: \${primaryColor};
      }
      input:checked + .usrly-slider:before {
        transform: translateX(20px);
      }

      .usrly-modal-footer {
        padding: 16px 24px;
        border-top: 1px solid \${borderCard};
        display: flex;
        gap: 10px;
      }
      .usrly-modal-footer .usrly-btn {
        flex: 1;
        padding: 11px;
        font-size: 13.5px;
      }
      .usrly-powered-bar {
        background: \${isDark ? "#0b1120" : "#f8fafc"};
        padding: 8px 24px;
        border-top: 1px solid \${borderCard};
        text-align: right;
        font-size: 11px;
        color: \${textMuted};
      }
      .usrly-powered-bar strong {
        color: \${textPrimary};
      }
    \`;
    shadow.appendChild(style);

    var stored = getStoredConsent();
    var isNoticeOnly = config.law_template === "notice_only";
    var isCCPA = config.law_template === "ccpa";
    var isOptInModel = !isCCPA && !isNoticeOnly;

    var functionalChecked = false;
    var analyticsChecked = false;
    var performanceChecked = false;
    var adChecked = false;

    if (stored) {
      functionalChecked = Boolean(stored.functional);
      analyticsChecked = Boolean(stored.analytics);
      performanceChecked = Boolean(stored.performance);
      adChecked = Boolean(stored.advertisement || stored.marketing);
    } else if (isGPCSignal) {
      functionalChecked = false;
      analyticsChecked = false;
      performanceChecked = false;
      adChecked = false;
    } else if (!isOptInModel) {
      functionalChecked = config.default_functional !== false;
      analyticsChecked = config.default_analytics !== false;
      performanceChecked = config.default_performance !== false;
      adChecked = config.default_advertisement !== false;
    } else {
      functionalChecked = Boolean(config.default_functional);
      analyticsChecked = Boolean(config.default_analytics);
      performanceChecked = Boolean(config.default_performance);
      adChecked = Boolean(config.default_advertisement);
    }

    function applyAndClose(consentData) {
      consentData.consent_version = config.consent_version || "1.0";
      consentData.timestamp = new Date().toISOString();
      setStoredConsent(consentData);
      dispatchGoogleConsent(consentData);
      unblockGatedScripts(consentData);
      logConsentReceipt(consentData, config.consent_version);
      triggerConsentListeners(consentData);
      checkAndRenderPolicyDeclaration(consentData);

      if (consentData.analytics) {
        triggerPageview();
      }

      host.remove();
      if (config.show_revisit_button) {
        renderRevisitButtonOnly(consentData);
      }
    }

    function showPreferencesModal() {
      var existingBanner = shadow.querySelector(".usrly-banner-wrapper");
      if (existingBanner) existingBanner.style.display = "none";

      var overlay = document.createElement("div");
      overlay.className = "usrly-modal-overlay";

      overlay.innerHTML = \`
        <div class="usrly-modal-card">
          <div class="usrly-modal-header">
            <h3 class="usrly-modal-title">\${config.preferences_title || "Customise Consent Preferences"}</h3>
            <button class="usrly-modal-close" id="usrly-close-modal" aria-label="Close">✕</button>
          </div>
          <div class="usrly-modal-body">
            <p class="usrly-intro-text">
              \${config.preferences_description || "We respect your privacy preferences. You can customize which category of cookies or tracking scripts you permit on " + domain + ". Essential cookies cannot be turned off."}
            </p>

            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-nec">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow expanded">›</span>
                  <span class="usrly-cat-title">\${config.necessary_title || "Necessary"}</span>
                </div>
                <span class="usrly-cat-always-active">\${config.always_active_label || "Always Active"}</span>
              </div>
              <div class="usrly-cat-desc visible" id="desc-nec">
                \${config.necessary_description || "Necessary cookies are essential for page rendering, session management, and storing your consent preferences."}
              </div>
            </div>

            \${config.enable_functional_category !== false ? \`
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-func">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow expanded">›</span>
                  <span class="usrly-cat-title">\${config.functional_title || "Functional"}</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-func" \${functionalChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc visible" id="desc-func">
                \${config.functional_description || "Functional features enable live chat widgets, video embeds, language selectors, and interactive tools."}
              </div>
            </div>
            \` : ""}

            \${config.enable_analytics_category !== false ? \`
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-ana">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow expanded">›</span>
                  <span class="usrly-cat-title">\${config.analytics_title || "Analytics"}</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-ana" \${analyticsChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc visible" id="desc-ana">
                \${config.analytics_description || "Analytical cookies help measure traffic, bounce rates, and popular pages to improve website performance."}
              </div>
            </div>
            \` : ""}

            \${config.enable_performance_category !== false ? \`
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-perf">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow expanded">›</span>
                  <span class="usrly-cat-title">\${config.performance_title || "Performance"}</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-perf" \${performanceChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc visible" id="desc-perf">
                \${config.performance_description || "Performance cookies monitor site speed, server response times, and frontend error telemetry."}
              </div>
            </div>
            \` : ""}

            \${config.enable_advertisement_category !== false ? \`
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-ad">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow expanded">›</span>
                  <span class="usrly-cat-title">\${config.advertisement_title || "Advertisement"}</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-ad" \${adChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc visible" id="desc-ad">
                \${config.advertisement_description || "Marketing cookies enable personalized advertising and attribution tracking across third-party platforms."}
              </div>
            </div>
            \` : ""}
          </div>

          <div class="usrly-modal-footer">
            <button class="usrly-btn usrly-btn-secondary" id="usrly-modal-reject">\${config.pref_reject_all_label || config.reject_all_label || "Reject All"}</button>
            <button class="usrly-btn usrly-btn-outline" id="usrly-modal-save">\${config.save_preferences_label || "Save My Preferences"}</button>
            <button class="usrly-btn usrly-btn-primary" id="usrly-modal-accept">\${config.pref_accept_all_label || config.accept_all_label || "Accept All"}</button>
          </div>

          <div class="usrly-powered-bar">
            Powered by <strong>Upfront CMP</strong>
          </div>
        </div>
      \`;

      shadow.appendChild(overlay);

      var headers = overlay.querySelectorAll(".usrly-cat-header");
      headers.forEach(function (h) {
        h.addEventListener("click", function (e) {
          if (e.target.tagName === "INPUT" || e.target.classList.contains("usrly-slider") || e.target.classList.contains("usrly-switch")) {
            return;
          }
          var targetId = h.getAttribute("data-target");
          var desc = overlay.querySelector("#" + targetId);
          var arrow = h.querySelector(".usrly-cat-arrow");
          if (desc) {
            var isVis = desc.classList.toggle("visible");
            if (arrow) arrow.classList.toggle("expanded", isVis);
          }
        });
      });

      function closeModal() {
        overlay.remove();
        if (existingBanner) {
          existingBanner.style.display = "block";
        } else {
          host.remove();
          if (config.show_revisit_button !== false) {
            renderRevisitButtonOnly(getStoredConsent() || stored);
          }
        }
      }

      overlay.querySelector("#usrly-close-modal").onclick = closeModal;
      overlay.onclick = function (e) {
        if (e.target === overlay) {
          closeModal();
        }
      };

      overlay.querySelector("#usrly-modal-accept").onclick = function () {
        applyAndClose({
          consent_given: true,
          necessary: true,
          functional: true,
          analytics: true,
          performance: true,
          advertisement: true,
        });
      };

      var modalReject = overlay.querySelector("#usrly-modal-reject");
      if (modalReject) {
        modalReject.onclick = function () {
          if (isCCPA) {
            applyAndClose({
              consent_given: false,
              necessary: true,
              functional: true,
              analytics: true,
              performance: true,
              advertisement: false,
              ccpa_opted_out: true,
            });
          } else {
            applyAndClose({
              consent_given: false,
              necessary: true,
              functional: false,
              analytics: false,
              performance: false,
              advertisement: false,
            });
          }
        };
      }

      overlay.querySelector("#usrly-modal-save").onclick = function () {
        var funcEl = overlay.querySelector("#usrly-toggle-func");
        var anaEl = overlay.querySelector("#usrly-toggle-ana");
        var perfEl = overlay.querySelector("#usrly-toggle-perf");
        var adEl = overlay.querySelector("#usrly-toggle-ad");

        var funcVal = funcEl ? funcEl.checked : false;
        var anaVal = anaEl ? anaEl.checked : false;
        var perfVal = perfEl ? perfEl.checked : false;
        var adVal = adEl ? adEl.checked : false;

        applyAndClose({
          consent_given: funcVal || anaVal || perfVal || adVal,
          necessary: true,
          functional: funcVal,
          analytics: anaVal,
          performance: perfVal,
          advertisement: adVal,
        });
      };
    }

    if (openPreferencesDirectly) {
      showPreferencesModal();
      return;
    }

    if (layout === "center_modal" || layout === "popup" || layout === "modal") {
      var backdrop = document.createElement("div");
      backdrop.className = "usrly-backdrop";
      shadow.appendChild(backdrop);
    }

    var banner = document.createElement("div");
    banner.className = "usrly-banner-wrapper";
    banner.innerHTML = \`
      <div class="usrly-banner-inner">
        <div class="usrly-banner-text">
          <div class="usrly-banner-title">\${config.title || "We value your privacy"}</div>
          <div class="usrly-banner-desc">
            \${config.description || "We use cookies and privacy-friendly telemetry to analyze site traffic and enhance your browsing experience. Choose your preferences below."}
            \${config.privacy_policy_url ? \`<a href="\${config.privacy_policy_url}" target="_blank" rel="noopener noreferrer">Read Privacy Policy</a>\` : ""}
          </div>
        </div>
        <div class="usrly-btn-group">
          \${!isNoticeOnly ? \`<button class="usrly-btn usrly-btn-outline" id="usrly-btn-customise">\${config.preferences_label || "Customise"}</button>\` : ""}
          \${!isNoticeOnly ? \`<button class="usrly-btn usrly-btn-secondary" id="usrly-btn-reject">\${config.reject_all_label || (isCCPA ? "Do Not Sell My Info" : "Reject All")}</button>\` : ""}
          <button class="usrly-btn usrly-btn-primary" id="usrly-btn-accept">\${config.accept_all_label || (isNoticeOnly ? "Got it!" : (isCCPA ? "Accept & Continue" : "Accept All"))}</button>
        </div>
      </div>
    \`;
    shadow.appendChild(banner);

    var btnAccept = banner.querySelector("#usrly-btn-accept");
    if (btnAccept) {
      btnAccept.onclick = function () {
        applyAndClose({
          consent_given: true,
          necessary: true,
          functional: true,
          analytics: true,
          performance: true,
          advertisement: true,
        });
      };
    }

    var btnReject = banner.querySelector("#usrly-btn-reject");
    if (btnReject) {
      btnReject.onclick = function () {
        if (isCCPA) {
          applyAndClose({
            consent_given: false,
            necessary: true,
            functional: true,
            analytics: true,
            performance: true,
            advertisement: false,
            ccpa_opted_out: true,
          });
        } else {
          applyAndClose({
            consent_given: false,
            necessary: true,
            functional: false,
            analytics: false,
            performance: false,
            advertisement: false,
          });
        }
      };
    }

    var btnCustomise = banner.querySelector("#usrly-btn-customise");
    if (btnCustomise) {
      btnCustomise.onclick = function () {
        showPreferencesModal();
      };
    }
  }

  // 3. EXPOSE DEVELOPER SDK ON window.Userly & window.usrly
  window.Userly = {
    track: function (eventName, props) {
      sendEvent(eventName, props);
    },
    showBanner: function () {
      if (activeConfig) {
        renderCMP(activeConfig, false);
      } else {
        fetchConfigAndRender(false);
      }
    },
    hideBanner: function () {
      var root = document.getElementById("usrly-cmp-root");
      if (root) root.remove();
    },
    showPreferences: function () {
      if (activeConfig) {
        renderCMP(activeConfig, true);
      } else {
        fetchConfigAndRender(true);
      }
    },
    getConsent: function () {
      return getStoredConsent();
    },
    hasConsent: function (category) {
      var c = getStoredConsent();
      if (!c) return false;
      if (category) return Boolean(c[category]);
      return Boolean(c.consent_given);
    },
    onConsent: function (callback) {
      if (typeof callback === "function") {
        consentListeners.push(callback);
        var current = getStoredConsent();
        if (current) {
          try { callback(current); } catch (e) {}
        }
      }
    },
    updateConsent: function (categories) {
      var stored = getStoredConsent() || { necessary: true };
      var wasAnalytics = Boolean(stored.analytics);
      var merged = Object.assign({}, stored, categories);
      merged.consent_given = Boolean(merged.functional || merged.analytics || merged.performance || merged.advertisement);
      setStoredConsent(merged);
      dispatchGoogleConsent(merged);
      unblockGatedScripts(merged);
      logConsentReceipt(merged);
      triggerConsentListeners(merged);
      if (!wasAnalytics && merged.analytics) {
        triggerPageview();
      }
    },
    resetConsent: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      initCMP();
    },
    isGPC: function () {
      return isGPCSignal;
    },
    isAnalyticsAllowed: function () {
      return isAnalyticsPermitted();
    },
    version: "2.1.0",
  };

  window.usrly = function (eventName, props) {
    if (!isAnalyticsPermitted()) return;
    sendEvent(eventName, props);
  };
  window.userly = window.usrly;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCMP);
  } else {
    initCMP();
  }
})();
`

export async function GET() {
  return new NextResponse(TRACKER_SCRIPT, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
