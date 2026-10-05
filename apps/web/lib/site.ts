export const SITE_NAME = "UpFront";
export const COMPANY = "Syft Technologies";
export const SITE_TAGLINE = "Privacy analytics and consent, unified in one lightweight script.";
export const LAST_UPDATED = "September 29, 2026";

export const productNav = [
  {
    to: "/product/analytics",
    title: "Analytics",
    description: "Privacy-first website analytics",
  },
  {
    to: "/product/consent",
    title: "Consent Management",
    description: "Cookie consent and script control",
  },
  {
    to: "/product/scanner",
    title: "Cookie Scanner",
    description: "Discover cookies and trackers",
  },
  {
    to: "/product/proof",
    title: "Proof of Consent",
    description: "Maintain consent records and audit evidence",
  },
];

export type Plan = {
  id: "free" | "growth" | "business";
  name: string;
  price: number;
  unit: string;
  tagline: string;
  featured?: boolean;
  cta: string;
  features: string[];
};

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    unit: "/month",
    tagline: "For getting a new site off the ground.",
    cta: "Start for free",
    features: [
      "50,000 monthly pageviews",
      "100 pages/scan",
      "30 days analytics & consent history",
      "Unlimited websites",
      "Real-time analytics",
      "Standard bottom-bar banner",
      "Preference Centre",
      "Cookie Policy",
      "Manual scanner",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 19,
    unit: "/month",
    tagline: "For teams growing their web presence.",
    featured: true,
    cta: "Start for free",
    features: [
      "250,000 monthly pageviews",
      "1,000 pages/scan",
      "12 months history",
      "Unlimited websites",
      "Additional banner layouts",
      "Global Privacy Control",
      "Geo-targeting",
      "Google Consent Mode v2",
      "Monthly scheduled scans",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 39,
    unit: "/month",
    tagline: "For organizations with broader compliance needs.",
    cta: "Start for free",
    features: [
      "1,000,000 monthly pageviews",
      "5,000 pages/scan",
      "24 months history",
      "Unlimited websites",
      "Everything in Growth",
      "IAB TCF v2.3",
      "Custom CSS",
      "Multi-language",
      "Weekly and daily scheduled scans",
      "Priority compliance support",
    ],
  },
];

export type ComparisonRow = {
  category: string;
  upfront: string | boolean;
  traditional: string | boolean;
};

export const comparisonRows: ComparisonRow[] = [
  { category: "Cookieless analytics", upfront: true, traditional: "Varies" },
  { category: "Consent management", upfront: true, traditional: "Separate CMP" },
  { category: "Cookie scanning", upfront: true, traditional: "Add-on" },
  { category: "Proof-of-consent records", upfront: true, traditional: "Add-on" },
  { category: "Script auto-blocking", upfront: true, traditional: "Add-on" },
  { category: "Google Consent Mode v2", upfront: "Growth+", traditional: "Varies" },
  { category: "Global Privacy Control", upfront: "Growth+", traditional: "Varies" },
  { category: "IAB TCF v2.3", upfront: "Business", traditional: "Varies" },
  { category: "Websites included", upfront: "Unlimited", traditional: "Often per domain" },
  { category: "Dashboards", upfront: "One unified dashboard", traditional: "Separate dashboards" },
  { category: "Billing", upfront: "Single subscription", traditional: "Separate vendors" },
  { category: "Script footprint", upfront: "One script under 4KB", traditional: "Multiple scripts" },
];

export type Faq = { q: string; a: string };

export const homeFaqs: Faq[] = [
  {
    q: "What is UpFront?",
    a: "UpFront is a website platform by Syft Technologies that combines privacy-first, cookieless analytics with a full-featured Consent Management Platform, a cookie scanner, and proof-of-consent records — all loaded through one lightweight script under 4KB.",
  },
  {
    q: "How is UpFront different from traditional analytics?",
    a: "Traditional setups pair a web analytics tool with a separate consent platform, each with its own script, dashboard, and bill. UpFront unifies analytics, consent management, cookie scanning, and consent records in a single product with one unified dashboard.",
  },
  {
    q: "Does UpFront use cookies for analytics?",
    a: "No. UpFront analytics is cookieless by default and does not rely on cookies or persistent identifiers for measurement. Cookie scanning and consent features still help you manage the cookies your other tools set.",
  },
  {
    q: "Does UpFront store raw IP addresses?",
    a: "No. UpFront is built with zero raw IP storage. Traffic is processed in a way that does not retain raw IP addresses in our analytics systems.",
  },
  {
    q: "How does the consent banner work?",
    a: "You configure categories, layouts, and text in the Banner Studio. When a visitor makes a choice, UpFront records it, stores the preference, and blocks or releases the scripts mapped to each consent category.",
  },
  {
    q: "Can UpFront block third-party scripts?",
    a: "Yes. Script auto-blocking holds third-party scripts until the visitor grants the consent category they are mapped to, and releases them automatically when consent is given.",
  },
  {
    q: "Does UpFront support Google Consent Mode v2?",
    a: "Yes. Google Consent Mode v2 is available on the Growth and Business plans, letting your Google tags respect the consent states collected by UpFront.",
  },
  {
    q: "Does UpFront support Global Privacy Control?",
    a: "Yes. Global Privacy Control (GPC) signals are respected on the Growth and Business plans and can be recorded alongside visitor choices.",
  },
  {
    q: "Can I manage multiple websites?",
    a: "Yes. Every plan includes unlimited websites in one workspace. Pricing is based on monthly pageviews, not on the number of websites you add.",
  },
  {
    q: "How do I install UpFront?",
    a: "Create a workspace, add your website, and copy the one-line script from your dashboard. Paste it into your site's <head> and data starts flowing immediately.",
  },
  {
    q: "How long does installation take?",
    a: "Setup takes under two minutes: create your workspace, copy the script, and paste it into your website.",
  },
  {
    q: "What happens when I exceed my pageview limit?",
    a: "We'll notify you as you approach your plan's monthly pageview allowance so you can upgrade before you reach it. You can change plans at any time from your workspace.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes. Plans can be changed at any time, and changes apply to your billing going forward.",
  },
  {
    q: "How does billing work?",
    a: "Plans are billed per workspace, not per website. You can start on the Free plan without a credit card and upgrade only when you need higher limits.",
  },
  {
    q: "Is UpFront a legal compliance service?",
    a: "No. UpFront provides software tools for website analytics and consent management. Use of the Service does not constitute legal advice and does not guarantee regulatory compliance.",
  },
];

export const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Analytics", to: "/product/analytics" },
      { label: "Consent Management", to: "/product/consent" },
      { label: "Cookie Scanner", to: "/product/scanner" },
      { label: "Proof of Consent", to: "/product/proof" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", to: "/docs" },
      { label: "Pricing", to: "/pricing" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "About", to: "/about" }],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
      { label: "Cookies", to: "/cookies" },
      { label: "Subprocessors", to: "/subprocessors" },
    ],
  },
];
