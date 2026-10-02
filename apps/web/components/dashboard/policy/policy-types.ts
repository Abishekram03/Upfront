import { LucideIcon, Cookie, Shield, FileText, Scale, RefreshCw, AlertOctagon, Truck, ShieldAlert } from "lucide-react"

export type PolicyId =
  | "privacy"
  | "cookies"
  | "terms"
  | "eula"
  | "return"
  | "disclaimer"
  | "shipping"
  | "acceptable_use"

export type PolicyStatus = "published" | "draft" | "not_created"

export interface PolicyDefinition {
  id: PolicyId
  name: string
  shortTitle: string
  category: "compliance" | "commercial" | "legal" | "terms"
  description: string
  recommendedFor: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  defaultSampleText: string
}

export interface DomainPolicyRecord {
  policyId: PolicyId
  status: PolicyStatus
  publishedAt?: string
  publishedAgo?: string
  version?: string
  lastEditedBy?: string
  customTitle?: string
  contentMarkdown?: string
  contentHtml?: string
  config?: any
  updatedAt?: string
}

export type PolicyRecord = DomainPolicyRecord

export const AVAILABLE_POLICIES: PolicyDefinition[] = [
  {
    id: "privacy",
    name: "Privacy Policy",
    shortTitle: "PRIVACY POLICY",
    category: "compliance",
    description: "Explains what personal data you collect, why you collect it, how you use it, and how visitors can exercise their GDPR, CCPA, and DPDP privacy rights.",
    recommendedFor: "All Websites & Apps",
    icon: Shield,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-200",
    defaultSampleText: "This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from our website. We process personal data under applicable legal frameworks (GDPR, CCPA/CPRA, and DPDP).",
  },
  {
    id: "cookies",
    name: "Cookie Policy",
    shortTitle: "COOKIE POLICY",
    category: "compliance",
    description: "Itemizes all cookies, trackers, tags, and tracking scripts used on your website, along with their category, purpose, and expiration duration.",
    recommendedFor: "All Websites with Trackers",
    icon: Cookie,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-200",
    defaultSampleText: "Our website uses cookies to distinguish you from other users. This helps us provide you with a good experience when you browse our website and allows us to improve our site and measure marketing performance.",
  },
  {
    id: "terms",
    name: "Terms and Conditions",
    shortTitle: "TERMS AND CONDITIONS",
    category: "legal",
    description: "Sets the binding legal rules, intellectual property rights, liability limits, and dispute resolution terms between your business and visitors.",
    recommendedFor: "All Websites & SaaS",
    icon: FileText,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50 border-indigo-200",
    defaultSampleText: "These Terms and Conditions constitute a legally binding agreement between you and our company concerning your access to and use of our website, services, and associated media channels.",
  },
  {
    id: "eula",
    name: "EULA",
    shortTitle: "EULA",
    category: "legal",
    description: "End User License Agreement granting revocable software licenses and prohibiting reverse engineering, unauthorized redistribution, or modification.",
    recommendedFor: "Software, Apps & Plugins",
    icon: Scale,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50 border-purple-200",
    defaultSampleText: "This End User License Agreement is a legal agreement between you and our company for the software product accompanying this EULA, which includes computer software and associated documentation.",
  },
  {
    id: "return",
    name: "Return & Refund Policy",
    shortTitle: "RETURN POLICY",
    category: "commercial",
    description: "Specifies return windows, refund eligibility, exchange procedures, and payment gateway compliance terms (Stripe, PayPal, Paddle).",
    recommendedFor: "Ecommerce & Subscriptions",
    icon: RefreshCw,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border-emerald-200",
    defaultSampleText: "We offer a 30-day money-back guarantee for all digital software subscriptions and physical purchases. To be eligible for a return, your item must be unused and in the same condition that you received it.",
  },
  {
    id: "disclaimer",
    name: "Disclaimer",
    shortTitle: "DISCLAIMER",
    category: "legal",
    description: "Protects your business by limiting liability for affiliate commissions (FTC compliance), informational content, health, or financial disclosures.",
    recommendedFor: "Blogs & Affiliate Sites",
    icon: AlertOctagon,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-200",
    defaultSampleText: "The information provided on this website is for general informational purposes only. All information is provided in good faith, however we make no representation or warranty of any kind regarding accuracy.",
  },
  {
    id: "shipping",
    name: "Shipping Policy",
    shortTitle: "SHIPPING POLICY",
    category: "commercial",
    description: "Details shipping timelines, domestic vs. international rates, customs duties, lost shipment resolutions, and fulfillment tracking.",
    recommendedFor: "Physical Goods Ecommerce",
    icon: Truck,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50 border-sky-200",
    defaultSampleText: "All orders are processed within 1 to 2 business days. Shipping charges for your order will be calculated and displayed at checkout depending on the shipping method selected.",
  },
  {
    id: "acceptable_use",
    name: "Acceptable Use Policy",
    shortTitle: "ACCEPTABLE USE POLICY",
    category: "terms",
    description: "Defines acceptable conduct, anti-spam regulations, rate limits, security rules, and grounds for immediate account termination.",
    recommendedFor: "SaaS, Forums & APIs",
    icon: ShieldAlert,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50 border-rose-200",
    defaultSampleText: "You may not use our services for any illegal or unauthorized purpose, nor may you violate any laws in your jurisdiction (including copyright or trademark laws) or attempt to probe platform vulnerabilities.",
  },
]
