"use client"

import React from "react"
import Link from "next/link"
import { LegalLayout } from "./legal-layout"
import { FileText, Shield, AlertTriangle, Scale, CreditCard } from "lucide-react"

export function TermsOfServiceView() {
  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "eligibility", title: "2. Eligibility & Account Registration" },
    { id: "workspaces", title: "3. Workspaces & Team Administration" },
    { id: "subscriptions", title: "4. Subscription Plans & Features" },
    { id: "billing-paddle", title: "5. Billing, Payments & Merchant of Record" },
    { id: "cancellation", title: "6. Cancellation, Renewals & Refunds" },
    { id: "acceptable-use", title: "7. Acceptable Use & Prohibited Activities" },
    { id: "customer-data", title: "8. Customer Data & Content Ownership" },
    { id: "compliance-disclaimer", title: "9. Regulatory Compliance & No Legal Advice" },
    { id: "platform-ip", title: "10. Intellectual Property & Platform License" },
    { id: "third-party", title: "11. Third-Party Services & Integrations" },
    { id: "availability", title: "12. Service Availability & Maintenance" },
    { id: "disclaimers", title: "13. Disclaimers of Warranties" },
    { id: "liability", title: "14. Limitation of Liability" },
    { id: "indemnification", title: "15. Indemnification" },
    { id: "termination", title: "16. Suspension & Termination" },
    { id: "governing-law", title: "17. Governing Law & Dispute Resolution" },
    { id: "general-contact", title: "18. General Terms & Contact" },
  ]

  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The terms governing your access to and use of the UpFront analytics and consent management SaaS platform."
      lastUpdated="September 29, 2026"
      effectiveDate="October 1, 2026"
      sections={sections}
      currentSlug="terms"
    >
      <div className="space-y-8">
        {/* DISCLAIMER NOTICE CARD */}
        <div className="not-prose rounded-xl border border-amber-200 bg-amber-50/70 p-4.5 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
            <Scale className="size-4.5 text-amber-700 shrink-0" />
            Software Tools & No Legal Advice Disclaimer
          </div>
          <p className="leading-relaxed">
            UpFront provides cloud software tools for web analytics and cookie consent banner management. 
            <strong> UpFront does not provide legal advice.</strong> You are solely responsible for ensuring your use of our service complies with applicable data privacy laws in your jurisdiction.
          </p>
        </div>

        {/* 1. ACCEPTANCE */}
        <section id="acceptance">
          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms of Service (&ldquo;<strong>Terms</strong>&rdquo;) constitute a legally binding agreement between you (&ldquo;<strong>Customer</strong>&rdquo;, &ldquo;<strong>you</strong>&rdquo;, or &ldquo;<strong>your</strong>&rdquo;) 
            and UpFront Technologies Inc. (&ldquo;<strong>UpFront</strong>&rdquo;, &ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, or &ldquo;<strong>our</strong>&rdquo;).
          </p>
          <p>
            By creating an account, connecting a website, clicking &ldquo;I Agree&rdquo; (or similar acceptance indicator), or accessing our web application, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our <Link href="/privacy">Privacy Policy</Link>. 
            If you are entering into these Terms on behalf of an entity, you represent that you possess the authority to bind that entity.
          </p>
        </section>

        {/* 2. ELIGIBILITY */}
        <section id="eligibility">
          <h2>2. Eligibility & Account Registration</h2>
          <p>
            You must be at least 18 years of age (or the age of legal majority in your jurisdiction) to access or use the Service. 
            When registering, you agree to provide accurate, current, and complete information and to keep your credentials secure.
          </p>
          <p>
            You are entirely responsible for all activities that occur under your account. You must notify UpFront immediately upon becoming aware of any unauthorized account access or security breach.
          </p>
        </section>

        {/* 3. WORKSPACES */}
        <section id="workspaces">
          <h2>3. Workspaces & Team Administration</h2>
          <p>
            UpFront utilizes a multi-tenant workspace architecture. As a Workspace Owner or Administrator:
          </p>
          <ul>
            <li>You may invite team members, assign workspace roles (Owner, Admin, Member, Viewer), and manage connected domains.</li>
            <li>You are responsible for all actions taken by invited team members within your workspaces.</li>
            <li>All domains, consent configurations, and analytics data within a workspace remain strictly isolated to authorized members of that workspace.</li>
          </ul>
        </section>

        {/* 4. SUBSCRIPTIONS */}
        <section id="subscriptions">
          <h2>4. Subscription Plans & Features</h2>
          <p>
            UpFront offers Free, Growth, and Business subscription tiers. Feature availability, pageview limits, cookie scanning quotas, and retention schedules are determined by your active subscription plan as detailed on our <Link href="/pricing">Pricing Page</Link>.
          </p>
          <ul>
            <li><strong>Unlimited Websites:</strong> All subscription plans support unlimited website domains without per-site artificial surcharges.</li>
            <li><strong>Pageview Metering:</strong> Subscriptions are metered based on aggregate monthly pageviews across all domains in your workspace.</li>
            <li><strong>Feature Entitlements:</strong> Advanced capabilities (such as IAB TCF v2.3, Custom CSS styling, Google Consent Mode v2, and Automated Scheduled Scans) require an active corresponding tier and are enforced server-side.</li>
          </ul>
        </section>

        {/* 5. BILLING & PADDLE */}
        <section id="billing-paddle">
          <h2>5. Billing, Payments & Merchant of Record</h2>
          <p>
            All commercial transactions, paid plan subscriptions, tax collection, and checkout flows are managed by our Merchant of Record, <strong>Paddle.com Market Ltd</strong> (&ldquo;Paddle&rdquo;).
          </p>
          <ul>
            <li><strong>Merchant of Record:</strong> Paddle is the Merchant of Record for all orders. When purchasing a subscription, you enter into a binding purchase contract with Paddle.</li>
            <li><strong>Taxes:</strong> Paddle calculates and collects applicable Value Added Tax (VAT), Goods and Services Tax (GST), and Sales Taxes based on your billing location.</li>
            <li><strong>Invoicing & Receipts:</strong> Invoices and transaction receipts are issued electronically by Paddle and accessible via the billing tab in your UpFront Settings.</li>
          </ul>
        </section>

        {/* 6. CANCELLATION & REFUNDS */}
        <section id="cancellation">
          <h2>6. Cancellation, Renewals & Refunds</h2>
          <p>
            Subscriptions renew automatically on a recurring monthly or annual billing cycle unless canceled prior to the renewal date:
          </p>
          <ul>
            <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your dashboard Settings or via the Paddle Customer Portal. Upon cancellation, your paid entitlements remain active until the end of the current billing period.</li>
            <li><strong>Downgrade to Free:</strong> After subscription expiration, your workspace reverts automatically to the Free tier. Historical data exceeding Free retention limits is archived or purged in accordance with our data retention schedule.</li>
            <li><strong>Refunds:</strong> Refund requests are evaluated in accordance with Paddle&apos;s standard buyer terms and consumer protection laws. If you experience technical defects, contact <a href="mailto:support@upfront.io">support@upfront.io</a>.</li>
          </ul>
        </section>

        {/* 7. ACCEPTABLE USE */}
        <section id="acceptable-use">
          <h2>7. Acceptable Use & Prohibited Activities</h2>
          <p>
            You agree not to use the Service to:
          </p>
          <ul>
            <li>Violate any local, national, or international privacy laws, wiretapping statutes, or intellectual property rights.</li>
            <li>Target, probe, or execute automated cookie scans against websites, networks, or digital properties that you do not own or have explicit written authorization to audit.</li>
            <li>Attempt to bypass, defeat, or manipulate our Server-Side Request Forgery (SSRF) filters, rate limits, or billing entitlement gates.</li>
            <li>Transmit malware, Trojan horses, automated scraping bots, or harmful payloads through our script injection mechanisms or custom CSS fields.</li>
            <li>Reverse engineer, decompile, or extract the source code of the UpFront backend infrastructure.</li>
          </ul>
        </section>

        {/* 8. CUSTOMER DATA */}
        <section id="customer-data">
          <h2>8. Customer Data & Content Ownership</h2>
          <p>
            Between you and UpFront, you retain all right, title, and interest in and to all data collected from your websites, visitor statistics, banner copy, custom styling, and configuration settings (&ldquo;<strong>Customer Data</strong>&rdquo;).
          </p>
          <p>
            You grant UpFront a non-exclusive, worldwide, royalty-free license to host, store, process, and display Customer Data solely to the extent necessary to provide, secure, and maintain the Service on your behalf.
          </p>
        </section>

        {/* 9. COMPLIANCE DISCLAIMER */}
        <section id="compliance-disclaimer">
          <h2>9. Regulatory Compliance & No Legal Advice</h2>
          <p>
            UpFront is a software technology provider:
          </p>
          <ul>
            <li><strong>No Legal Advice:</strong> No information, template text, cookie descriptions, legal framework presets (e.g. GDPR, CCPA, LGPD), or scanner reports provided by UpFront constitute legal, regulatory, or compliance advice.</li>
            <li><strong>Customer Sole Responsibility:</strong> You are solely responsible for verifying that your cookie declarations, banner disclosures, script blocking configurations, and tracking practices fulfill the legal requirements of the jurisdictions in which you operate.</li>
            <li><strong>No Guaranteed Immunity:</strong> Implementing UpFront does not guarantee that your website will avoid regulatory enforcement, fines, or privacy complaints.</li>
          </ul>
        </section>

        {/* 10. PLATFORM IP */}
        <section id="platform-ip">
          <h2>10. Intellectual Property & Platform License</h2>
          <p>
            The Service, including the UpFront runtime scripts (<code>userly.js</code>, <code>upfront.js</code>), Banner Studio interface, algorithms, scanner engines, documentation, trademarks, and UI components, are the exclusive intellectual property of UpFront Technologies Inc. and its licensors.
          </p>
          <p>
            Subject to your compliance with these Terms, UpFront grants you a limited, revocable, non-exclusive, non-transferable license to embed our tracking and consent scripts on your authorized websites.
          </p>
        </section>

        {/* 11. THIRD PARTY */}
        <section id="third-party">
          <h2>11. Third-Party Services & Integrations</h2>
          <p>
            The Service may interact with or transmit signals to third-party services (such as Google Tag Manager, Google Consent Mode v2, and third-party advertising tags). UpFront is not responsible for the availability, privacy practices, or compliance of third-party platforms.
          </p>
        </section>

        {/* 12. AVAILABILITY */}
        <section id="availability">
          <h2>12. Service Availability & Maintenance</h2>
          <p>
            We strive to provide exceptional uptime and high performance across our global edge network. However, the Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. 
            We may occasionally perform scheduled or emergency maintenance resulting in temporary service interruptions.
          </p>
        </section>

        {/* 13. DISCLAIMERS */}
        <section id="disclaimers">
          <h2>13. Disclaimers of Warranties</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, UPFRONT DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. 
            WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FULLY IMMUNE TO SECURITY VULNERABILITIES.
          </p>
        </section>

        {/* 14. LIABILITY */}
        <section id="liability">
          <h2>14. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL UPFRONT, ITS DIRECTORS, EMPLOYEES, PARTNERS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, DATA LOSS, REGULATORY FINES, OR BUSINESS INTERRUPTION) ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
          </p>
          <p>
            OUR TOTAL AGGREGATE LIABILITY UNDER THESE TERMS SHALL NOT EXCEED THE TOTAL FEES ACTUALLY PAID BY YOU TO UPFRONT (OR PADDLE ON OUR BEHALF) IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
          </p>
        </section>

        {/* 15. INDEMNIFICATION */}
        <section id="indemnification">
          <h2>15. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless UpFront, its affiliates, officers, and employees from and against any third-party claims, liabilities, damages, losses, or expenses (including reasonable attorneys&apos; fees) arising out of or related to: 
            (a) your violation of these Terms; (b) your website content or tracking activities; (c) your violation of any privacy laws or third-party rights; or (d) unauthorized scanning of third-party domains.
          </p>
        </section>

        {/* 16. TERMINATION */}
        <section id="termination">
          <h2>16. Suspension & Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account immediately if you violate these Terms, engage in fraudulent payment activity, or pose a security risk to the platform. 
            Upon termination, your license to use the UpFront script terminates and you must remove our script from your websites.
          </p>
        </section>

        {/* 17. GOVERNING LAW */}
        <section id="governing-law">
          <h2>17. Governing Law & Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles. 
            Any disputes arising under these Terms shall be resolved through binding confidential arbitration or in the state or federal courts located in Delaware.
          </p>
        </section>

        {/* 18. GENERAL */}
        <section id="general-contact">
          <h2>18. General Terms & Contact Information</h2>
          <p>
            These Terms constitute the entire agreement between you and UpFront regarding the Service. If any provision is deemed unenforceable, the remaining provisions shall remain in full force and effect.
          </p>
          <p>
            For questions regarding these Terms or legal notices, contact:
          </p>
          <div className="not-prose rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1 text-slate-700">
            <p className="font-bold text-slate-900">UpFront Technologies Inc. — Legal Department</p>
            <p>Email: <a href="mailto:legal@upfront.io" className="text-[#1868db] font-semibold hover:underline">legal@upfront.io</a></p>
            <p>Support: <a href="mailto:support@upfront.io" className="text-[#1868db] font-semibold hover:underline">support@upfront.io</a></p>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}
