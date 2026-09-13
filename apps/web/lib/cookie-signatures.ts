export interface CookieSignature {
  pattern: RegExp
  service: string
  category: "necessary" | "functional" | "analytics" | "performance" | "advertisement"
  duration: string
  description: string
}

export interface ClassificationResult {
  name: string
  service_name: string
  category: "necessary" | "functional" | "analytics" | "performance" | "advertisement"
  duration: string
  description: string
  confidence: "high" | "medium" | "low"
  status: "detected" | "needs_review"
}

export const KNOWN_COOKIE_SIGNATURES: CookieSignature[] = [
  // Google Analytics
  {
    pattern: /^_ga(_.*)?$/,
    service: "Google Analytics 4",
    category: "analytics",
    duration: "2 years",
    description: "Used to distinguish unique users and measure website interaction metrics.",
  },
  {
    pattern: /^_gid$/,
    service: "Google Analytics",
    category: "analytics",
    duration: "24 hours",
    description: "Counts and tracks pageviews for session analytics.",
  },
  {
    pattern: /^_gat(_.*)?$/,
    service: "Google Analytics",
    category: "analytics",
    duration: "1 minute",
    description: "Throttles request rate to limit the collection of data on high traffic sites.",
  },
  {
    pattern: /^__utm[abczv]$/,
    service: "Google Universal Analytics (Legacy)",
    category: "analytics",
    duration: "2 years",
    description: "Legacy cookie used to track visitor sources and page navigation.",
  },

  // Google Advertising / DoubleClick
  {
    pattern: /^_gcl_au$/,
    service: "Google Ads (AdSense)",
    category: "advertisement",
    duration: "3 months",
    description: "Used by Google AdSense for experimenting with advertisement efficiency.",
  },
  {
    pattern: /^_gcl_aw$/,
    service: "Google Ads Conversion",
    category: "advertisement",
    duration: "90 days",
    description: "Used to track ad clicks and measure conversion campaigns.",
  },
  {
    pattern: /^(IDE|DSID|test_cookie)$/,
    service: "DoubleClick / Google Ads",
    category: "advertisement",
    duration: "1 year",
    description: "Used to register and report the website user's actions after viewing or clicking ads.",
  },

  // Meta / Facebook Pixel
  {
    pattern: /^_fbp$/,
    service: "Meta Pixel",
    category: "advertisement",
    duration: "3 months",
    description: "Used by Meta to store and track visits across websites for targeted advertising.",
  },
  {
    pattern: /^_fbc$/,
    service: "Meta Pixel Click",
    category: "advertisement",
    duration: "2 years",
    description: "Stores the Facebook click ID when a user visits via an ad.",
  },
  {
    pattern: /^(fr|datr|sb)$/,
    service: "Facebook Core Services",
    category: "advertisement",
    duration: "3 months",
    description: "Contains unique browser identifier used for advertisement delivery.",
  },

  // TikTok Pixel
  {
    pattern: /^_ttp.*$/,
    service: "TikTok Pixel",
    category: "advertisement",
    duration: "13 months",
    description: "Used by TikTok to measure ad conversions and optimize target audiences.",
  },

  // LinkedIn Insight
  {
    pattern: /^(li_sugr|bcookie|bscookie|lidc)$/,
    service: "LinkedIn Insight Tag",
    category: "advertisement",
    duration: "2 years",
    description: "Used to track conversions and target website visitors on LinkedIn.",
  },

  // Microsoft Clarity & Bing Ads
  {
    pattern: /^_clck$/,
    service: "Microsoft Clarity",
    category: "analytics",
    duration: "1 year",
    description: "Persists the Clarity user ID and settings across pages.",
  },
  {
    pattern: /^_clsk$/,
    service: "Microsoft Clarity Session",
    category: "analytics",
    duration: "24 hours",
    description: "Connects multiple pageviews by a user into a single Clarity session recording.",
  },
  {
    pattern: /^_uetsid|_uetvid/,
    service: "Microsoft Advertising / Bing",
    category: "advertisement",
    duration: "30 days",
    description: "Used to track visitors across multiple websites for Bing advertising.",
  },

  // Hotjar
  {
    pattern: /^_hjSessionUser_.*$/,
    service: "Hotjar User ID",
    category: "analytics",
    duration: "1 year",
    description: "Stores a unique Hotjar user ID to recognize repeat visitors.",
  },
  {
    pattern: /^_hjSession_.*$/,
    service: "Hotjar Active Session",
    category: "analytics",
    duration: "30 minutes",
    description: "Maintains current session data for heatmap and scroll recording.",
  },
  {
    pattern: /^_hj(IncludedInPageviewSample|TLDTest).*$/,
    service: "Hotjar Telemetry",
    category: "performance",
    duration: "Session",
    description: "Determines if a user is included in the pageview sampling data.",
  },

  // HubSpot
  {
    pattern: /^(__hstc|hubspotutk)$/,
    service: "HubSpot Analytics",
    category: "analytics",
    duration: "6 months",
    description: "Tracks visitors and logs pageviews for inbound marketing automation.",
  },
  {
    pattern: /^__hss(c|rc)$/,
    service: "HubSpot Session",
    category: "analytics",
    duration: "30 minutes",
    description: "Used to track if a visitor has restarted their browser session.",
  },

  // Intercom & Crisp Chat
  {
    pattern: /^intercom-(id|session|device)-.*$/,
    service: "Intercom Messenger",
    category: "functional",
    duration: "9 months",
    description: "Allows visitors to chat with support and preserves chat history across visits.",
  },
  {
    pattern: /^crisp-client.*$/,
    service: "Crisp Live Chat",
    category: "functional",
    duration: "6 months",
    description: "Restores visitor identity and chat history in the Crisp live chat widget.",
  },

  // Cloudflare (Strictly Necessary)
  {
    pattern: /^(__cf_bm|__cflb|cf_clearance|_cfuvid)$/,
    service: "Cloudflare Security & CDN",
    category: "necessary",
    duration: "30 minutes",
    description: "Essential for bot protection, rate limiting, and DDoS mitigation.",
  },

  // Stripe (Strictly Necessary)
  {
    pattern: /^(__stripe_mid|__stripe_sid|merchant)$/,
    service: "Stripe Payment Gateway",
    category: "necessary",
    duration: "1 year",
    description: "Fraud prevention and secure credit card payment processing.",
  },

  // Generic Auth & CSRF
  {
    pattern: /^(csrf|csrftoken|xsrf-token|_csrf|_xsrf)$/i,
    service: "CSRF Security Protection",
    category: "necessary",
    duration: "Session",
    description: "Protects against Cross-Site Request Forgery attacks.",
  },
  {
    pattern: /^(session|sid|phpsessid|jsessionid|connect\.sid|auth_token|jwt)$/i,
    service: "Session Management",
    category: "necessary",
    duration: "Session",
    description: "Maintains logged-in user state and security tokens.",
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
      }
    }
  }

  // Fallback for unknown / unclassified cookies
  return {
    name: cleanName,
    service_name: "Custom / Uncatalogued",
    category: "functional",
    duration: "Unknown",
    description: "Uncatalogued cookie detected on page. Recommended for administrator review.",
    confidence: "low",
    status: "needs_review",
  }
}
