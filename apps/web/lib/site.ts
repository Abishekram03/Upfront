export const SITE_NAME = "UpFront";
export const COMPANY = "Syft Technologies";
export const SITE_TAGLINE = "Know your traffic. Respect their privacy. One script under 4KB.";
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
  { category: "Google Consent Mode v2", upfront: true, traditional: "Varies" },
  { category: "Global Privacy Control", upfront: true, traditional: "Varies" },
  { category: "IAB TCF v2.3", upfront: true, traditional: "Varies" },
  { category: "Websites included", upfront: "Unlimited", traditional: "Often per domain" },
  { category: "Dashboards", upfront: "One unified dashboard", traditional: "Separate dashboards" },
  { category: "License & Cost", upfront: "Free & Open Source (Apache 2.0)", traditional: "Paid subscriptions" },
  { category: "Script footprint", upfront: "One script under 4KB", traditional: "Multiple scripts" },
];

export type Faq = { q: string; a: string };

export const homeFaqs: Faq[] = [
  {
    q: "What is UpFront?",
    a: "UpFront is a privacy-first website platform by Syft Technologies that combines cookieless analytics with a complete Consent Management Platform — including a consent banner, cookie scanner, and proof-of-consent records — all loaded through one lightweight script under 4KB.",
  },
  {
    q: "How is UpFront different from traditional analytics?",
    a: "Traditional setups pair a web analytics tool with a separate consent platform, each with its own script, dashboard, and bill. UpFront unifies analytics and consent management in a single product with one unified dashboard.",
  },
  {
    q: "Does UpFront use cookies for analytics?",
    a: "No. UpFront analytics is cookieless by default and does not rely on cookies or persistent identifiers for measurement. The consent management side still helps you manage the cookies your other tools set.",
  },
  {
    q: "Does UpFront store raw IP addresses?",
    a: "No. Raw IP addresses are discarded immediately after country-level lookup. UpFront never writes raw IPs to disk or stores them in the database.",
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
    q: "Can I manage multiple websites?",
    a: "Yes. UpFront includes unlimited websites and unlimited pageviews in your self-hosted setup with 100% full data ownership.",
  },
  {
    q: "How do I install UpFront?",
    a: "Open your dashboard, add your website, and copy the one-line script. Paste it into your site's <head> and data starts flowing immediately — setup takes under two minutes.",
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
      { label: "GitHub", to: "https://github.com/Abishekram03/usrly" },
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
