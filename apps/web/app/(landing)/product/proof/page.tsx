import type { Metadata } from "next";
import { Database, Download, Search } from "lucide-react";
import {
  CTAGroup,
  CheckItem,
  FeatureCard,
  PageHero,
  Reveal,
  Section,
  SectionHeader,
} from "@/components/marketing/ui";
import { BrowserMockupFrame } from "@/components/marketing/dashboard-preview";
import { FaqSection } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Proof of Consent — Consent records and audit evidence | UpFront",
  description:
    "Keep a proof-of-consent audit trail: timestamp, country, consent status, categories, and configuration version for every visitor choice — searchable, filterable, and exportable.",
  openGraph: {
    title: "Proof of Consent — Consent records and audit evidence | UpFront",
    description:
      "Keep a proof-of-consent audit trail: timestamp, country, consent status, categories, and configuration version for every visitor choice — searchable, filterable, and exportable.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const faqs = [
  {
    q: "What does a proof-of-consent record contain?",
    a: "Each record captures the timestamp, country, consent status, the categories granted, and the banner configuration version that was active when the choice was made — along with a receipt identifier.",
  },
  {
    q: "How long are consent records retained?",
    a: "Retention follows your plan: 30 days of consent history on Free, 12 months on Growth, and 24 months on Business. Analytics history follows the same retention windows.",
  },
  {
    q: "Can I export consent records?",
    a: "Yes. Records can be searched and filtered in the vault and exported to CSV whenever you need evidence for an audit or a data request.",
  },
  {
    q: "What happens when I change my banner configuration?",
    a: "Consent records store the configuration version that was active when each choice was made, so you can always tell which version of your banner produced a given record.",
  },
  {
    q: "Is proof of consent a legal guarantee?",
    a: "No. Proof-of-consent records are evidence that consent was requested and given at a point in time. UpFront provides software tools, not legal advice, and use of the Service does not guarantee regulatory compliance.",
  },
];

export default function ProofPage() {
  return (
    <>
      <PageHero
        eyebrow="Proof of Consent"
        title="Keep a clear, searchable record of every consent decision."
        description="Every visitor choice becomes a proof-of-consent record — a receipt you can search, filter, and export as evidence that consent was requested and given."
      >
        <CTAGroup
          primary={{ label: "Star on GitHub", to: "https://github.com/Abishekram03/usrly" }}
          secondary={{ label: "Open Consent Ledger", to: "/consent/logs" }}
        />
        <div className="mx-auto mt-12 max-w-4xl text-left">
          <BrowserMockupFrame
            src="/dashboard-illustration/policies.png"
            alt="UpFront Consent Ledger & Compliance Records"
            width={1693}
            height={877}
            url="upfront.local/consent/logs"
            priority
          />
        </div>
      </PageHero>

      <Section className="border-t border-line bg-surface">
        <Reveal>
          <SectionHeader
            eyebrow="The audit vault"
            title="Evidence, organized like an audit trail."
            description="The Proof-of-Consent vault stores every choice with the context you need to reconstruct it later."
          />
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <FeatureCard icon={<Search className="h-5 w-5" />} title="Search & filtering">
              Find records by receipt, country, status, category, or configuration version.
            </FeatureCard>
          </Reveal>
          <Reveal delay={100}>
            <FeatureCard icon={<Download className="h-5 w-5" />} title="CSV export">
              Export exactly the records you need, in a format auditors and legal teams can use.
            </FeatureCard>
          </Reveal>
          <Reveal delay={200}>
            <FeatureCard icon={<Database className="h-5 w-5" />} title="Historical records">
              Consent history is retained per your plan — 30 days, 12 months, or 24 months.
            </FeatureCard>
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <div className="rounded-xl border border-line bg-surface p-6 shadow-lg shadow-slate-900/[0.06]">
              <p className="text-sm font-medium text-ink">What's inside a record</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  ["Timestamp", "When the choice was made (UTC)"],
                  ["Country", "Where the visitor was located"],
                  ["Consent status", "Granted, partial, or denied"],
                  ["Categories", "Which consent categories were granted"],
                  ["Configuration", "Which banner version was active"],
                  ["Receipt identifier", "A unique reference for the record"],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-start justify-between gap-4 border-b border-line pb-2.5 last:border-0">
                    <span className="font-medium text-ink">{k}</span>
                    <span className="text-right text-muted-foreground">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120} className="order-1 lg:order-2">
            <SectionHeader
              align="left"
              eyebrow="Data retention"
              title="Records that match your retention needs."
              description="Your plan defines how long consent and analytics history is retained. Choose the window that fits your policies — records outside the window are automatically removed."
            />
            <ul className="mt-6 space-y-2.5">
              <CheckItem>Free plan: 30 days of analytics & consent history</CheckItem>
              <CheckItem>Growth plan: 12 months of history</CheckItem>
              <CheckItem>Business plan: 24 months of history</CheckItem>
            </ul>
          </Reveal>
        </div>
      </Section>

      <FaqSection
        eyebrow="Proof FAQ"
        title="Questions about proof of consent"
        items={faqs}
      />
      <FinalCta
        title="Keep a clear record of consent."
        description="Start for free and give every consent decision a searchable, exportable receipt."
        secondaryLabel="Explore analytics"
        secondaryTo="/product/analytics"
      />
    </>
  );
}
