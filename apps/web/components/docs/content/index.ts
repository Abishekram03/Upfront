import React from "react"
import { DocHeading } from "@/lib/docs/docs-types"
import { OverviewDoc, QuickstartDoc, InstallationDoc, VerificationDoc } from "./getting-started"
import { BannerStudioDoc, LegalFrameworksDoc, GoogleConsentModeDoc, ScriptRulesDoc, GeoTargetingDoc } from "./consent-cmp"
import { ScannerOverviewDoc, CookieCategorizationDoc, ScheduledScansDoc } from "./cookie-scanner"
import { AnalyticsOverviewDoc, RealtimeMetricsDoc, UtmReferrersDoc } from "./privacy-analytics"
import { ProofRecordsDoc, ExportAuditLogsDoc } from "./proof-of-consent"
import { PrivacyPolicyGenDoc, TermsOfServiceGenDoc, EmbedPoliciesDoc } from "./legal-policies"

interface ArticleContentDefinition {
  component: React.ComponentType
  headings: DocHeading[]
}

export const DOC_ARTICLE_COMPONENTS: Record<string, ArticleContentDefinition> = {
  // 1. Getting Started
  overview: {
    component: OverviewDoc,
    headings: [
      { id: "introduction", title: "Introduction & Architecture", level: 2 },
      { id: "why-upfront", title: "Why UpFront?", level: 2 },
      { id: "architectural-pillars", title: "Core Architectural Pillars", level: 2 },
      { id: "compliance-matrix", title: "Global Compliance Compatibility", level: 2 },
    ],
  },
  quickstart: {
    component: QuickstartDoc,
    headings: [
      { id: "quickstart-guide", title: "Quickstart Guide", level: 2 },
      { id: "step-1-create-site", title: "Step 1: Create Workspace & Add Website", level: 2 },
      { id: "step-2-embed-script", title: "Step 2: Embed Snippet in <head>", level: 2 },
      { id: "step-3-verify", title: "Step 3: Verify Live Telemetry & CMP", level: 2 },
      { id: "next-steps", title: "Recommended Next Steps", level: 2 },
    ],
  },
  installation: {
    component: InstallationDoc,
    headings: [
      { id: "script-installation", title: "Script Installation Across Frameworks", level: 2 },
      { id: "script-attributes", title: "Snippet Attributes & Options", level: 2 },
      { id: "framework-guides", title: "Framework Guides (HTML, Next.js, React, CMS)", level: 2 },
      { id: "auto-blocking-how-to", title: "Tagging Scripts for Auto-Blocking", level: 2 },
    ],
  },
  verification: {
    component: VerificationDoc,
    headings: [
      { id: "domain-verification", title: "Domain Verification & Health Check", level: 2 },
      { id: "verification-methods", title: "3 Ways to Verify Installation", level: 2 },
      { id: "debug-mode", title: "Enabling Verbose Debug Mode", level: 2 },
      { id: "troubleshooting-checklist", title: "Common Troubleshooting Scenarios", level: 2 },
    ],
  },

  // 2. Consent Management (CMP)
  "banner-studio": {
    component: BannerStudioDoc,
    headings: [
      { id: "banner-studio", title: "Banner Studio & Layouts", level: 2 },
      { id: "banner-layouts", title: "Banner Form Factors & Layouts", level: 2 },
      { id: "styling-options", title: "Visual Theming & Customization", level: 2 },
      { id: "preference-centre", title: "The Granular Preference Centre", level: 2 },
      { id: "re-opening-banner", title: "Re-Opening Banner Programmatically", level: 2 },
    ],
  },
  "legal-frameworks": {
    component: LegalFrameworksDoc,
    headings: [
      { id: "legal-frameworks", title: "Legal Frameworks (GDPR, CCPA, LGPD)", level: 2 },
      { id: "framework-presets", title: "Compliance Presets Comparison", level: 2 },
      { id: "equal-prominence", title: "GDPR Equal Prominence Rule", level: 2 },
      { id: "gpc-signal", title: "Global Privacy Control (GPC) Support", level: 2 },
    ],
  },
  "google-consent-mode": {
    component: GoogleConsentModeDoc,
    headings: [
      { id: "google-consent-mode", title: "Google Consent Mode v2 Integration", level: 2 },
      { id: "consent-signals", title: "The 4 Consent Mode v2 Signals", level: 2 },
      { id: "automatic-sync", title: "Automatic dataLayer Synchronization", level: 2 },
      { id: "verifying-consent-mode", title: "Verifying Consent Signals in Network Tab", level: 2 },
    ],
  },
  "script-rules": {
    component: ScriptRulesDoc,
    headings: [
      { id: "script-rules", title: "Script Auto-Blocking Rules", level: 2 },
      { id: "how-it-works", title: "How Client-Side Auto-Blocking Operates", level: 2 },
      { id: "manual-tagging", title: "Manual Script Tagging (Best Practice)", level: 2 },
      { id: "javascript-events", title: "Programmatic Event Listeners", level: 2 },
    ],
  },
  "geo-targeting": {
    component: GeoTargetingDoc,
    headings: [
      { id: "geo-targeting", title: "Geo-Targeting & Regional Delivery", level: 2 },
      { id: "edge-detection", title: "Edge Geo-Resolution (Zero IP Storage)", level: 2 },
      { id: "multi-language", title: "Automatic Multi-Language Translation", level: 2 },
    ],
  },

  // 3. Cookie Scanner & Audits
  "scanner-overview": {
    component: ScannerOverviewDoc,
    headings: [
      { id: "scanner-overview", title: "Automated Cookie Scanner", level: 2 },
      { id: "scanning-technology", title: "Two-Tier Scanning Engine", level: 2 },
      { id: "what-is-detected", title: "Detected Storage & Tracker Types", level: 2 },
      { id: "running-a-scan", title: "How to Run a Manual Scan", level: 2 },
    ],
  },
  categorization: {
    component: CookieCategorizationDoc,
    headings: [
      { id: "cookie-categorization", title: "Cookie Categorization & Overrides", level: 2 },
      { id: "standard-categories", title: "The 5 Standard Compliance Categories", level: 2 },
      { id: "dictionary-matching", title: "Automated Dictionary Matching", level: 2 },
      { id: "manual-overrides", title: "Custom Overrides & Editing", level: 2 },
    ],
  },
  "scheduled-scans": {
    component: ScheduledScansDoc,
    headings: [
      { id: "scheduled-scans", title: "Scheduled Audits & Auto-Sync", level: 2 },
      { id: "why-continuous-audits", title: "Why Continuous Cookie Auditing is Critical", level: 2 },
      { id: "configuring-schedule", title: "Configuring Scan Schedule & Depth", level: 2 },
      { id: "audit-reports", title: "Audit History & Regulatory Export", level: 2 },
    ],
  },

  // 4. Privacy Analytics
  "analytics-overview": {
    component: AnalyticsOverviewDoc,
    headings: [
      { id: "analytics-overview", title: "Cookieless Tracking Engine", level: 2 },
      { id: "how-it-works", title: "How Daily Cryptographic Hashing Works", level: 2 },
      { id: "privacy-pillars", title: "Zero-PII Compliance Architecture", level: 2 },
      { id: "captured-metrics", title: "Metrics Collected by UpFront", level: 2 },
    ],
  },
  "realtime-metrics": {
    component: RealtimeMetricsDoc,
    headings: [
      { id: "realtime-metrics", title: "Live Visitors & Real-Time Pulse", level: 2 },
      { id: "pulse-engine", title: "The 5-Minute Rolling Pulse Engine", level: 2 },
      { id: "realtime-dimensions", title: "Real-Time Dashboard Dimensions", level: 2 },
    ],
  },
  "utm-referrers": {
    component: UtmReferrersDoc,
    headings: [
      { id: "utm-referrers", title: "UTM Campaigns & Custom Events", level: 2 },
      { id: "utm-parameters", title: "Automated UTM Parameter Extraction", level: 2 },
      { id: "custom-events", title: "Custom Event Tracking API", level: 2 },
      { id: "react-integration", title: "React & Next.js Integration Helper", level: 2 },
    ],
  },

  // 5. Proof of Consent Vault
  "proof-records": {
    component: ProofRecordsDoc,
    headings: [
      { id: "proof-records", title: "Audit Trail Receipts & Cryptographic Proof", level: 2 },
      { id: "legal-requirement", title: "GDPR Article 7(1) & Regulatory Burden of Proof", level: 2 },
      { id: "receipt-structure", title: "Consent Receipt Payload Structure", level: 2 },
      { id: "dashboard-inspection", title: "Inspecting Proof Logs in Dashboard", level: 2 },
    ],
  },
  "export-audit-logs": {
    component: ExportAuditLogsDoc,
    headings: [
      { id: "export-audit-logs", title: "CSV Exports & Regulatory Defense", level: 2 },
      { id: "filtering-records", title: "Filtering Audit Records", level: 2 },
      { id: "export-formats", title: "Exporting to CSV & JSON", level: 2 },
    ],
  },

  // 6. Legal Policy Generators
  "privacy-policy-gen": {
    component: PrivacyPolicyGenDoc,
    headings: [
      { id: "privacy-policy-gen", title: "Privacy Policy Generator", level: 2 },
      { id: "policy-sections", title: "13 Comprehensive Legal Sections", level: 2 },
      { id: "cookie-table-sync", title: "Automated Cookie Table Synchronization", level: 2 },
      { id: "how-to-generate", title: "Generating Your Policy in 3 Steps", level: 2 },
    ],
  },
  "terms-of-service-gen": {
    component: TermsOfServiceGenDoc,
    headings: [
      { id: "terms-of-service-gen", title: "Terms of Service Generator", level: 2 },
      { id: "business-presets", title: "Customized for Your Business Model", level: 2 },
      { id: "core-clauses", title: "Essential Protection Clauses Included", level: 2 },
    ],
  },
  "embed-policies": {
    component: EmbedPoliciesDoc,
    headings: [
      { id: "embed-policies", title: "Dynamic Embed & Live Sync", level: 2 },
      { id: "integration-methods", title: "3 Flexible Delivery Options", level: 2 },
      { id: "live-synchronization", title: "Automatic Cookie Table Updates", level: 2 },
    ],
  },
}
