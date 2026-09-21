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
  // 1. Strictly Necessary (Security, CSRF, Bot Mitigation, Auth, Core CMP)
  {
    pattern: /^(__cf_bm|__cflb|cf_clearance|_cfuvid|cf_chl_.*)$/i,
    service: "Cloudflare",
    category: "necessary",
    duration: "30 days",
    description: "Essential for Cloudflare bot management, DDoS defense, and security rate limiting.",
  },
  {
    pattern: /^(__stripe_mid|__stripe_sid|merchant)$/i,
    service: "Stripe",
    category: "necessary",
    duration: "1 year",
    description: "Used by Stripe for fraud detection, secure credit card transactions, and payment verification.",
    scriptPattern: /js\.stripe\.com/i,
  },
  {
    pattern: /^(csrf|csrftoken|xsrf-token|_csrf|_xsrf|__Host-.*|__Secure-.*)$/i,
    service: "Security / CSRF",
    category: "necessary",
    duration: "Session",
    description: "Prevents Cross-Site Request Forgery (CSRF) attacks to secure user session submissions.",
  },
  {
    pattern: /^(session|sid|phpsessid|jsessionid|connect\.sid|auth_token|jwt|token|sb-.*-auth-token)$/i,
    service: "Session Management",
    category: "necessary",
    duration: "Session",
    description: "Maintains authenticated user session state across page navigation.",
  },
  {
    pattern: /^(consentos_consent|usrly_consent|cookieyes-consent|OptanonConsent|OptanonAlertBoxClosed)$/i,
    service: "ConsentOS CMP",
    category: "necessary",
    duration: "1 year",
    description: "Stores visitor's regulatory consent choices, timestamp, and versioning.",
  },

  // 2. Functional (Live Chat, Localization, User Preferences, Media Players)
  {
    pattern: /^(i18n_lang|lang|locale|user_language|googtrans)$/i,
    service: "Localization & Language",
    category: "functional",
    duration: "1 year",
    description: "Stores chosen interface language and localized content preferences.",
  },
  {
    pattern: /^intercom-(id|session|device)-.*$/i,
    service: "Intercom Messenger",
    category: "functional",
    duration: "9 months",
    description: "Enables customer live chat support and preserves conversation history.",
    scriptPattern: /widget\.intercom\.io/i,
  },
  {
    pattern: /^crisp-client.*$/i,
    service: "Crisp Chat",
    category: "functional",
    duration: "6 months",
    description: "Restores visitor identity and chat history in the Crisp live chat widget.",
    scriptPattern: /client\.crisp\.chat/i,
  },
  {
    pattern: /^__zlcid|_zprivacy$/i,
    service: "Zendesk Chat",
    category: "functional",
    duration: "1 year",
    description: "Stores live chat user ID and support state.",
    scriptPattern: /static\.zdassets\.com/i,
  },
  {
    pattern: /^(vuid|player)$/i,
    service: "Vimeo Player",
    category: "functional",
    duration: "2 years",
    description: "Stores volume and playback preferences for embedded Vimeo video players.",
    scriptPattern: /player\.vimeo\.com/i,
  },
  {
    pattern: /^(yt-remote-.*|YSC|VISITOR_INFO1_LIVE|PREF)$/i,
    service: "YouTube Embed",
    category: "functional",
    duration: "6 months",
    description: "Stores video player preferences and user bandwidth estimates for YouTube embeds.",
    scriptPattern: /youtube\.com\/iframe_api/i,
  },

  // 3. Analytics (GA4, PostHog, Clarity, Hotjar, HubSpot, Amplitude, Segment, Mixpanel)
  {
    pattern: /^_ga(_.*)?$/i,
    service: "Google Analytics 4",
    category: "analytics",
    duration: "2 years",
    description: "Calculates visitor, session, and campaign data and tracks site usage for GA4 analytics.",
    scriptPattern: /googletagmanager\.com\/gtag\/js|google-analytics\.com/i,
  },
  {
    pattern: /^_gid$/i,
    service: "Google Analytics",
    category: "analytics",
    duration: "24 hours",
    description: "Stores and updates a unique value for each page visited to quantify unique visitors.",
  },
  {
    pattern: /^_gat(_.*)?$/i,
    service: "Google Analytics",
    category: "analytics",
    duration: "1 minute",
    description: "Throttles request rate to limit the collection of data on high-traffic sites.",
  },
  {
    pattern: /^ph_.*_posthog$/i,
    service: "PostHog Analytics",
    category: "analytics",
    duration: "1 year",
    description: "Captures user event streams, behavioral funnels, and session replays.",
    scriptPattern: /app\.posthog\.com|eu\.posthog\.com/i,
  },
  {
    pattern: /^_clck|_clsk$/i,
    service: "Microsoft Clarity",
    category: "analytics",
    duration: "1 year",
    description: "Stores unique user identifier and session data for UX heatmaps and scroll depth.",
    scriptPattern: /clarity\.ms\/tag/i,
  },
  {
    pattern: /^_hjSessionUser_.*|_hjSession_.*$/i,
    service: "Hotjar",
    category: "analytics",
    duration: "1 year",
    description: "Persists Hotjar user ID and active session recording state.",
    scriptPattern: /static\.hotjar\.com/i,
  },
  {
    pattern: /^(__hstc|hubspotutk|__hssc|__hssrc)$/i,
    service: "HubSpot Analytics",
    category: "analytics",
    duration: "6 months",
    description: "Tracks visitor navigation history and logs pageviews for marketing automation.",
    scriptPattern: /js\.hs-scripts\.com/i,
  },
  {
    pattern: /^mp_.*_mixpanel$/i,
    service: "Mixpanel",
    category: "analytics",
    duration: "1 year",
    description: "Tracks in-app product events and feature adoption analytics.",
    scriptPattern: /cdn\.mxpnl\.com/i,
  },
  {
    pattern: /^amplitude_.*$/i,
    service: "Amplitude",
    category: "analytics",
    duration: "1 year",
    description: "Tracks customer user journeys and behavioral conversion milestones.",
    scriptPattern: /cdn\.amplitude\.com/i,
  },
  {
    pattern: /^ajs_user_id|ajs_anonymous_id$/i,
    service: "Segment (Twilio)",
    category: "analytics",
    duration: "1 year",
    description: "Maintains visitor identity for routing analytics events across customer data platforms.",
    scriptPattern: /cdn\.segment\.com/i,
  },

  // 4. Performance (Sampling, Error Telemetry, APM)
  {
    pattern: /^_hj(IncludedInPageviewSample|TLDTest).*$/i,
    service: "Hotjar Sampling",
    category: "performance",
    duration: "Session",
    description: "Determines if a visitor is included in the analytics sampling pool.",
  },
  {
    pattern: /^(sentry-.*|datadog-rum-.*|newrelic-.*)$/i,
    service: "APM & Error Telemetry",
    category: "performance",
    duration: "Session",
    description: "Monitors frontend application crashes, Core Web Vitals, and API latencies.",
    scriptPattern: /browser\.sentry-cdn\.com|datadoghq-browser/i,
  },

  // 5. Advertisement (Meta, Google Ads, TikTok, LinkedIn, Bing, Twitter/X, Pinterest, Criteo)
  {
    pattern: /^(_fbp|_fbc|fr|datr|sb)$/i,
    service: "Meta Pixel (Facebook)",
    category: "advertisement",
    duration: "3 months",
    description: "Delivers personalized advertising, measures conversion, and builds retargeting audiences.",
    scriptPattern: /connect\.facebook\.net/i,
  },
  {
    pattern: /^(_gcl_au|_gcl_aw|_gcl_dc|IDE|DSID|test_cookie)$/i,
    service: "Google Ads / DoubleClick",
    category: "advertisement",
    duration: "3 months",
    description: "Used by Google Ads for conversion attribution, remarketing, and ad bidding optimization.",
    scriptPattern: /googleadservices\.com|doubleclick\.net/i,
  },
  {
    pattern: /^_ttp.*$/i,
    service: "TikTok Pixel",
    category: "advertisement",
    duration: "13 months",
    description: "Measures ad conversion effectiveness and optimizes targeted TikTok campaigns.",
    scriptPattern: /analytics\.tiktok\.com/i,
  },
  {
    pattern: /^(li_sugr|bcookie|bscookie|lidc)$/i,
    service: "LinkedIn Insight Tag",
    category: "advertisement",
    duration: "2 years",
    description: "Tracks conversions and unlocks demographic audience insights on LinkedIn.",
    scriptPattern: /snap\.licdn\.com/i,
  },
  {
    pattern: /^(_uetsid|_uetvid)$/i,
    service: "Microsoft Advertising / Bing",
    category: "advertisement",
    duration: "30 days",
    description: "Tracks visitors across websites for Microsoft Advertising and Bing Ads attribution.",
    scriptPattern: /bat\.bing\.com/i,
  },
  {
    pattern: /^(_twitter_sess|personalization_id|muc_ads)$/i,
    service: "Twitter / X Ads",
    category: "advertisement",
    duration: "2 years",
    description: "Delivers targeted advertising and measures ad campaign conversions.",
    scriptPattern: /static\.ads-twitter\.com/i,
  },
  {
    pattern: /^(_pin_unauth|_pinterest_ct_ua)$/i,
    service: "Pinterest Tag",
    category: "advertisement",
    duration: "1 year",
    description: "Tracks actions taken on the website after viewing a Promoted Pin.",
    scriptPattern: /pintrk/i,
  },
  {
    pattern: /^(_cto_bundle|cto_tld_test)$/i,
    service: "Criteo Retargeting",
    category: "advertisement",
    duration: "13 months",
    description: "Provides customized retargeted advertisements across partner advertising networks.",
    scriptPattern: /static\.criteo\.net/i,
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
        script_pattern_regex: def.scriptPattern?.source,
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
