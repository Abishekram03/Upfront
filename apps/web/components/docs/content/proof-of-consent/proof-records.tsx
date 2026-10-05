"use client"

import React from "react"
import { FileCheck, Shield, Key, Lock, CheckCircle2, FileText, Database } from "lucide-react"
import { DocsCallout } from "../../docs-callout"
import { DocsCodeBlock } from "../../docs-code-block"

export function ProofRecordsDoc() {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="h-px w-4 bg-primary/60" />
          <span>Proof of Consent Vault</span>
          <span>•</span>
          <span>Audit Trail Receipts</span>
        </div>
        <h1 id="proof-records" className="mt-3 text-3xl font-medium tracking-normal text-balance text-ink sm:text-4xl">
          Audit Trail Receipts & Cryptographic Proof
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Under GDPR Article 7(1), website operators bear the legal burden of proving that valid consent was obtained. UpFront generates immutable, cryptographic consent receipts for every visitor interaction.
        </p>
      </div>

      {/* GDPR Article 7(1) Requirement */}
      <div className="space-y-4">
        <h2 id="legal-requirement" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          GDPR Article 7(1) & Regulatory Burden of Proof
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          European Data Protection Authorities (such as CNIL, DPC, and BfDI) require that website owners demonstrate:
        </p>

        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li><strong>Who consented:</strong> A unique pseudonymous visitor identifier.</li>
          <li><strong>When they consented:</strong> Exact UTC timestamp of the submission.</li>
          <li><strong>What they were shown:</strong> Version and text of the consent banner displayed at that moment.</li>
          <li><strong>What was agreed to:</strong> Granular categories accepted vs. rejected.</li>
          <li><strong>How it was obtained:</strong> Explicit affirmative action (button click), not passive scrolling.</li>
        </ul>
      </div>

      {/* Cryptographic Receipt Schema */}
      <div className="space-y-4">
        <h2 id="receipt-structure" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Consent Receipt Payload Structure
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When a visitor saves their preferences or clicks &quot;Accept All&quot;, UpFront generates a tamper-evident audit record:
        </p>

        <DocsCodeBlock
          language="json"
          filename="consent-receipt-schema.json"
          code={`{
  "receipt_id": "rec_01HZ8B5W9QXN...",
  "timestamp": "2026-10-05T06:15:22.418Z",
  "domain": "example.com",
  "visitor_token_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "geo_country": "DE",
  "banner_version": "v2.4.1",
  "action": "custom_selection",
  "categories": {
    "necessary": true,
    "functional": true,
    "analytics": false,
    "performance": true,
    "advertisement": false
  },
  "signature": "3a7b9c...f4e1"
}`}
        />

        <DocsCallout type="tip" title="Zero PII Retention">
          The <code>visitor_token_hash</code> is an irreversible SHA-256 one-way hash stored in client LocalStorage. UpFront never stores email addresses, device MAC addresses, or raw IP addresses in the audit vault.
        </DocsCallout>
      </div>

      {/* Verification in Dashboard */}
      <div className="space-y-4">
        <h2 id="dashboard-inspection" className="text-2xl font-medium tracking-normal text-ink border-b border-line pb-3">
          Inspecting Proof Logs in Dashboard
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          View and inspect live consent logs directly in your UpFront portal:
        </p>

        <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
          <li>Navigate to <strong>Proof of Consent &rarr; Audit Vault</strong>.</li>
          <li>Search by <code>Receipt ID</code> or filter by date range and country.</li>
          <li>Click any record to inspect the exact category permissions granted and signature checksum.</li>
        </ol>
      </div>
    </article>
  )
}
