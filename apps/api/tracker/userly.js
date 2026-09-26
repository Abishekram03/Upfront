(function () {
  "use strict";

  var currentScript = document.currentScript;
  var domain = (currentScript && currentScript.getAttribute("data-domain")) || window.location.hostname;
  var apiHost = (currentScript && currentScript.getAttribute("data-api")) || (currentScript ? currentScript.src.replace(/\/userly\.js.*/, "") : "");
  if (!apiHost) apiHost = window.location.origin;

  var analyticsEndpoint = apiHost + "/api/v1/event";
  var consentConfigEndpoint = apiHost + "/api/v1/consent/config?domain=" + encodeURIComponent(domain);
  var consentLogEndpoint = apiHost + "/api/v1/consent/log";

  var STORAGE_KEY = "usrly_consent_" + domain;
  var activeConfig = null;
  var isGPCSignal = typeof navigator !== "undefined" && Boolean(navigator.globalPrivacyControl);

  // -------------------------------------------------------------
  // 1. CONSENT MANAGEMENT PLATFORM (CMP) CORE STATE
  // -------------------------------------------------------------
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

  function getEffectiveConsent() {
    var stored = getStoredConsent();
    var isGPC = isGPCSignal && (!activeConfig || activeConfig.enable_gpc !== false);

    if (isGPC) {
      if (stored && stored.gpc_explicit_override) {
        return stored;
      }
      var base = stored || {
        necessary: true,
        functional: false,
        analytics: false,
        performance: false,
        advertisement: false,
        consent_version: (activeConfig && activeConfig.consent_version) || "1.0",
      };
      return {
        consent_given: Boolean(base.functional || base.performance),
        necessary: true,
        functional: Boolean(base.functional),
        analytics: false,
        performance: Boolean(base.performance),
        advertisement: false,
        gpc_applied: true,
        consent_version: base.consent_version || (activeConfig && activeConfig.consent_version) || "1.0",
      };
    }

    if (stored) {
      return stored;
    }

    if (activeConfig) {
      if (!activeConfig.is_enabled || activeConfig.law_template === "notice_only") {
        return {
          consent_given: true,
          necessary: true,
          functional: true,
          analytics: true,
          performance: true,
          advertisement: true,
          consent_version: activeConfig.consent_version || "1.0",
        };
      }
      if (activeConfig.law_template === "ccpa") {
        return {
          consent_given: true,
          necessary: true,
          functional: activeConfig.default_functional !== false,
          analytics: activeConfig.default_analytics !== false,
          performance: activeConfig.default_performance !== false,
          advertisement: activeConfig.default_advertisement !== false,
          consent_version: activeConfig.consent_version || "1.0",
        };
      }
      return null;
    }

    return null;
  }

  function isAnalyticsPermitted() {
    var effective = getEffectiveConsent();
    if (effective) {
      return Boolean(effective.analytics);
    }
    return false;
  }

  // -------------------------------------------------------------
  // 2. ANALYTICS ENGINE (CONSENT-GATED)
  // -------------------------------------------------------------
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

  window.usrly = function (eventName, props) {
    if (!isAnalyticsPermitted()) return;
    sendEvent(eventName, props);
  };
  window.userly = window.usrly; // alias

  // Dispatch Google Consent Mode v2 Signals
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
    };

    try {
      gtag("consent", "update", consentPayload);
      window.dataLayer.push({
        event: "usrly_consent_update",
        usrly_consent: consent,
      });
    } catch (e) {}
  }

  // Unblock Gated 3rd-Party Scripts
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

  // Log Proof-of-Consent Receipt
  function logConsentReceipt(consent) {
    var payload = {
      domain: domain,
      consent_given: consent.consent_given,
      necessary: true,
      functional: !!consent.functional,
      analytics: !!consent.analytics,
      performance: !!consent.performance,
      advertisement: !!(consent.advertisement || consent.marketing),
      user_agent_category: /mobile/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
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

  // -------------------------------------------------------------
  // 3. SHADOW DOM BANNER & PREFERENCES MODAL INJECTOR
  // -------------------------------------------------------------
  function checkAndRenderPolicyDeclaration(storedConsent) {
    var declarationEl = document.getElementById("usrly-cookie-declaration") || document.getElementById("usrly-cookie-policy");
    if (!declarationEl) return;

    var isGranted = function(cat) {
      if (!storedConsent) return "Pending Consent";
      if (cat === "necessary") return "Always Active";
      return storedConsent[cat] ? "Active / Consented" : "Disabled / Blocked";
    };

    declarationEl.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; border: 1px solid #e0ebf8; border-radius: 6px; padding: 24px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e0ebf8; padding-bottom: 16px; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">Cookie Declaration for ${domain}</h3>
            <p style="font-size: 12px; color: #64748b; margin: 0;">Verified and updated dynamically by usrly CMP</p>
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
              <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">${isGranted("functional")}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Analytics</td>
              <td style="padding: 10px 12px; color: #475569;">Aggregated cookieless traffic metrics, bounce rate, and referrer data.</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">${isGranted("analytics")}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Performance</td>
              <td style="padding: 10px 12px; color: #475569;">Page speed monitoring, latency analysis, and crash reporting.</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">${isGranted("performance")}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">Advertisement</td>
              <td style="padding: 10px 12px; color: #475569;">Targeted advertising scripts (Meta Pixel, Google Ads, TikTok).</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1868db;">${isGranted("advertisement")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    var btn = declarationEl.querySelector("#usrly-open-prefs-btn");
    if (btn) {
      btn.onclick = function() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", consentConfigEndpoint, true);
        xhr.onload = function () {
          if (xhr.status === 200) {
            renderCMP(JSON.parse(xhr.responseText), true);
          }
        };
        xhr.send();
      };
    }
  }

  function initCMP() {
    var stored = getStoredConsent();
    checkAndRenderPolicyDeclaration(stored);

    if (stored) {
      if (stored.analytics) {
        triggerPageview();
      }
      dispatchGoogleConsent(stored);
      unblockGatedScripts(stored);
      renderRevisitButtonOnly(stored);
      return;
    }

    // Fetch config
    var xhr = new XMLHttpRequest();
    xhr.open("GET", consentConfigEndpoint, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var config = JSON.parse(xhr.responseText);
            if (config.is_enabled) {
              renderCMP(config);
            } else {
              triggerPageview();
            }
          } catch (e) {
            triggerPageview();
          }
        } else {
          triggerPageview();
        }
      }
    };
    xhr.send();
  }

  function renderRevisitButtonOnly(storedConsent) {
    var host = document.createElement("div");
    host.id = "usrly-revisit-root";
    document.body.appendChild(host);
    var shadow = host.attachShadow({ mode: "open" });

    var style = document.createElement("style");
    style.textContent = `
      .usrly-revisit-btn {
        position: fixed;
        bottom: 18px;
        left: 18px;
        z-index: 2147483645;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #1868db;
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
    `;
    shadow.appendChild(style);

    var btn = document.createElement("button");
    btn.className = "usrly-revisit-btn";
    btn.title = "Consent Preferences";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5v.01" />
        <path d="M7.5 15.5v.01" />
        <path d="M12 12v.01" />
        <path d="M15.5 15.5v.01" />
      </svg>
    `;
    btn.onclick = function () {
      host.remove();
      // Re-fetch config to open modal
      var xhr = new XMLHttpRequest();
      xhr.open("GET", consentConfigEndpoint, true);
      xhr.onload = function () {
        if (xhr.status === 200) {
          renderCMP(JSON.parse(xhr.responseText), true);
        }
      };
      xhr.send();
    };
    shadow.appendChild(btn);
  }

  function renderCMP(config, openPreferencesDirectly) {
    var host = document.createElement("div");
    host.id = "usrly-cmp-root";
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: "open" });
    var primaryColor = config.primary_color || "#1868db";

    var style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      
      /* Primary Banner Container */
      .usrly-banner-wrapper {
        position: fixed;
        z-index: 2147483646;
        left: 0;
        right: 0;
        bottom: 0;
        background: #ffffff;
        border-top: 1px solid #e2e8f0;
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
        padding: 20px 24px;
        color: #1e293b;
        animation: usrlySlideUp 0.3s ease-out;
      }
      @keyframes usrlySlideUp {
        from { transform: translateY(100%); opacity: 0; }
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
        color: #0f172a;
        margin-bottom: 4px;
      }
      .usrly-banner-desc {
        font-size: 13px;
        color: #475569;
        line-height: 1.5;
      }
      .usrly-banner-desc a {
        color: ${primaryColor};
        text-decoration: underline;
      }
      .usrly-btn-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      
      /* Rectangular CookieYes Buttons */
      .usrly-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 9px 18px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
        text-decoration: none;
        white-space: nowrap;
      }
      .usrly-btn-primary {
        background: ${primaryColor};
        color: #ffffff;
        border-color: ${primaryColor};
      }
      .usrly-btn-primary:hover {
        filter: brightness(0.92);
      }
      .usrly-btn-outline {
        background: #ffffff;
        color: ${primaryColor};
        border-color: ${primaryColor};
      }
      .usrly-btn-outline:hover {
        background: #eff6ff;
      }
      .usrly-btn-secondary {
        background: #ffffff;
        color: #334155;
        border-color: #cbd5e1;
      }
      .usrly-btn-secondary:hover {
        background: #f8fafc;
        border-color: #94a3b8;
      }

      /* Preferences Center Modal (CookieYes Replica) */
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
        background: #ffffff;
        width: 100%;
        max-width: 680px;
        max-height: 90vh;
        border-radius: 8px;
        box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .usrly-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 24px;
        border-bottom: 1px solid #f1f5f9;
      }
      .usrly-modal-title {
        font-size: 17px;
        font-weight: 700;
        color: #0f172a;
      }
      .usrly-modal-close {
        background: transparent;
        border: none;
        cursor: pointer;
        color: #64748b;
        font-size: 20px;
        line-height: 1;
        padding: 4px;
      }
      .usrly-modal-close:hover {
        color: #0f172a;
      }
      .usrly-modal-body {
        padding: 20px 24px;
        overflow-y: auto;
        flex: 1;
        font-size: 13px;
        color: #334155;
        line-height: 1.55;
        scrollbar-width: thin;
        scrollbar-color: #c7dcf7 transparent;
      }
      .usrly-modal-body::-webkit-scrollbar {
        width: 5px;
      }
      .usrly-modal-body::-webkit-scrollbar-track {
        background: transparent;
      }
      .usrly-modal-body::-webkit-scrollbar-thumb {
        background: #c7dcf7;
        border-radius: 9999px;
      }
      .usrly-modal-body::-webkit-scrollbar-thumb:hover {
        background: #a3c7f3;
      }
      .usrly-intro-text {
        margin-bottom: 18px;
        color: #475569;
      }
      .usrly-show-more {
        color: ${primaryColor};
        font-weight: 600;
        cursor: pointer;
        margin-left: 4px;
      }

      /* Category Accordions */
      .usrly-category-item {
        border-top: 1px solid #f1f5f9;
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
        color: #64748b;
        transition: transform 0.2s;
      }
      .usrly-cat-arrow.expanded {
        transform: rotate(90deg);
      }
      .usrly-cat-title {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
      }
      .usrly-cat-always-active {
        color: #16a34a;
        font-size: 12px;
        font-weight: 700;
      }
      .usrly-cat-desc {
        padding: 10px 0 4px 20px;
        font-size: 12.5px;
        color: #64748b;
        line-height: 1.5;
        display: none;
      }
      .usrly-cat-desc.visible {
        display: block;
      }

      /* iOS Style Toggle Switch */
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
        background-color: #cbd5e1;
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
        background-color: ${primaryColor};
      }
      input:checked + .usrly-slider:before {
        transform: translateX(20px);
      }

      /* Modal Footer Actions */
      .usrly-modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #f1f5f9;
        display: flex;
        gap: 10px;
      }
      .usrly-modal-footer .usrly-btn {
        flex: 1;
        padding: 11px;
        font-size: 13.5px;
      }
      .usrly-powered-bar {
        background: #f8fafc;
        padding: 8px 24px;
        border-top: 1px solid #f1f5f9;
        text-align: right;
        font-size: 11px;
        color: #64748b;
      }
      .usrly-powered-bar strong {
        color: #0f172a;
      }
    `;
    shadow.appendChild(style);

    var functionalChecked = true;
    var analyticsChecked = true;
    var performanceChecked = true;
    var adChecked = true;

    function applyAndClose(consentData) {
      setStoredConsent(consentData);
      dispatchGoogleConsent(consentData);
      unblockGatedScripts(consentData);
      logConsentReceipt(consentData);

      if (consentData.analytics) {
        triggerPageview();
      }

      host.remove();
      renderRevisitButtonOnly(consentData);
    }

    // Modal Builder
    function showPreferencesModal() {
      var existingBanner = shadow.querySelector(".usrly-banner-wrapper");
      if (existingBanner) existingBanner.style.display = "none";

      var overlay = document.createElement("div");
      overlay.className = "usrly-modal-overlay";

      overlay.innerHTML = `
        <div class="usrly-modal-card">
          <div class="usrly-modal-header">
            <h3 class="usrly-modal-title">Customise Consent Preferences</h3>
            <button class="usrly-modal-close" id="usrly-close-modal">✕</button>
          </div>
          <div class="usrly-modal-body">
            <p class="usrly-intro-text">
              We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below.
              The cookies that are categorised as "Necessary" are stored on your browser as they are essential for enabling basic functionalities of the site.
            </p>

            <!-- 1. Necessary -->
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-nec">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow expanded">›</span>
                  <span class="usrly-cat-title">Necessary</span>
                </div>
                <span class="usrly-cat-always-active">Always Active</span>
              </div>
              <div class="usrly-cat-desc visible" id="desc-nec">
                Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences. These cookies do not store any personally identifiable data.
              </div>
            </div>

            <!-- 2. Functional -->
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-func">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow expanded">›</span>
                  <span class="usrly-cat-title">Functional</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-func" ${functionalChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc visible" id="desc-func">
                Functional cookies help perform certain functionalities like sharing the content of the website on social media platforms, collecting feedback, and other third-party features.
              </div>
            </div>

            <!-- 3. Analytics -->
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-ana">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow expanded">›</span>
                  <span class="usrly-cat-title">Analytics</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-ana" ${analyticsChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc visible" id="desc-ana">
                Analytical cookies are used to understand how visitors interact with the website. These cookies help provide information on metrics such as the number of visitors, bounce rate, traffic source, etc.
              </div>
            </div>

            <!-- 4. Performance -->
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-perf">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow expanded">›</span>
                  <span class="usrly-cat-title">Performance</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-perf" ${performanceChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc visible" id="desc-perf">
                Performance cookies are used to understand and analyse the key performance indexes of the website which helps in delivering a better user experience for the visitors.
              </div>
            </div>

            <!-- 5. Advertisement -->
            <div class="usrly-category-item">
              <div class="usrly-cat-header" data-target="desc-ad">
                <div class="usrly-cat-left">
                  <span class="usrly-cat-arrow expanded">›</span>
                  <span class="usrly-cat-title">Advertisement</span>
                </div>
                <label class="usrly-switch">
                  <input type="checkbox" id="usrly-toggle-ad" ${adChecked ? "checked" : ""}>
                  <span class="usrly-slider"></span>
                </label>
              </div>
              <div class="usrly-cat-desc visible" id="desc-ad">
                Advertisement cookies are used to provide visitors with customised advertisements based on the pages you visited previously and to analyse the effectiveness of the ad campaigns.
              </div>
            </div>
          </div>

          <div class="usrly-modal-footer">
            <button class="usrly-btn usrly-btn-primary" id="usrly-modal-reject">Reject All</button>
            <button class="usrly-btn usrly-btn-primary" id="usrly-modal-save">Save My Preferences</button>
            <button class="usrly-btn usrly-btn-primary" id="usrly-modal-accept">Accept All</button>
          </div>

          <div class="usrly-powered-bar">
            Powered by <strong>usrly</strong>
          </div>
        </div>
      `;

      shadow.appendChild(overlay);

      // Accordion click handlers
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

      // Close handler
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

      // Modal Action Handlers
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

      overlay.querySelector("#usrly-modal-reject").onclick = function () {
        applyAndClose({
          consent_given: false,
          necessary: true,
          functional: false,
          analytics: false,
          performance: false,
          advertisement: false,
        });
      };

      overlay.querySelector("#usrly-modal-save").onclick = function () {
        var funcVal = overlay.querySelector("#usrly-toggle-func").checked;
        var anaVal = overlay.querySelector("#usrly-toggle-ana").checked;
        var perfVal = overlay.querySelector("#usrly-toggle-perf").checked;
        var adVal = overlay.querySelector("#usrly-toggle-ad").checked;

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

    // First-visit Banner
    var banner = document.createElement("div");
    banner.className = "usrly-banner-wrapper";
    banner.innerHTML = `
      <div class="usrly-banner-inner">
        <div class="usrly-banner-text">
          <div class="usrly-banner-title">${config.title || "We value your privacy"}</div>
          <div class="usrly-banner-desc">
            ${config.description || "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies."}
            ${config.privacy_policy_url ? `<a href="${config.privacy_policy_url}" target="_blank">Read More</a>` : ""}
          </div>
        </div>
        <div class="usrly-btn-group">
          <button class="usrly-btn usrly-btn-outline" id="usrly-btn-customise">${config.preferences_label || "Customise"}</button>
          <button class="usrly-btn usrly-btn-primary" id="usrly-btn-reject">${config.reject_all_label || "Reject All"}</button>
          <button class="usrly-btn usrly-btn-primary" id="usrly-btn-accept">${config.accept_all_label || "Accept All"}</button>
        </div>
      </div>
    `;
    shadow.appendChild(banner);

    banner.querySelector("#usrly-btn-accept").onclick = function () {
      applyAndClose({
        consent_given: true,
        necessary: true,
        functional: true,
        analytics: true,
        performance: true,
        advertisement: true,
      });
    };

    banner.querySelector("#usrly-btn-reject").onclick = function () {
      applyAndClose({
        consent_given: false,
        necessary: true,
        functional: false,
        analytics: false,
        performance: false,
        advertisement: false,
      });
    };

    banner.querySelector("#usrly-btn-customise").onclick = function () {
      showPreferencesModal();
    };
  }

  // Auto-start CMP & Tracking
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCMP);
  } else {
    initCMP();
  }
})();
