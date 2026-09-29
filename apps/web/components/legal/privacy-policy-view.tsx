"use client"

import React from "react"
import Link from "next/link"
import { LegalLayout } from "./legal-layout"
import { Shield, Lock, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react"

export function PrivacyPolicyView() {
  const sections = [
    { id: "introduction", title: "1. Introduction & Overview" },
    { id: "who-we-are", title: "2. Who We Are & Scope" },
    { id: "roles-definitions", title: "3. Roles: Controller vs. Processor" },
    { id: "account-information", title: "4. Information from Account Holders" },
    { id: "visitor-information", title: "5. Information from Customer Website Visitors" },
    { id: "analytics-operation", title: "6. Cookieless Web Analytics Operation" },
    { id: "cmp-operation", title: "7. Consent Management & Proof-of-Consent Logs" },
    { id: "cookie-scanner-operation", title: "8. Cookie Scanner & Script Rules" },
    { id: "purposes-legal-bases", title: "9. How We Use Data & Legal Bases" },
    { id: "sharing-subprocessors", title: "10. Subprocessors & Third-Party Service Providers" },
    { id: "payment-processing", title: "11. Paddle Billing & Merchant of Record" },
    { id: "data-retention", title: "12. Data Retention Schedules" },
    { id: "international-transfers", title: "13. International Data Transfers & Security" },
    { id: "data-subject-rights", title: "14. Your Privacy Rights (GDPR / UK GDPR)" },
    { id: "california-privacy", title: "15. California Privacy Disclosures (CCPA / CPRA)" },
    { id: "customer-responsibilities", title: "16. Customer Obligations & Compliance" },
    { id: "children-privacy", title: "17. Children's Privacy" },
    { id: "changes-contact", title: "18. Changes & Contact Information" },
  ]

  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How UpFront collects, processes, protects, and handles personal data across our software platform and website services."
      lastUpdated="September 29, 2026"
      effectiveDate="October 1, 2026"
      sections={sections}
      currentSlug="privacy"
    >
      <div className="space-y-8">
        {/* IMPORTANT NOTICE CARD */}
        <div className="not-prose rounded-xl border border-blue-200 bg-blue-50/70 p-4.5 text-xs text-blue-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#1868db]">
            <Shield className="size-4.5 shrink-0" />
            Important Notice on Compliance & Legal Roles
          </div>
          <p className="leading-relaxed">
            UpFront provides software tools designed to support privacy consent management and cookieless web analytics. 
            When our business customers install UpFront on their websites, the <strong>Customer acts as the Data Controller</strong> and <strong>UpFront acts as the Data Processor</strong>. 
            Use of our service does not constitute legal advice and does not guarantee regulatory compliance.
          </p>
        </div>

        {/* 1. INTRODUCTION */}
        <section id="introduction">
          <h2>1. Introduction & Overview</h2>
          <p>
            UpFront Technologies Inc. (&ldquo;<strong>UpFront</strong>&rdquo;, &ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, or &ldquo;<strong>our</strong>&rdquo;) 
            is committed to protecting individual privacy and providing transparent, privacy-centric software. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard information when you interact with our website, create an UpFront account, or access our SaaS application (collectively, the &ldquo;<strong>Service</strong>&rdquo;).
          </p>
          <p>
            Please read this policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access or use the Service.
          </p>
        </section>

        {/* 2. WHO WE ARE */}
        <section id="who-we-are">
          <h2>2. Who We Are & Scope</h2>
          <p>
            UpFront develops software for web analytics and Consent Management (CMP). 
            This policy applies to:
          </p>
          <ul>
            <li>
              <strong>Direct Users & Account Holders:</strong> Individuals who register for an UpFront account, manage workspaces, configure websites, communicate with our support team, or browse our marketing website.
            </li>
            <li>
              <strong>End-User Website Visitors:</strong> Individuals who visit websites that have integrated UpFront tracking or consent banner scripts.
            </li>
          </ul>
        </section>

        {/* 3. ROLES */}
        <section id="roles-definitions">
          <h2>3. Roles: Controller vs. Processor</h2>
          <p>
            Depending on your relationship with UpFront, applicable data protection laws (such as the European Union General Data Protection Regulation / GDPR, UK GDPR, and California Consumer Privacy Act / CCPA) assign different responsibilities:
          </p>
          <ul>
            <li>
              <strong>UpFront as Data Controller:</strong> We act as the Data Controller for personal data collected directly from our registered account holders and marketing website visitors (e.g. account credentials, billing customer IDs, and direct support inquiries).
            </li>
            <li>
              <strong>UpFront as Data Processor:</strong> When our customers integrate the UpFront script on their digital properties, our customer is the Data Controller deciding which data is gathered, what cookie categories are used, and what legal bases apply. UpFront processes visitor analytics and consent audit logs strictly on the customer&apos;s documented instructions as a Data Processor.
            </li>
          </ul>
        </section>

        {/* 4. ACCOUNT INFORMATION */}
        <section id="account-information">
          <h2>4. Information Collected from Account Holders</h2>
          <p>
            When you register for an account or manage workspaces within UpFront, we collect the following necessary personal information:
          </p>
          <ul>
            <li><strong>Account Identity Data:</strong> Full name, email address, profile image (if provided via OAuth), and securely hashed passwords.</li>
            <li><strong>Workspace & Configuration Data:</strong> Workspace names, domain URLs added to the account, banner design settings, custom CSS rules, and site metadata.</li>
            <li><strong>Authentication & Security Records:</strong> Session tokens, IP addresses, and user-agent details recorded strictly during active authentication sessions for session validation, multi-factor authentication (2FA), and brute-force prevention.</li>
            <li><strong>Billing Reference Identifiers:</strong> Paddle Customer ID, Subscription ID, and subscription tier status. Raw payment card numbers are collected and processed directly by Paddle and never touch UpFront servers.</li>
          </ul>
        </section>

        {/* 5. VISITOR INFORMATION */}
        <section id="visitor-information">
          <h2>5. Information from Customer Website Visitors</h2>
          <p>
            When an end user visits a website utilizing UpFront, the UpFront script processes minimal technical data necessary to deliver cookieless analytics and record valid proof of consent:
          </p>
          <ul>
            <li><strong>Page URL & Navigation:</strong> Pathname, referrer source (e.g. Google, Direct), entry/exit page, and visit duration.</li>
            <li><strong>Technical Attributes:</strong> Browser family, operating system, and general device type (Desktop, Mobile, Tablet).</li>
            <li><strong>Approximate Geography:</strong> Country and city inferred in real-time from server headers without saving raw IP addresses.</li>
            <li><strong>Consent Decision Data:</strong> User consent state per category (Necessary, Functional, Analytics, Performance, Advertisement), banner template version, and timestamp.</li>
          </ul>
        </section>

        {/* 6. ANALYTICS OPERATION */}
        <section id="analytics-operation">
          <h2>6. Cookieless Web Analytics Operation</h2>
          <p>
            Our analytics architecture is engineered with privacy-by-design principles:
          </p>
          <ul>
            <li>
              <strong>No Persistent Tracking Cookies:</strong> UpFront does not set persistent tracking cookies, third-party cookies, or cross-site tracking IDs on your visitors&apos; devices for analytics.
            </li>
            <li>
              <strong>Rotating Daily Salt & Pseudonymous Identifiers:</strong> To calculate unique daily visitor counts without storing personal identifiers, UpFront generates a one-way cryptographic hash combining a daily rotating salt, the visitor&apos;s IP address, User Agent, and website domain (e.g. <code>SHA-256(DailySalt + IP + UserAgent + Domain)</code>).
            </li>
            <li>
              <strong>Zero Raw IP Storage:</strong> Raw IP addresses are processed in volatile memory only for GeoIP lookup and hash generation, and are discarded immediately. Raw IP addresses are <strong>never stored</strong> in our persistent databases.
            </li>
            <li>
              <strong>No Cross-Site Tracking:</strong> Because the hash incorporates the site domain and a daily changing salt, visitors cannot be tracked across different days or across different websites.
            </li>
          </ul>
          <p className="text-xs text-slate-500 italic">
            Note: While cookieless analytics minimizes personal data collection, legal requirements regarding consent for analytics vary across jurisdictions. Customers are responsible for configuring legal settings appropriate to their jurisdiction.
          </p>
        </section>

        {/* 7. CMP OPERATION */}
        <section id="cmp-operation">
          <h2>7. Consent Management & Proof-of-Consent Logs</h2>
          <p>
            UpFront provides a comprehensive Consent Management Platform (CMP) that enables website owners to present privacy notices, collect visitor consent choices, and maintain audit records:
          </p>
          <ul>
            <li>
              <strong>Local Consent State Storage:</strong> When a visitor selects their privacy preferences, their choices are saved in a first-party cookie or local storage key (<code>upfront_consent</code>) on their browser so their preferences are respected on subsequent visits.
            </li>
            <li>
              <strong>Proof-of-Consent Audit Receipts:</strong> To support compliance verification (such as GDPR Article 7(1)), the CMP records a timestamped proof-of-consent receipt containing: the pseudonymous visitor hash, timestamp, country, consent categories approved/rejected, and consent version.
            </li>
            <li>
              <strong>Global Privacy Control (GPC):</strong> When the browser transmits a <code>Sec-GPC: 1</code> or <code>navigator.globalPrivacyControl = true</code> signal, the CMP automatically honors the signal by defaulting non-essential categories to rejected.
            </li>
            <li>
              <strong>Google Consent Mode v2:</strong> The CMP transmits standardized consent signals (<code>ad_storage</code>, <code>analytics_storage</code>, <code>ad_user_data</code>, <code>ad_personalization</code>) to supported Google tags.
            </li>
            <li>
              <strong>IAB TCF v2.3 Framework:</strong> On supported subscription tiers, UpFront exposes standardized CMP API stubs (<code>__tcfapi</code>) for programmatic vendor transparency.
            </li>
          </ul>
        </section>

        {/* 8. COOKIE SCANNER */}
        <section id="cookie-scanner-operation">
          <h2>8. Cookie Scanner & Script Rules</h2>
          <p>
            UpFront includes an automated cookie scanner and script blocking engine:
          </p>
          <ul>
            <li>
              <strong>Automated Scanning:</strong> Our hybrid scanner engine crawls customer websites using HTTP header inspection and headless browser rendering to discover cookies, local storage items, and external scripts.
            </li>
            <li>
              <strong>SSRF Defense:</strong> All scanner requests pass through strict Server-Side Request Forgery (SSRF) verification, blocking requests to private networks (RFC 1918), link-local addresses (169.254.x.x), loopback interfaces, and cloud metadata endpoints.
            </li>
            <li>
              <strong>Script Rules / MIME Gating:</strong> When enabled, unconsented third-party scripts are dynamically held in a disabled state (using MIME type modification) until the visitor grants explicit consent for that category.
            </li>
          </ul>
        </section>

        {/* 9. PURPOSES & LEGAL BASES */}
        <section id="purposes-legal-bases">
          <h2>9. How We Use Data & Legal Bases for Processing</h2>
          <p>
            For data where UpFront acts as the Data Controller, we process information under the following legal bases:
          </p>
          <ul>
            <li><strong>Performance of Contract:</strong> To provision your user account, provide access to workspaces, authenticate login sessions, and deliver the SaaS features you subscribe to.</li>
            <li><strong>Legitimate Interests:</strong> To protect our infrastructure from abuse, maintain server security, verify domain connectivity, and troubleshoot technical errors.</li>
            <li><strong>Legal Obligations:</strong> To retain tax and invoicing records required by financial regulators in conjunction with our Merchant of Record.</li>
            <li><strong>Consent:</strong> Where you voluntarily submit inquiries or opt into non-essential communications.</li>
          </ul>
        </section>

        {/* 10. SUBPROCESSORS */}
        <section id="sharing-subprocessors">
          <h2>10. Subprocessors & Third-Party Service Providers</h2>
          <p>
            UpFront engages trusted third-party infrastructure and service providers to operate our cloud platform. All subprocessors are vetted for stringent security standards and undergo Data Processing Agreements (DPAs):
          </p>
          <div className="not-prose overflow-x-auto my-4">
            <table className="min-w-full text-xs text-left border border-slate-200 divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-900">
                <tr>
                  <th className="p-3">Subprocessor</th>
                  <th className="p-3">Role / Service</th>
                  <th className="p-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Vercel Inc.</td>
                  <td className="p-3">Cloud Hosting, Edge Network CDN, and Serverless Execution</td>
                  <td className="p-3">United States / Global Edge</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Supabase Inc. / AWS</td>
                  <td className="p-3">Managed PostgreSQL Cloud Database Hosting & Storage</td>
                  <td className="p-3">European Union (Frankfurt) / Global AWS</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Paddle Payments Ltd.</td>
                  <td className="p-3">Merchant of Record, Payment Processing, Billing & Invoicing</td>
                  <td className="p-3">United Kingdom / United States</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">MaxMind Inc.</td>
                  <td className="p-3">GeoIP Country/City Resolution (In-memory lookup)</td>
                  <td className="p-3">United States</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            For a detailed list of our current infrastructure providers, visit our <Link href="/subprocessors">Subprocessors Directory</Link>.
          </p>
        </section>

        {/* 11. PAYMENT PROCESSING */}
        <section id="payment-processing">
          <h2>11. Paddle Billing & Merchant of Record Notice</h2>
          <p>
            Our order process and subscription billing is conducted by our online Merchant of Record, <strong>Paddle.com Market Ltd</strong> (&ldquo;Paddle&rdquo;). 
            Paddle is the Merchant of Record for all our paid subscriptions.
          </p>
          <p>
            Paddle handles all payment card processing, tax collection (including VAT and Sales Tax), currency conversion, and fraud prevention. 
            When subscribing to a paid UpFront plan, you enter into a commercial relationship with Paddle subject to Paddle&apos;s Terms of Service and Privacy Policy. 
            UpFront does not store or process payment card numbers on our infrastructure.
          </p>
        </section>

        {/* 12. DATA RETENTION */}
        <section id="data-retention">
          <h2>12. Data Retention Schedules</h2>
          <p>
            We retain data only as long as necessary to fulfill the purposes outlined in this policy or according to subscription limits:
          </p>
          <ul>
            <li><strong>Analytics Records:</strong> Stored according to your workspace plan retention limits (Free: 90 days; Growth: 365 days; Business: 730 days). Aggregated data is automatically purged upon expiration.</li>
            <li><strong>Consent Proof Receipts:</strong> Stored according to plan limits (Free: 30 days; Growth: 365 days; Business: 730 days).</li>
            <li><strong>Account & Workspace Information:</strong> Retained for the active lifetime of your account. Upon account deletion, all associated workspaces, websites, and telemetry records are permanently purged within 30 days.</li>
            <li><strong>Discovered Cookies & Scan Audits:</strong> Retained until replaced by subsequent scans or until the site is removed.</li>
          </ul>
        </section>

        {/* 13. TRANSFERS & SECURITY */}
        <section id="international-transfers">
          <h2>13. International Data Transfers & Security</h2>
          <p>
            UpFront employs robust technical and organizational security measures to protect data against accidental loss, unauthorized access, or unlawful destruction:
          </p>
          <ul>
            <li><strong>Encryption in Transit & at Rest:</strong> All network communications use TLS 1.3 encryption. Databases and backups are encrypted at rest using AES-256.</li>
            <li><strong>International Transfers:</strong> Where data is transferred from the European Economic Area (EEA), UK, or Switzerland to countries without an adequacy decision, transfers are governed by Standard Contractual Clauses (SCCs) approved by the European Commission.</li>
            <li><strong>Access Controls:</strong> Production database access is strictly isolated using role-based access control (RBAC), multi-factor authentication, and audited log streams.</li>
          </ul>
        </section>

        {/* 14. DATA SUBJECT RIGHTS */}
        <section id="data-subject-rights">
          <h2>14. Your Privacy Rights (GDPR / UK GDPR)</h2>
          <p>
            Under applicable European and UK data protection laws, individuals have the following rights regarding personal data for which UpFront is the Data Controller:
          </p>
          <ul>
            <li><strong>Right of Access:</strong> Request a copy of personal information we hold about you.</li>
            <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete personal data.</li>
            <li><strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Request deletion of your account and associated personal data.</li>
            <li><strong>Right to Data Portability:</strong> Request export of your workspace analytics and settings in structured formats (e.g. CSV).</li>
            <li><strong>Right to Object & Restrict Processing:</strong> Object to or restrict certain types of data processing.</li>
          </ul>
          <p>
            To exercise these rights, email <a href="mailto:privacy@upfront.io">privacy@upfront.io</a> or utilize the account management tools directly inside your UpFront dashboard Settings.
          </p>
        </section>

        {/* 15. CALIFORNIA PRIVACY */}
        <section id="california-privacy">
          <h2>15. California Privacy Disclosures (CCPA / CPRA)</h2>
          <p>
            Under the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA/CPRA):
          </p>
          <ul>
            <li><strong>No Sale or Sharing of Personal Information:</strong> UpFront <strong>does not sell</strong> personal information and <strong>does not share</strong> personal information for cross-context behavioral advertising.</li>
            <li><strong>Categories Collected:</strong> Identifiers (Name, email, IP during authentication), Internet activity (page visits on our website), and commercial records (subscription tier).</li>
            <li><strong>Non-Discrimination:</strong> We will never discriminate against you for exercising your CCPA rights.</li>
          </ul>
        </section>

        {/* 16. CUSTOMER RESPONSIBILITIES */}
        <section id="customer-responsibilities">
          <h2>16. Customer Obligations & Compliance</h2>
          <p>
            Customers deploying UpFront on their websites acknowledge and agree that:
          </p>
          <ul>
            <li>You are responsible for maintaining an accurate, accessible Privacy Policy on your own website describing your use of analytics and cookie consent tools.</li>
            <li>You must verify that your categorization of discovered cookies and script rules reflects your actual tracking practices.</li>
            <li>UpFront is a software tool and does not provide legal advice or guarantee that your website achieves total compliance with privacy laws.</li>
          </ul>
        </section>

        {/* 17. CHILDREN'S PRIVACY */}
        <section id="children-privacy">
          <h2>17. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for or directed at children under 16 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal data, please contact us immediately.
          </p>
        </section>

        {/* 18. CHANGES & CONTACT */}
        <section id="changes-contact">
          <h2>18. Changes & Contact Information</h2>
          <p>
            We may update this Privacy Policy from time to time. When updates occur, we will revise the &ldquo;Last updated&rdquo; date at the top of this policy and notify registered users via email or in-app notification for material changes.
          </p>
          <p>
            For privacy inquiries, Data Protection Officer (DPO) contact, or Data Processing Agreement requests, please contact:
          </p>
          <div className="not-prose rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1 text-slate-700">
            <p className="font-bold text-slate-900">UpFront Technologies Inc. — Privacy & Legal Team</p>
            <p>Email: <a href="mailto:privacy@upfront.io" className="text-[#1868db] font-semibold hover:underline">privacy@upfront.io</a></p>
            <p>Support: <a href="mailto:support@upfront.io" className="text-[#1868db] font-semibold hover:underline">support@upfront.io</a></p>
            <p>Website: <a href="https://upfront.io" className="text-[#1868db] hover:underline">https://upfront.io</a></p>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}
