"use client"

import React from "react"
import Link from "next/link"
import { LegalLayout } from "./legal-layout"
import { Server, Shield, CheckCircle2, Globe } from "lucide-react"

export function SubprocessorsView() {
  const sections = [
    { id: "overview", title: "1. Overview & Due Diligence" },
    { id: "infrastructure-subprocessors", title: "2. Cloud Infrastructure & Hosting" },
    { id: "payment-subprocessors", title: "3. Merchant of Record & Payments" },
    { id: "third-party-services", title: "4. Supporting Services" },
    { id: "updates-notifications", title: "5. Subprocessor Updates & Inquiries" },
  ]

  return (
    <LegalLayout
      title="Subprocessors Directory"
      subtitle="Authorized third-party infrastructure and service providers engaged by UpFront to deliver our platform."
      lastUpdated="September 29, 2026"
      effectiveDate="October 1, 2026"
      sections={sections}
      currentSlug="subprocessors"
    >
      <div className="space-y-8">
        <div className="not-prose rounded-xl border border-slate-200 bg-slate-50/80 p-4.5 text-xs text-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Server className="size-4.5 text-[#1868db] shrink-0" />
            Security & Subprocessor Standards
          </div>
          <p className="leading-relaxed">
            UpFront enforces strict security, confidentiality, and data protection requirements on all third-party vendors. 
            All subprocessors are bound by Data Processing Agreements (DPAs) incorporating standard contractual clauses.
          </p>
        </div>

        {/* 1. OVERVIEW */}
        <section id="overview">
          <h2>1. Overview & Due Diligence</h2>
          <p>
            To provide our global software services, UpFront Technologies Inc. engages third-party entities (&ldquo;<strong>Subprocessors</strong>&rdquo;) 
            that may process certain Customer Data or account telemetry on our behalf. 
            Before engaging any subprocessor, UpFront conducts rigorous technical, operational, and legal security assessments.
          </p>
        </section>

        {/* 2. INFRASTRUCTURE */}
        <section id="infrastructure-subprocessors">
          <h2>2. Cloud Infrastructure & Hosting</h2>
          <p>
            Our core application services, real-time analytics engine, and database backends run on the following certified infrastructure providers:
          </p>
          <div className="not-prose overflow-x-auto my-4">
            <table className="min-w-full text-xs text-left border border-slate-200 divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-900">
                <tr>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Service Provided</th>
                  <th className="p-3">Corporate Headquarters</th>
                  <th className="p-3">Data Processing Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Vercel Inc.</td>
                  <td className="p-3">Frontend Hosting, Global Edge CDN, Serverless Function Execution</td>
                  <td className="p-3">San Francisco, CA, USA</td>
                  <td className="p-3">Global Edge Network</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Supabase Inc. / Amazon Web Services (AWS)</td>
                  <td className="p-3">Managed PostgreSQL Cloud Database, Data Storage & Backups</td>
                  <td className="p-3">Singapore / Seattle, WA, USA</td>
                  <td className="p-3">European Union (Frankfurt AWS Region)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. PAYMENTS */}
        <section id="payment-subprocessors">
          <h2>3. Merchant of Record & Payments</h2>
          <p>
            For subscription purchases, checkout transactions, and sales tax compliance, we engage:
          </p>
          <div className="not-prose overflow-x-auto my-4">
            <table className="min-w-full text-xs text-left border border-slate-200 divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-900">
                <tr>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Service Provided</th>
                  <th className="p-3">Corporate Headquarters</th>
                  <th className="p-3">Data Processing Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Paddle.com Market Ltd / Paddle Payments Inc.</td>
                  <td className="p-3">Merchant of Record, Subscription Billing, Credit Card Processing, Global Tax Remittance</td>
                  <td className="p-3">London, United Kingdom</td>
                  <td className="p-3">United Kingdom & United States</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. THIRD PARTY SERVICES */}
        <section id="third-party-services">
          <h2>4. Supporting Services</h2>
          <div className="not-prose overflow-x-auto my-4">
            <table className="min-w-full text-xs text-left border border-slate-200 divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-900">
                <tr>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Service Provided</th>
                  <th className="p-3">Data Processing Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">MaxMind Inc.</td>
                  <td className="p-3">GeoIP Country/City Metadata Resolution (In-memory lookup, no IP logged)</td>
                  <td className="p-3">United States</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. UPDATES */}
        <section id="updates-notifications">
          <h2>5. Subprocessor Updates & Inquiries</h2>
          <p>
            UpFront maintains an active subprocessor management policy. When new subprocessors are onboarded, this directory is updated prior to authorizing data processing. 
            Customers with Enterprise DPAs may subscribe to notification updates by emailing <a href="mailto:privacy@upfront.io">privacy@upfront.io</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  )
}
