import type { Metadata } from "next";
import { Gauge, ShieldCheck, Wrench } from "lucide-react";
import {
  CTAGroup,
  FeatureCard,
  PageHero,
  Reveal,
  Section,
  SectionHeader,
} from "@/components/marketing/ui";
import { FinalCta } from "@/components/marketing/cta";
import { COMPANY, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `About — ${SITE_NAME} by ${COMPANY}`,
  description:
    "UpFront is built by Syft Technologies: simpler website operations, privacy-first technology, and lightweight infrastructure for the modern web.",
  openGraph: {
    title: `About — ${SITE_NAME} by ${COMPANY}`,
    description:
      "UpFront is built by Syft Technologies: simpler website operations, privacy-first technology, and lightweight infrastructure for the modern web.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Website operations, simplified and made private by default."
        description={`${SITE_NAME} is built by ${COMPANY}. We make practical tools for modern websites — starting with privacy analytics and consent management in one lightweight script.`}
      />

      <Section>
        <Reveal>
          <div className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            <p>
              Running a website today means juggling a stack of tools: analytics in one dashboard,
              consent management in another, each with its own script, learning curve, and bill —
              while your visitors' experience gets stitched together somewhere in between.
            </p>
            <p className="mt-6">
              We started {SITE_NAME} because the essential parts of website operations —
              understanding your traffic and respecting your visitors — should live in one place,
              weigh almost nothing, and stay out of your way.
            </p>
          </div>
        </Reveal>
      </Section>

      <Section className="border-t border-line bg-surface">
        <Reveal>
          <SectionHeader eyebrow="What we believe" title="How we build" />
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <FeatureCard icon={<Wrench className="h-5 w-5" />} title="Simpler website operations">
              Fewer tools, fewer scripts, fewer dashboards. One place to understand your traffic
              and manage consent.
            </FeatureCard>
          </Reveal>
          <Reveal delay={100}>
            <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Privacy-first technology">
              Cookieless analytics by default, zero raw IP storage, and consent records built in —
              privacy as architecture, not a bolt-on.
            </FeatureCard>
          </Reveal>
          <Reveal delay={200}>
            <FeatureCard icon={<Gauge className="h-5 w-5" />} title="Lightweight infrastructure">
              A script under 4KB. Fast by design, because your visitors shouldn't pay for our
              features.
            </FeatureCard>
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">The long view</p>
            <h2 className="mt-3 text-2xl font-medium tracking-normal text-ink md:text-3xl">
              Building toward the unified privacy and compliance layer for the modern web.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Today, that means analytics and consent management done well. Tomorrow, it means
              expanding the platform to cover more of the operational concerns every modern website
              shares — one step at a time.
            </p>
          </div>
        </Reveal>
      </Section>

      <Section className="border-t border-line bg-surface">
        <Reveal>
          <div className="rounded-xl border border-line bg-surface p-8 text-center shadow-xs">
            <h2 className="text-2xl font-medium tracking-normal text-ink">
              Want to see it in action?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Start for free, or get in touch — we're a small team and we read every message.
            </p>
            <div className="mt-6">
              <CTAGroup
                primary={{ label: "Start for free", to: "/contact" }}
                secondary={{ label: "Contact us", to: "/contact" }}
              />
            </div>
          </div>
        </Reveal>
      </Section>

      <FinalCta
        title="Bring analytics and consent together."
        description="Start with UpFront for free and get your website operations in one lightweight platform."
        secondaryLabel="Read the documentation"
        secondaryTo="/docs"
      />
    </>
  );
}
