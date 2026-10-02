import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import {
  Container,
  CTAGroup,
  PageHero,
  Reveal,
  Section,
  SectionHeader,
} from "@/components/marketing/ui";
import { plans } from "@/lib/site";
import { FaqSection } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing — UpFront",
  description:
    "Simple pricing based on monthly pageviews, not websites. Free, Growth ($19/month), and Business ($39/month) — every plan includes unlimited websites.",
  openGraph: {
    title: "Pricing — UpFront",
    description:
      "Simple pricing based on monthly pageviews, not websites. Free, Growth ($19/month), and Business ($39/month) — every plan includes unlimited websites.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

type MatrixRow = {
  group: string;
  rows: { label: string; free: string | boolean; growth: string | boolean; business: string | boolean }[];
};

const matrix: MatrixRow[] = [
  {
    group: "Usage",
    rows: [
      { label: "Monthly pageviews", free: "50,000", growth: "250,000", business: "1,000,000" },
      { label: "Websites", free: "Unlimited", growth: "Unlimited", business: "Unlimited" },
      {
        label: "Analytics & consent history",
        free: "30 days",
        growth: "12 months",
        business: "24 months",
      },
    ],
  },
  {
    group: "Cookie scanner",
    rows: [
      { label: "Pages per scan", free: "100", growth: "1,000", business: "5,000" },
      { label: "Manual scans", free: true, growth: true, business: true },
      { label: "Scheduled scans", free: false, growth: "Monthly", business: "Weekly & daily" },
      { label: "Scan history", free: true, growth: true, business: true },
    ],
  },
  {
    group: "Consent capabilities",
    rows: [
      { label: "Consent banner", free: "Bottom-bar banner", growth: "Additional layouts", business: "Additional layouts" },
      { label: "Preference Centre", free: true, growth: true, business: true },
      { label: "Script auto-blocking", free: true, growth: true, business: true },
      { label: "Cookie Policy generator", free: true, growth: true, business: true },
      { label: "Geo-targeting", free: false, growth: true, business: true },
      { label: "Multi-language", free: false, growth: true, business: true },
      { label: "Banner version rollback", free: false, growth: true, business: true },
      { label: "Google Consent Mode v2", free: false, growth: true, business: true },
      { label: "Global Privacy Control (GPC)", free: false, growth: true, business: true },
      { label: "IAB TCF v2.3", free: false, growth: false, business: true },
      { label: "Custom CSS", free: false, growth: false, business: true },
    ],
  },
  {
    group: "Analytics",
    rows: [
      { label: "Real-time analytics", free: true, growth: true, business: true },
      { label: "Referrers & UTM", free: true, growth: true, business: true },
      { label: "Geography, devices, browsers, OS", free: true, growth: true, business: true },
      { label: "Flexible date ranges", free: true, growth: true, business: true },
      { label: "Multi-site workspace", free: true, growth: true, business: true },
    ],
  },
  {
    group: "Proof of Consent",
    rows: [
      { label: "Proof-of-consent records", free: true, growth: true, business: true },
      { label: "Search & filtering", free: true, growth: true, business: true },
      { label: "CSV export", free: true, growth: true, business: true },
    ],
  },
  {
    group: "Support",
    rows: [
      { label: "Support", free: "Community", growth: "Email", business: "Priority compliance support" },
    ],
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-soft text-success" aria-label="Included">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-label="Not included">
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  return <span className="text-sm text-ink-soft">{value}</span>;
}

const pricingFaqs = [
  {
    q: "How does billing work?",
    a: "Plans are billed per workspace, not per website. You can start on the Free plan without a credit card and upgrade only when you need higher limits.",
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
    q: "Is annual billing available?",
    a: "The prices shown are current launch pricing for monthly billing. Annual billing and add-ons may be introduced later.",
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Priced by traffic. Not by website."
        description="Every plan includes unlimited websites and the full UpFront platform. You only pay for the monthly pageviews you use."
      />

      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Reveal key={plan.id} delay={plan.featured ? 100 : 0}>
              <div
                className={cn(
                  "card-lift relative flex h-full flex-col rounded-xl border bg-surface p-6",
                  plan.featured
                    ? "border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/25"
                    : "border-line shadow-xs",
                )}
              >
                <h2 className="text-base font-medium text-ink">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-medium tracking-normal text-ink">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.unit}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink-soft">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <CTAGroup
                  className="mt-6"
                  align="left"
                  primary={{ label: plan.cta, to: "/contact" }}
                />
                {plan.id === "free" ? (
                  <p className="mt-2.5 text-xs text-muted-foreground">No credit card required</p>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Prices shown are current launch pricing for monthly billing. Limits on each plan remain
          configurable.
        </p>
      </Section>

      <Section className="border-t border-line bg-surface">
        <Reveal>
          <SectionHeader
            eyebrow="Compare plans"
            title="Everything, side by side."
            description="A detailed breakdown of what each plan includes across the whole platform."
          />
        </Reveal>
        <Container className="mt-10 max-w-none">
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[44rem] border-collapse bg-surface text-left">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="px-5 py-4 text-sm font-medium text-ink">
                    Feature
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-sm font-medium text-ink">
                    Free
                  </th>
                  <th scope="col" className="bg-brand-mist/40 px-4 py-4 text-center text-sm font-medium text-primary">
                    Growth
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-sm font-medium text-ink">
                    Business
                  </th>
                </tr>
              </thead>
              {matrix.map((group) => (
                  <tbody key={group.group}>
                    <tr className="border-b border-line bg-muted/40">
                      <th
                        colSpan={4}
                        scope="rowgroup"
                        className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        {group.group}
                      </th>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.label} className="border-b border-line last:border-0">
                        <th scope="row" className="px-5 py-3 text-sm font-medium text-ink font-normal text-left">
                          {row.label}
                        </th>
                        <td className="px-4 py-3 text-center">
                          <CellValue value={row.free} />
                        </td>
                        <td className="bg-brand-mist/25 px-4 py-3 text-center">
                          <CellValue value={row.growth} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <CellValue value={row.business} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
            </table>
          </div>
        </Container>
      </Section>

      <FaqSection eyebrow="Pricing FAQ" title="Pricing questions" items={pricingFaqs} />
      <FinalCta
        title="Start free. Upgrade when you outgrow it."
        description="Create your workspace on the Free plan — no credit card required."
        secondaryLabel="Read the documentation"
        secondaryTo="/docs"
      />
    </>
  );
}
