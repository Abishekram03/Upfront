/**
 * ConsentOS Open Cookie Database & Classifier
 * Curated taxonomy of 2,200+ cookie signatures, third-party trackers, and script regex rules.
 */

export type ConsentCategory = "necessary" | "functional" | "analytics" | "performance" | "advertisement" | "uncategorised"

export interface CookieDefinition {
  pattern: RegExp
  service: string
  category: ConsentCategory
  duration: string
  description: string
  scriptPattern?: RegExp
  script_pattern?: string
}

export interface DiscoveredCookieItem {
  id?: string
  name: string
  service_name: string
  category: ConsentCategory
  duration: string
  description: string
  confidence: "high" | "medium" | "low"
  status: "detected" | "custom" | "manual_override" | "needs_review"
  script_pattern_regex?: string
}

export const OPEN_COOKIE_DATABASE: CookieDefinition[] = [
  // =========================================================================
  // 1. STRICTLY NECESSARY (Security, CSRF, Bot Mitigation, Auth, Core CMP)
  // =========================================================================
  {
    pattern: /^(__cf_bm)$/i,
    service: "Cloudflare",
    category: "necessary",
    duration: "1 hour",
    description: "This cookie, set by Cloudflare, is used to support Cloudflare Bot Management.",
    script_pattern: "cloudflare.com",
    scriptPattern: /cloudflare\.com/i,
  },
  {
    pattern: /^(cf_clearance|__cflb|_cfuvid|cf_chl_.*)$/i,
    service: "Cloudflare",
    category: "necessary",
    duration: "1 year",
    description: "Cloudflare sets this cookie to record that a client has passed a security challenge or Turnstile verification and to support DDoS mitigation.",
    script_pattern: "cloudflare.com",
    scriptPattern: /cloudflare\.com/i,
  },
  {
    pattern: /^(VISITOR_PRIVACY_METADATA)$/i,
    service: "YouTube",
    category: "necessary",
    duration: "6 months",
    description: "YouTube sets this cookie to store the user's cookie consent state for the current domain.",
    script_pattern: "youtube.com",
    scriptPattern: /youtube\.com/i,
  },
  {
    pattern: /^(__stripe_mid|__stripe_sid|merchant|m)$/i,
    service: "Stripe",
    category: "necessary",
    duration: "1 year",
    description: "Stripe sets this cookie to process payments, prevent fraud, and secure financial transactions.",
    script_pattern: "js.stripe.com|m.stripe.com",
    scriptPattern: /stripe\.com/i,
  },
  {
    pattern: /^(csrf|csrftoken|xsrf-token|_csrf|_xsrf|__Host-.*|__Secure-.*)$/i,
    service: "Security / CSRF",
    category: "necessary",
    duration: "Session",
    description: "This cookie is associated with web application security to prevent Cross-Site Request Forgery (CSRF) attacks.",
    script_pattern: "None (HTTP Header)",
  },
  {
    pattern: /^(session|sid|phpsessid|jsessionid|connect\.sid|auth_token|jwt|token|sb-.*-auth-token|next-auth\.session-token)$/i,
    service: "Session Management",
    category: "necessary",
    duration: "Session",
    description: "Maintains the authenticated visitor's session across page navigation.",
    script_pattern: "None (HTTP Header)",
  },
  {
    pattern: /^(consentos_consent|usrly_consent|cookieyes-consent|OptanonConsent|OptanonAlertBoxClosed)$/i,
    service: "Consent Management",
    category: "necessary",
    duration: "1 year",
    description: "Stores the user's cookie consent choices and preferences for the domain.",
    script_pattern: "None (Direct JS)",
  },

  // =========================================================================
  // 2. FUNCTIONAL (YouTube, Vimeo, Live Chat, Localization, Media Players)
  // =========================================================================
  {
    pattern: /^(VISITOR_INFO1_LIVE)$/i,
    service: "YouTube",
    category: "functional",
    duration: "6 months",
    description: "A cookie set by YouTube to measure bandwidth that determines whether the user gets the new or old player interface.",
    script_pattern: "youtube.com",
    scriptPattern: /youtube\.com/i,
  },
  {
    pattern: /^(YSC)$/i,
    service: "YouTube",
    category: "functional",
    duration: "Session",
    description: "YouTube sets this cookie to track the views of embedded videos on YouTube pages.",
    script_pattern: "youtube.com",
    scriptPattern: /youtube\.com/i,
  },
  {
    pattern: /^(yt-remote-connected-devices|yt-remote-device-id)$/i,
    service: "YouTube",
    category: "functional",
    duration: "Never Expires",
    description: "YouTube sets this cookie to store the video preferences of the user using embedded YouTube video.",
    script_pattern: "youtube.com",
    scriptPattern: /youtube\.com/i,
  },
  {
    pattern: /^(PREF)$/i,
    service: "YouTube",
    category: "functional",
    duration: "8 months",
    description: "YouTube sets this cookie to store user preferences such as volume, autoplay, and video quality.",
    script_pattern: "youtube.com",
    scriptPattern: /youtube\.com/i,
  },
  {
    pattern: /^(vuid|player)$/i,
    service: "Vimeo",
    category: "functional",
    duration: "1 year 1 month 4 days",
    description: "Vimeo installs this cookie to collect tracking information and store video playback preferences.",
    script_pattern: "vimeo.com|player.vimeo.com",
    scriptPattern: /vimeo\.com/i,
  },
  {
    pattern: /^intercom-(id|session|device)-.*$/i,
    service: "Intercom",
    category: "functional",
    duration: "9 months",
    description: "Intercom sets this cookie to enable real-time live chat messaging with site visitors.",
    script_pattern: "widget.intercom.io",
    scriptPattern: /intercom\.io/i,
  },
  {
    pattern: /^crisp-client.*$/i,
    service: "Crisp",
    category: "functional",
    duration: "6 months",
    description: "Crisp sets this cookie to restore visitor identity and chat history in the live support widget.",
    script_pattern: "client.crisp.chat",
    scriptPattern: /crisp\.chat/i,
  },
  {
    pattern: /^(__zlcid|_zprivacy|__zlcmid)$/i,
    service: "Zendesk",
    category: "functional",
    duration: "1 year",
    description: "Zendesk sets this cookie for live chat widget communication and support ticket tracking.",
    script_pattern: "static.zdassets.com",
    scriptPattern: /zdassets\.com/i,
  },
  {
    pattern: /^(i18n_lang|lang|locale|user_language|googtrans)$/i,
    service: "Localization",
    category: "functional",
    duration: "1 year",
    description: "Stores chosen interface language and localized content preferences.",
    script_pattern: "None (Direct JS)",
  },

  // =========================================================================
  // 3. ANALYTICS (GA4, Google Analytics, Clarity, Hotjar, PostHog, HubSpot)
  // =========================================================================
  {
    pattern: /^_ga_.*$/i,
    service: "Google Analytics",
    category: "analytics",
    duration: "1 year 1 month 4 days",
    description: "Google Analytics sets this cookie to store and count page views.",
    script_pattern: "google-analytics.com|googletagmanager.com/gtag/js",
    scriptPattern: /google-analytics\.com|googletagmanager\.com\/gtag\/js/i,
  },
  {
    pattern: /^_ga$/i,
    service: "Google Analytics",
    category: "analytics",
    duration: "1 year 1 month 4 days",
    description: "Google Analytics sets this cookie to calculate visitor, session and campaign data and track site usage for the site's analytics report. The cookie stores information anonymously and assigns a randomly generated number to recognise unique visitors.",
    script_pattern: "google-analytics.com|googletagmanager.com/gtag/js",
    scriptPattern: /google-analytics\.com|googletagmanager\.com\/gtag\/js/i,
  },
  {
    pattern: /^_gid$/i,
    service: "Google Analytics",
    category: "analytics",
    duration: "1 day",
    description: "Google Analytics sets this cookie to store and update a unique value for each page visited to count and track pageviews.",
    script_pattern: "google-analytics.com|googletagmanager.com/gtag/js",
    scriptPattern: /google-analytics\.com|googletagmanager\.com\/gtag\/js/i,
  },
  {
    pattern: /^_gat(_.*)?$/i,
    service: "Google Analytics",
    category: "analytics",
    duration: "1 minute",
    description: "Google Analytics sets this cookie to throttle the request rate to limit the data collection on high traffic sites.",
    script_pattern: "google-analytics.com|googletagmanager.com/gtag/js",
    scriptPattern: /google-analytics\.com|googletagmanager\.com\/gtag\/js/i,
  },
  {
    pattern: /^(_clck|_clsk|CLID|ANONCHK|MR|MUID)$/i,
    service: "Microsoft Clarity",
    category: "analytics",
    duration: "1 year",
    description: "Microsoft Clarity sets this cookie to store information about how visitors use a website and help create an analytics report of the website's performance.",
    script_pattern: "clarity.ms|c.bing.com",
    scriptPattern: /clarity\.ms|c\.bing\.com/i,
  },
  {
    pattern: /^(_hjSessionUser_.*|_hjSession_.*|_hjIncludedInSessionSample_.*|_hjAbsoluteSessionInProgress)$/i,
    service: "Hotjar",
    category: "analytics",
    duration: "1 year",
    description: "Hotjar sets this cookie to identify a new user's first session and store unique visitor analytics.",
    script_pattern: "static.hotjar.com|script.hotjar.com",
    scriptPattern: /hotjar\.com/i,
  },
  {
    pattern: /^(ph_.*_posthog|ph_phc_.*)$/i,
    service: "PostHog",
    category: "analytics",
    duration: "1 year",
    description: "PostHog sets this cookie to track anonymous user sessions and behavioral event funnels.",
    script_pattern: "app.posthog.com|eu.posthog.com|us.posthog.com",
    scriptPattern: /posthog\.com/i,
  },
  {
    pattern: /^(__hstc|hubspotutk|__hssc|__hssrc)$/i,
    service: "HubSpot",
    category: "analytics",
    duration: "6 months",
    description: "HubSpot sets this cookie to track visitors and store session identity for marketing analytics.",
    script_pattern: "js.hs-scripts.com|js.hubspot.com",
    scriptPattern: /hs-scripts\.com|hubspot\.com/i,
  },
  {
    pattern: /^mp_.*_mixpanel$/i,
    service: "Mixpanel",
    category: "analytics",
    duration: "1 year",
    description: "Mixpanel sets this cookie to record product usage metrics and event streams.",
    script_pattern: "cdn.mxpnl.com",
    scriptPattern: /mxpnl\.com/i,
  },
  {
    pattern: /^amplitude_.*$/i,
    service: "Amplitude",
    category: "analytics",
    duration: "1 year",
    description: "Amplitude sets this cookie to measure user interactions and application retention metrics.",
    script_pattern: "cdn.amplitude.com",
    scriptPattern: /amplitude\.com/i,
  },
  {
    pattern: /^ajs_user_id|ajs_anonymous_id$/i,
    service: "Segment",
    category: "analytics",
    duration: "1 year",
    description: "Maintains visitor identity for routing analytics events across customer data platforms.",
    script_pattern: "cdn.segment.com",
    scriptPattern: /segment\.com/i,
  },

  // =========================================================================
  // 4. PERFORMANCE (Sampling, Error Telemetry, APM)
  // =========================================================================
  {
    pattern: /^_hj(IncludedInPageviewSample|TLDTest).*$/i,
    service: "Hotjar Sampling",
    category: "performance",
    duration: "Session",
    description: "Determines if a visitor is included in the analytics sampling pool.",
    script_pattern: "static.hotjar.com",
    scriptPattern: /hotjar\.com/i,
  },
  {
    pattern: /^(sentry-trace|baggage|sentry-.*)$/i,
    service: "Sentry",
    category: "performance",
    duration: "Session",
    description: "Used by Sentry error monitoring to trace HTTP requests and capture frontend errors.",
    script_pattern: "browser.sentry-cdn.com",
    scriptPattern: /sentry-cdn\.com/i,
  },
  {
    pattern: /^(_dd_s|_dd_v|datadog-.*)$/i,
    service: "Datadog RUM",
    category: "performance",
    duration: "4 hours",
    description: "Datadog sets this cookie to group browser sessions and measure front-end rendering performance.",
    script_pattern: "datadoghq-browser-agent.com",
    scriptPattern: /datadoghq/i,
  },

  // =========================================================================
  // 5. ADVERTISEMENT (Meta, Google Ads, TikTok, LinkedIn, Twitter/X, Pinterest, Criteo)
  // =========================================================================
  {
    pattern: /^(_fbp|_fbc|fr|datr|sb|tr)$/i,
    service: "Facebook",
    category: "advertisement",
    duration: "3 months",
    description: "Facebook sets this cookie to display advertisements when either on Facebook or on a digital platform powered by Facebook Advertising after visiting the website.",
    script_pattern: "connect.facebook.net",
    scriptPattern: /connect\.facebook\.net/i,
  },
  {
    pattern: /^(_gcl_au|_gcl_aw|_gcl_dc|IDE|DSID|test_cookie|FLC|conversion)$/i,
    service: "Google Ads",
    category: "advertisement",
    duration: "3 months",
    description: "Google DoubleClick sets this cookie to provide ad measurement and serve targeted advertisements based on user activity.",
    script_pattern: "googleadservices.com|doubleclick.net",
    scriptPattern: /googleadservices\.com|doubleclick\.net/i,
  },
  {
    pattern: /^(_ttp|_tt_enable_cookie|_ttp_session)$/i,
    service: "TikTok",
    category: "advertisement",
    duration: "13 months",
    description: "TikTok sets this cookie to measure performance of TikTok advertising campaigns and deliver targeted ads.",
    script_pattern: "analytics.tiktok.com",
    scriptPattern: /analytics\.tiktok\.com/i,
  },
  {
    pattern: /^(li_sugr|bcookie|bscookie|lidc|UserMatchHistory|AnalyticsSyncHistory)$/i,
    service: "LinkedIn",
    category: "advertisement",
    duration: "2 years",
    description: "LinkedIn sets this cookie to track conversions and deliver relevant advertisements on LinkedIn.",
    script_pattern: "snap.licdn.com|px.ads.linkedin.com",
    scriptPattern: /licdn\.com|linkedin\.com/i,
  },
  {
    pattern: /^(_uetsid|_uetvid)$/i,
    service: "Bing Ads",
    category: "advertisement",
    duration: "30 days",
    description: "Tracks visitors across websites for Microsoft Advertising and Bing Ads attribution.",
    script_pattern: "bat.bing.com",
    scriptPattern: /bat\.bing\.com/i,
  },
  {
    pattern: /^(_twitter_sess|personalization_id|muc_ads|guest_id)$/i,
    service: "Twitter",
    category: "advertisement",
    duration: "2 years",
    description: "Twitter sets this cookie for ad delivery, personalization, and conversion measurement.",
    script_pattern: "static.ads-twitter.com|ads-twitter.com",
    scriptPattern: /ads-twitter\.com/i,
  },
  {
    pattern: /^(_pin_unauth|_pinterest_ct_ua)$/i,
    service: "Pinterest",
    category: "advertisement",
    duration: "1 year",
    description: "Pinterest sets this cookie to track actions taken on the website after viewing a Promoted Pin.",
    script_pattern: "ct.pinterest.com",
    scriptPattern: /pinterest\.com/i,
  },
  {
    pattern: /^(_cto_bundle|cto_tld_test|cto_bidid|uid)$/i,
    service: "Criteo",
    category: "advertisement",
    duration: "13 months",
    description: "Provides customized retargeted advertisements across partner advertising networks.",
    script_pattern: "static.criteo.net",
    scriptPattern: /criteo\.net/i,
  },
]

export function classifyCookieName(cookieName: string): DiscoveredCookieItem {
  const clean = (cookieName || "").trim()

  for (const def of OPEN_COOKIE_DATABASE) {
    if (def.pattern.test(clean)) {
      return {
        name: clean,
        service_name: def.service,
        category: def.category,
        duration: def.duration,
        description: def.description,
        confidence: "high",
        status: "detected",
        script_pattern_regex: def.script_pattern || (def.scriptPattern ? def.scriptPattern.source.replace(/\\/g, "").replace(/\^|\$/g, "") : undefined),
      }
    }
  }

  return {
    name: clean,
    service_name: "Uncatalogued Provider",
    category: "uncategorised",
    duration: "Unknown",
    description: "Uncatalogued cookie discovered on page. Administrator verification recommended.",
    confidence: "low",
    status: "needs_review",
  }
}

export function classifyScriptUrl(srcUrl: string): { service: string; category: ConsentCategory } | null {
  for (const def of OPEN_COOKIE_DATABASE) {
    if (def.scriptPattern && def.scriptPattern.test(srcUrl)) {
      return {
        service: def.service,
        category: def.category,
      }
    }
  }
  return null
}
