import type { Metadata } from "next";
import {
  Activity,
  BarChart3,
  Compass,
  Gauge,
  Globe2,
  Lock,
  PieChart,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  CTAGroup,
  CheckItem,
  CrossItem,
  FeatureCard,
  PageHero,
  Reveal,
  Section,
  SectionHeader,
} from "@/components/marketing/ui";
import { FaqSection } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Website Analytics — Cookieless, real-time, privacy-first | UpFront",
  description:
    "Privacy-friendly website analytics with a script under 4KB: live visitors, pageviews, referrers, UTM campaigns, geography, and devices — cookieless by default, no raw IP storage.",
  openGraph: {
    title: "Website Analytics — Cookieless, real-time, privacy-first | UpFront",
    description:
      "Privacy-friendly website analytics with a script under 4KB: live visitors, pageviews, referrers, UTM campaigns, geography, and devices — cookieless by default, no raw IP storage.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const faqs = [
  {
    q: "How does UpFront measure visits without cookies?",
    a: "UpFront generates a privacy-preserving daily hash from the request headers. It cannot track visitors across different days or different websites, and no cookies are stored on visitor devices.",
  },
  {
    q: "Does UpFront store IP addresses?",
    a: "No. Raw IP addresses are discarded immediately after country-level lookup. UpFront never writes raw IP addresses to disk or stores them in the database.",
  },
  {
    q: "How large is the UpFront script?",
    a: "The script is under 4KB, deferred by default, and served from a global edge network — so it won't impact your Core Web Vitals.",
  },
  {
    q: "Can I track UTM campaigns?",
    a: "Yes. UTM source, medium, campaign, term, and content parameters are automatically captured and broken down in your dashboard.",
  },
  {
    q: "How far back does analytics history go?",
    a: "Retention follows your plan: 30 days of history on Free, 12 months on Growth, and 24 months on Business.",
  },
];

export default function AnalyticsPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy Analytics"
        title="Website analytics you don't have to apologize for."
        description="Cookieless by default, zero raw IP storage, and a script under 4KB. Get real-time visitors, referrers, and campaign performance without turning your visitors into data points."
      >
        <CTAGroup
          primary={{ label: "Start for free", to: "/contact" }}
          secondary={{ label: "See pricing", to: "/pricing" }}
        />
      </PageHero>

      <Section className="border-t border-line bg-surface">
        <Reveal>
          <SectionHeader
            eyebrow="Core metrics"
            title="Everything you need to understand your traffic."
            description="Clear metrics organized into a single dashboard. No hidden menus, no multi-level drilldowns, no configuration required."
          />
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <FeatureCard icon={<Activity className="h-5 w-5" />} title="Live visitors">
              See who is on your site right now, updated every few seconds with a live heartbeat.
            </FeatureCard>
          </Reveal>
          <Reveal delay={100}>
            <FeatureCard icon={<Compass className="h-5 w-5" />} title="Referrers & UTM">
              Track where visitors come from: search engines, social networks, direct links, and
              campaign tags.
            </FeatureCard>
          </Reveal>
          <Reveal delay={200}>
            <FeatureCard icon={<Globe2 className="h-5 w-5" />} title="Geography & tech">
              Country breakdown, device types, operating systems, and browsers — all aggregated.
            </FeatureCard>
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeader
              align="left"
              eyebrow="Privacy architecture"
              title="Privacy built into the data layer."
              description="Most analytics platforms collect raw identifiers and promise not to abuse them. UpFront is designed so the identifiers never exist in the first place."
            />
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
                <h3 className="text-sm font-medium text-ink">What UpFront collects</h3>
                <ul className="mt-3 space-y-2">
                  <CheckItem>Aggregated pageviews and unique visit counts</CheckItem>
                  <CheckItem>Referrer domain and UTM campaign parameters</CheckItem>
                  <CheckItem>Country of origin (derived at the edge)</CheckItem>
                  <CheckItem>Device category, browser family, and OS</CheckItem>
                </ul>
              </div>
              <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
                <h3 className="text-sm font-medium text-ink">What UpFront never collects</h3>
                <ul className="mt-3 space-y-2">
                  <CrossItem>Raw IP addresses</CrossItem>
                  <CrossItem>Persistent visitor cookies</CrossItem>
                  <CrossItem>Cross-site tracking identifiers</CrossItem>
                  <CrossItem>Individual user profiles or advertising IDs</CrossItem>
                </ul>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard icon={<Lock className="h-5 w-5" />} title="Cookieless by default">
                No tracking cookies, no local storage tokens for analytics, no consent banner
                required for basic measurement.
              </FeatureCard>
              <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="No raw IP storage">
                IPs are resolved to a country at the edge and immediately discarded.
              </FeatureCard>
              <FeatureCard icon={<Zap className="h-5 w-5" />} title="Under 4KB script">
                Loads asynchronously without blocking page rendering or degrading Core Web Vitals.
              </FeatureCard>
              <FeatureCard icon={<PieChart className="h-5 w-5" />} title="Multi-site workspace">
                Every plan includes unlimited websites. Switch between sites in one click.
              </FeatureCard>
            </div>
          </Reveal>
        </div>
      </Section>

      <FaqSection eyebrow="Analytics FAQ" title="Questions about analytics" items={faqs} />
      <FinalCta
        title="Ready for lighter, cleaner analytics?"
        description="Start for free and have cookieless analytics live on your site in under two minutes."
        secondaryLabel="Explore consent management"
        secondaryTo="/product/consent"
      />
    </>
  );
}
