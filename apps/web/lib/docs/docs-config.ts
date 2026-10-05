import { DocCategory, DocArticleMeta } from "./docs-types"

export const DOCS_CATEGORIES: DocCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    iconName: "Zap",
    description: "Learn how Upfront works and get your website connected in minutes.",
    articles: [
      {
        id: "overview",
        title: "Introduction & Architecture",
        category: "Getting Started",
        categoryId: "getting-started",
        description: "Learn how Upfront delivers cookieless analytics, CMP, and legal policies via a single script.",
        readTime: "4 min read",
        lastUpdated: "Updated 2 days ago",
      },
      {
        id: "quickstart",
        title: "Quickstart Guide",
        category: "Getting Started",
        categoryId: "getting-started",
        description: "Get Upfront installed and verified on your website in under 2 minutes.",
        readTime: "3 min read",
        lastUpdated: "Updated 1 day ago",
      },
      {
        id: "installation",
        title: "Script Installation",
        category: "Getting Started",
        categoryId: "getting-started",
        description: "Embed upfront.js on plain HTML, Next.js, React, WordPress, Webflow, and Shopify.",
        badge: "script.js",
        readTime: "5 min read",
        lastUpdated: "Updated today",
      },
      {
        id: "verification",
        title: "Domain Verification & Health Check",
        category: "Getting Started",
        categoryId: "getting-started",
        description: "Test your snippet connection, inspect browser telemetry, and enable debug mode.",
        readTime: "3 min read",
        lastUpdated: "Updated today",
      },
    ],
  },
  {
    id: "consent-cmp",
    title: "Consent Management (CMP)",
    iconName: "ShieldCheck",
    description: "Configure banner layouts, legal presets, script blocking rules, and compliance signals.",
    articles: [
      {
        id: "banner-studio",
        title: "Banner Studio & Layouts",
        category: "Consent Management (CMP)",
        categoryId: "consent-cmp",
        description: "Configure bottom bars, floating corner boxes, and center modal dialogs.",
        readTime: "4 min read",
      },
      {
        id: "legal-frameworks",
        title: "Legal Frameworks (GDPR, CCPA, LGPD)",
        category: "Consent Management (CMP)",
        categoryId: "consent-cmp",
        description: "Preset compliance templates tailored for EU, US California, and Brazil privacy laws.",
        readTime: "5 min read",
      },
      {
        id: "google-consent-mode",
        title: "Google Consent Mode v2",
        category: "Consent Management (CMP)",
        categoryId: "consent-cmp",
        description: "Native integration for ad_storage, analytics_storage, ad_user_data, and ad_personalization.",
        badge: "v2 Ready",
        readTime: "4 min read",
      },
      {
        id: "script-rules",
        title: "Script Auto-Blocking Rules",
        category: "Consent Management (CMP)",
        categoryId: "consent-cmp",
        description: "Prevent third-party tracking scripts from executing until explicit category consent is given.",
        readTime: "5 min read",
      },
      {
        id: "geo-targeting",
        title: "Geo-Targeting & Regional Delivery",
        category: "Consent Management (CMP)",
        categoryId: "consent-cmp",
        description: "Display banners only to EU/US visitors while disabling for exempt jurisdictions.",
        readTime: "3 min read",
      },
    ],
  },
  {
    id: "cookie-scanner",
    title: "Cookie Scanner & Audits",
    iconName: "Search",
    description: "Deep crawl cookies, LocalStorage, and third-party trackers with automated compliance audits.",
    articles: [
      {
        id: "scanner-overview",
        title: "Automated Cookie Scanner",
        category: "Cookie Scanner & Audits",
        categoryId: "cookie-scanner",
        description: "Deep-crawls HTTP cookies, Local Storage, Session Storage, and tracking pixels.",
        readTime: "3 min read",
      },
      {
        id: "categorization",
        title: "Cookie Categorization & Overrides",
        category: "Cookie Scanner & Audits",
        categoryId: "cookie-scanner",
        description: "Manage Necessary, Analytics, Functional, Performance, and Advertisement categories.",
        readTime: "4 min read",
      },
      {
        id: "scheduled-scans",
        title: "Scheduled Audits & Auto-Sync",
        category: "Cookie Scanner & Audits",
        categoryId: "cookie-scanner",
        description: "Automate weekly and monthly audit crawls to stay compliant with newly added scripts.",
        readTime: "3 min read",
      },
    ],
  },
  {
    id: "privacy-analytics",
    title: "Privacy Analytics",
    iconName: "BarChart3",
    description: "Understand visitor traffic with zero-cookie telemetry and no raw IP address retention.",
    articles: [
      {
        id: "analytics-overview",
        title: "Cookieless Tracking Engine",
        category: "Privacy Analytics",
        categoryId: "privacy-analytics",
        description: "Daily cryptographic session hashing with zero third-party cookie persistence.",
        readTime: "4 min read",
      },
      {
        id: "realtime-metrics",
        title: "Live Visitors & Real-Time Pulse",
        category: "Privacy Analytics",
        categoryId: "privacy-analytics",
        description: "Track active concurrent users with rolling 5-minute heartbeat aggregation.",
        readTime: "3 min read",
      },
      {
        id: "utm-referrers",
        title: "UTM Campaigns & Referrers",
        category: "Privacy Analytics",
        categoryId: "privacy-analytics",
        description: "Track marketing attribution across Google Ads, Meta, Twitter, and custom UTM tags.",
        readTime: "4 min read",
      },
    ],
  },
  {
    id: "proof-of-consent",
    title: "Proof of Consent Vault",
    iconName: "FileCheck",
    description: "Cryptographic audit receipts, audit trail retention, and exportable CSV proof logs.",
    articles: [
      {
        id: "proof-records",
        title: "Audit Trail Receipts",
        category: "Proof of Consent Vault",
        categoryId: "proof-of-consent",
        description: "Store cryptographic hashes of user consent choices for GDPR audit defense.",
        readTime: "3 min read",
      },
      {
        id: "export-audit-logs",
        title: "CSV Exports & Regulatory Defense",
        category: "Proof of Consent Vault",
        categoryId: "proof-of-consent",
        description: "Filter and export timestamped consent records for compliance inspections.",
        readTime: "3 min read",
      },
    ],
  },
  {
    id: "legal-policies",
    title: "Legal Policy Generators",
    iconName: "FileText",
    description: "Compliant Privacy Policy, Terms of Service, and Cookie Policy generation suite.",
    articles: [
      {
        id: "privacy-policy-gen",
        title: "Privacy Policy Generator",
        category: "Legal Policy Generators",
        categoryId: "legal-policies",
        description: "13-section GDPR/CCPA compliant policy builder with automated cookie tables.",
        readTime: "4 min read",
      },
      {
        id: "terms-of-service-gen",
        title: "Terms of Service Generator",
        category: "Legal Policy Generators",
        categoryId: "legal-policies",
        description: "21-section standardized legal terms generator tailored to your company model.",
        readTime: "5 min read",
      },
      {
        id: "embed-policies",
        title: "Dynamic Embed & Live Sync",
        category: "Legal Policy Generators",
        categoryId: "legal-policies",
        description: "Embed live policies with automatic cookie table synchronization.",
        readTime: "3 min read",
      },
    ],
  },
]

export const ALL_DOC_ARTICLES: DocArticleMeta[] = DOCS_CATEGORIES.flatMap((c) => c.articles)

export function getArticleById(id: string): DocArticleMeta | undefined {
  return ALL_DOC_ARTICLES.find((a) => a.id === id)
}

export function getAdjacentArticles(currentId: string): { prev?: DocArticleMeta; next?: DocArticleMeta } {
  const index = ALL_DOC_ARTICLES.findIndex((a) => a.id === currentId)
  if (index === -1) return {}
  return {
    prev: index > 0 ? ALL_DOC_ARTICLES[index - 1] : undefined,
    next: index < ALL_DOC_ARTICLES.length - 1 ? ALL_DOC_ARTICLES[index + 1] : undefined,
  }
}
