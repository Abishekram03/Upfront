"use client"

import React from "react"
import Link from "next/link"
import { LegalLayout } from "./legal-layout"
import { Cookie, Shield, CheckCircle2, Lock } from "lucide-react"

export function CookiePolicyView() {
  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "what-are-cookies", title: "2. What Are Cookies & Local Storage" },
    { id: "our-application-cookies", title: "3. Cookies Used on UpFront Application" },
    { id: "visitor-tracker-cookies", title: "4. Cookieless Tracking on Customer Sites" },
    { id: "cookie-categories", title: "5. Cookie Categories We Manage" },
    { id: "managing-cookies", title: "6. Managing & Disabling Cookies" },
    { id: "contact-cookies", title: "7. Contact Us" },
  ]

  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="How cookies and local storage are utilized on the UpFront platform and across customer websites."
      lastUpdated="September 29, 2026"
      effectiveDate="October 1, 2026"
      sections={sections}
      currentSlug="cookies"
    >
      <div className="space-y-8">
        <div className="not-prose rounded-xl border border-emerald-200 bg-emerald-50/70 p-4.5 text-xs text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
            <Lock className="size-4.5 text-emerald-700 shrink-0" />
            Cookieless Analytics by Design
          </div>
          <p className="leading-relaxed">
            When our script is embedded on your website, <strong>UpFront Web Analytics operates completely without placing cookies</strong> or local storage trackers on your visitors&apos; browsers. 
            Cookies are strictly used for registered account holders logging into our dashboard or when visitors deliberately save their privacy consent preferences.
          </p>
        </div>

        {/* 1. INTRODUCTION */}
        <section id="introduction">
          <h2>1. Introduction</h2>
          <p>
            This Cookie Policy explains how UpFront Technologies Inc. (&ldquo;<strong>UpFront</strong>&rdquo;, &ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;) 
            uses cookies, local storage, and similar technologies when you visit our website (<code>upfront.io</code>) or access our SaaS application. 
            It also explains how our Consent Management Platform (CMP) interacts with cookies on our customers&apos; digital properties.
          </p>
        </section>

        {/* 2. WHAT ARE COOKIES */}
        <section id="what-are-cookies">
          <h2>2. What Are Cookies & Local Storage</h2>
          <p>
            Cookies are small text files placed on your computer or mobile device when you browse websites. Local Storage is a browser feature that allows websites to store key-value data directly on your device without transmitting it with every HTTP request.
          </p>
        </section>

        {/* 3. APPLICATION COOKIES */}
        <section id="our-application-cookies">
          <h2>3. Cookies Used on the UpFront Application</h2>
          <p>
            When you create an account or sign into the UpFront dashboard, we set strictly necessary first-party cookies to manage authentication, session security, and workspace preferences:
          </p>
          <div className="not-prose overflow-x-auto my-4">
            <table className="min-w-full text-xs text-left border border-slate-200 divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-900">
                <tr>
                  <th className="p-3">Cookie Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-3 font-mono font-semibold text-slate-900">better-auth.session_token</td>
                  <td className="p-3">Strictly Necessary</td>
                  <td className="p-3">Session / 30 Days</td>
                  <td className="p-3">Authenticates your active user session securely.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-semibold text-slate-900">upfront_active_workspace_id</td>
                  <td className="p-3">Functional</td>
                  <td className="p-3">1 Year (localStorage)</td>
                  <td className="p-3">Remembers your currently active workspace between visits.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-semibold text-slate-900">upfront_consent</td>
                  <td className="p-3">Strictly Necessary</td>
                  <td className="p-3">180 Days</td>
                  <td className="p-3">Stores user privacy consent choices so banner is not shown repeatedly.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. VISITOR TRACKER */}
        <section id="visitor-tracker-cookies">
          <h2>4. Cookieless Tracking on Customer Sites</h2>
          <p>
            UpFront was built to eliminate unnecessary surveillance capitalism:
          </p>
          <ul>
            <li>Our web analytics tracking script (<code>userly.js</code>, <code>upfront.js</code>) sets <strong>zero analytics cookies</strong> on your visitors&apos; browsers.</li>
            <li>We do not generate cross-device fingerprints, supercookies, or third-party tracking beacons.</li>
            <li>Unique visitor counts are computed using daily rotating cryptographic hashes that cannot be reverse-engineered or tracked across days.</li>
          </ul>
        </section>

        {/* 5. COOKIE CATEGORIES */}
        <section id="cookie-categories">
          <h2>5. Cookie Categories We Manage</h2>
          <p>
            Our Consent Management Platform classifies digital trackers into five distinct categories:
          </p>
          <ul>
            <li><strong>Strictly Necessary:</strong> Essential for core website functionality, security, and accessibility (always active).</li>
            <li><strong>Functional:</strong> Remembers user preferences, localized language selections, and UI state.</li>
            <li><strong>Analytics:</strong> Aggregates metrics on pageviews, traffic sources, and performance.</li>
            <li><strong>Performance:</strong> Monitors site speed, error logging, and resource loading.</li>
            <li><strong>Advertisement / Marketing:</strong> Tracks conversion events, ad personalization, and retargeting campaigns.</li>
          </ul>
        </section>

        {/* 6. MANAGING COOKIES */}
        <section id="managing-cookies">
          <h2>6. Managing & Disabling Cookies</h2>
          <p>
            You can modify your browser settings to reject or delete cookies at any time:
          </p>
          <ul>
            <li><strong>Browser Settings:</strong> Chrome, Firefox, Safari, and Edge allow you to block cookies via their Privacy & Security settings.</li>
            <li><strong>Global Privacy Control (GPC):</strong> You can enable GPC in supporting browsers (such as Brave or Firefox) to automatically communicate your preference to opt out of non-essential trackers.</li>
          </ul>
        </section>

        {/* 7. CONTACT */}
        <section id="contact-cookies">
          <h2>7. Contact Us</h2>
          <p>
            If you have questions about our use of cookies or tracking technologies, please email <a href="mailto:privacy@upfront.io">privacy@upfront.io</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  )
}
