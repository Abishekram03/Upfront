export interface CookieSignature {
  pattern: RegExp
  service: string
  category: "necessary" | "functional" | "analytics" | "performance" | "advertisement"
  duration: string
  description: string
  scriptPattern?: RegExp
}

export interface ClassificationResult {
  name: string
  service_name: string
  category: "necessary" | "functional" | "analytics" | "performance" | "advertisement"
  duration: string
  description: string
  confidence: "high" | "medium" | "low"
  status: "detected" | "needs_review"
  script_pattern_regex?: string
}

export const KNOWN_COOKIE_SIGNATURES: CookieSignature[] = [
  // 1. Necessary (Security, Authentication, Load Balancing, Core CMP)
  {
    pattern: /^(__cf_bm|__cflb|cf_clearance|_cfuvid|cf_chl_.*)$/i,
    service: "Cloudflare",
    category: "necessary",
    duration: "30 days",
    description: "Used by Cloudflare to support bot management, rate limiting, and DDoS mitigation.",
  },
  {
    pattern: /^(__stripe_mid|__stripe_sid|merchant)$/i,
    service: "Stripe",
    category: "necessary",
    duration: "1 year",
    description: "Used by Stripe for fraud detection and secure credit card transaction processing.",
    scriptPattern: /js\.stripe\.com/i,
  },
  {
    pattern: /^(csrf|csrftoken|xsrf-token|_csrf|_xsrf|__Host-.*|__Secure-.*)$/i,
    service: "Security / CSRF",
    category: "necessary",
    duration: "Session",
    description: "Protects web applications against Cross-Site Request Forgery (CSRF) attacks.",
  },
  {
    pattern: /^(session|sid|phpsessid|jsessionid|connect\.sid|auth_token|jwt|token|sb-.*-auth-token)$/i,
    service: "Session Management",
    category: "necessary",
    duration: "Session",
    description: "Maintains logged-in user state, authentication tokens, and active browser sessions.",
  },
  {
    pattern: /^(usrly_consent|consentos_consent|cookieyes-consent|OptanonConsent|OptanonAlertBoxClosed)$/i,
    service: "ConsentOS CMP",
    category: "necessary",
    duration: "1 year",
    description: "Stores the visitor's cookie consent preference state and regulatory version.",
  },

  // 2. Functional (Live Chat, Localization, Preferences, Video Players)
  {
    pattern: /^(i18n_lang|lang|locale|user_language|googtrans)$/i,
    service: "Localization & Language",
    category: "functional",
    duration: "1 year",
    description: "Preserves the visitor's chosen interface language and regional settings.",
  },
  {
    pattern: /^intercom-(id|session|device)-.*$/i,
    service: "Intercom Messenger",
    category: "functional",
    duration: "9 months",
    description: "Maintains real-time chat sessions and conversation history with customer support.",
    scriptPattern: /widget\.intercom\.io/i,
  },
  {
    pattern: /^crisp-client.*$/i,
    service: "Crisp Live Chat",
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
    description: "Stores live chat user ID and state for customer support ticketing.",
    scriptPattern: /static\.zdassets\.com/i,
  },
  {
    pattern: /^(vuid|player)$/i,
    service: "Vimeo Player",
    category: "functional",
    duration: "2 years",
    description: "Collects tracking information for embedded Vimeo video players.",
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

  // 3. Analytics (GA4, PostHog, Hotjar, Clarity, Mixpanel, Amplitude, Segment)
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
    description: "Collects behavioral event streams and session recordings for product analytics.",
    scriptPattern: /app\.posthog\.com|eu\.posthog\.com/i,
  },
  {
    pattern: /^_clck|_clsk$/i,
    service: "Microsoft Clarity",
    category: "analytics",
    duration: "1 year",
    description: "Persists the Clarity user ID and session recordings for UX heatmap generation.",
    scriptPattern: /clarity\.ms\/tag/i,
  },
  {
    pattern: /^_hjSessionUser_.*|_hjSession_.*$/i,
    service: "Hotjar",
    category: "analytics",
    duration: "1 year",
    description: "Sets unique user identifier and session token for website feedback and heatmaps.",
    scriptPattern: /static\.hotjar\.com/i,
  },
  {
    pattern: /^(__hstc|hubspotutk|__hssc|__hssrc)$/i,
    service: "HubSpot Analytics",
    category: "analytics",
    duration: "6 months",
    description: "Tracks visitor navigation history and logs pageviews for inbound marketing telemetry.",
    scriptPattern: /js\.hs-scripts\.com/i,
  },
  {
    pattern: /^mp_.*_mixpanel$/i,
    service: "Mixpanel",
    category: "analytics",
    duration: "1 year",
    description: "Identifies unique users and tracks custom in-app product events.",
    scriptPattern: /cdn\.mxpnl\.com/i,
  },
  {
    pattern: /^amplitude_.*$/i,
    service: "Amplitude",
    category: "analytics",
    duration: "1 year",
    description: "Collects user event journeys and funnels for product intelligence.",
    scriptPattern: /cdn\.amplitude\.com/i,
  },
  {
    pattern: /^ajs_user_id|ajs_anonymous_id$/i,
    service: "Segment (Twilio)",
    category: "analytics",
    duration: "1 year",
    description: "Maintains visitor identity for routing analytics events across customer data pipelines.",
    scriptPattern: /cdn\.segment\.com/i,
  },

  // 4. Performance (Error Tracking, CDN Caching, Telemetry)
  {
    pattern: /^_hj(IncludedInPageviewSample|TLDTest).*$/i,
    service: "Hotjar Sampling",
    category: "performance",
    duration: "Session",
    description: "Checks whether the browser is included in the analytics sampling pool.",
  },
  {
    pattern: /^(sentry-.*|datadog-rum-.*|newrelic-.*)$/i,
    service: "Error & APM Telemetry",
    category: "performance",
    duration: "Session",
    description: "Collects frontend performance vitals, crash reports, and API latency metrics.",
    scriptPattern: /browser\.sentry-cdn\.com|datadoghq-browser/i,
  },

  // 5. Advertisement (Meta, Google Ads, TikTok, LinkedIn, Twitter/X, Pinterest, Criteo)
  {
    pattern: /^(_fbp|_fbc|fr|datr|sb)$/i,
    service: "Meta Pixel (Facebook)",
    category: "advertisement",
    duration: "3 months",
    description: "Used by Meta to deliver personalized advertisements, measure conversion, and build retargeting audiences.",
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
    description: "Used by TikTok to measure ad conversions and optimize targeted ad campaigns.",
    scriptPattern: /analytics\.tiktok\.com/i,
  },
  {
    pattern: /^(li_sugr|bcookie|bscookie|lidc)$/i,
    service: "LinkedIn Insight Tag",
    category: "advertisement",
    duration: "2 years",
    description: "Used to track conversions, retarget website visitors, and unlock demographic insights on LinkedIn.",
    scriptPattern: /snap\.licdn\.com/i,
  },
  {
    pattern: /^(_uetsid|_uetvid)$/i,
    service: "Microsoft Advertising / Bing",
    category: "advertisement",
    duration: "30 days",
    description: "Used to track visitors across websites for Microsoft Advertising and Bing Ads attribution.",
    scriptPattern: /bat\.bing\.com/i,
  },
  {
    pattern: /^(_twitter_sess|personalization_id|muc_ads)$/i,
    service: "Twitter / X Ads",
    category: "advertisement",
    duration: "2 years",
    description: "Used by Twitter/X to deliver targeted advertising and measure conversion effectiveness.",
    scriptPattern: /static\.ads-twitter\.com/i,
  },
  {
    pattern: /^(_pin_unauth|_pinterest_ct_ua)$/i,
    service: "Pinterest Tag",
    category: "advertisement",
    duration: "1 year",
    description: "Used by Pinterest to track actions people take on the website after viewing a Promoted Pin.",
    scriptPattern: /pintrk/i,
  },
  {
    pattern: /^(_cto_bundle|cto_tld_test)$/i,
    service: "Criteo Retargeting",
    category: "advertisement",
    duration: "13 months",
    description: "Provides customized advertisements based on the visitor's browsing patterns across partner networks.",
    scriptPattern: /static\.criteo\.net/i,
  },
]

export function classifyCookie(cookieName: string, domain?: string): ClassificationResult {
  const cleanName = (cookieName || "").trim()

  for (const sig of KNOWN_COOKIE_SIGNATURES) {
    if (sig.pattern.test(cleanName)) {
      return {
        name: cleanName,
        service_name: sig.service,
        category: sig.category,
        duration: sig.duration,
        description: sig.description,
        confidence: "high",
        status: "detected",
        script_pattern_regex: sig.scriptPattern?.source,
      }
    }
  }

  // Fallback for uncatalogued cookies
  return {
    name: cleanName,
    service_name: "Uncatalogued Provider",
    category: "functional",
    duration: "Unknown",
    description: "Uncatalogued cookie detected on page. Administrator verification recommended.",
    confidence: "low",
    status: "needs_review",
  }
}

export function classifyScript(srcUrl: string): { service: string; category: "necessary" | "functional" | "analytics" | "performance" | "advertisement" } | null {
  for (const sig of KNOWN_COOKIE_SIGNATURES) {
    if (sig.scriptPattern && sig.scriptPattern.test(srcUrl)) {
      return {
        service: sig.service,
        category: sig.category,
      }
    }
  }
  return null
}
