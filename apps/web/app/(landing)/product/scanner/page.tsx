import type { Metadata } from "next";
import { CalendarClock, FileSearch, Globe, History, Tags } from "lucide-react";
import {
  CTAGroup,
  CheckItem,
  FeatureCard,
  PageHero,
  Reveal,
  Section,
  SectionHeader,
} from "@/components/marketing/ui";
import { FaqSection } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Cookie Scanner — Discover cookies and trackers | UpFront",
  description:
    "Scan your website to discover cookies and trackers, classify them into consent categories, and schedule recurring scans — all from one workspace.",
  openGraph: {
    title: "Cookie Scanner — Discover cookies and trackers | UpFront",
    description:
      "Scan your website to discover cookies and trackers, classify them into consent categories, and schedule recurring scans — all from one workspace.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const faqs = [
  {
    q: "What does the cookie scanner detect?",
    a: "UpFront scans your website and identifies the cookies and trackers it finds, including the domain that sets each one and whether it is a first-party or third-party cookie.",
  },
  {
    q: "How are cookies classified?",
    a: "Cookies found by the scanner are classified into consent categories such as strictly necessary, functional, analytics, and marketing. You can override any classification manually.",
  },
  {
    q: "How often can I scan?",
    a: "Manual scans are available on every plan. Scheduled scans run monthly on Growth, and weekly or daily on Business.",
  },
  {
    q: "How many pages can a scan cover?",
    a: "Scan limits depend on your plan: 100 pages per scan on Free, 1,000 on Growth, and 5,000 on Business.",
  },
  {
    q: "Do I need to scan before enabling the banner?",
    a: "Scanning first is recommended — it shows you which cookies and scripts your site sets, so you can map each one to the right consent category before your visitors see the banner.",
  },
];

export default function ScannerPage() {
  return (
    <>
      <PageHero
        eyebrow="Cookie Scanner"
        title="Know exactly what’s running on your website."
        description="Scan your site to discover every cookie and tracker it sets, identify who sets them, and map each one to a consent category — before your visitors ever see the banner."
      >
        <CTAGroup
          primary={{ label: "Start for free", to: "/contact" }}
          secondary={{ label: "See pricing", to: "/pricing" }}
        />
      </PageHero>

      <Section className="border-t border-line bg-surface">
        <Reveal>
          <SectionHeader
            eyebrow="Discovery & classification"
            title="From unknown cookies to mapped categories."
            description="The scanner walks your pages, collects the cookies and trackers it finds, and proposes a category for each one — you stay in control with manual overrides."
          />
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <FeatureCard icon={<Globe className="h-5 w-5" />} title="Cookie discovery">
              See the cookie name, category, domain, and type for everything your pages set —
              first-party and third-party.
            </FeatureCard>
          </Reveal>
          <Reveal delay={100}>
            <FeatureCard icon={<Tags className="h-5 w-5" />} title="Automatic classification">
              Detected cookies are proposed into necessary, functional, analytics, and marketing
              categories.
            </FeatureCard>
          </Reveal>
          <Reveal delay={200}>
            <FeatureCard icon={<FileSearch className="h-5 w-5" />} title="Manual overrides">
              Disagree with a classification? Change it — your mapping is what the banner and
              script blocking follow.
            </FeatureCard>
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeader
              align="left"
              eyebrow="Scanning methods"
              title="Two ways to scan, one source of truth."
            />
            <ul className="mt-6 space-y-2.5">
              <CheckItem>
                <span className="font-medium text-ink">HTTP scanning</span> — fast, crawl-based
                scans across your pages.
              </CheckItem>
              <CheckItem>
                <span className="font-medium text-ink">Browser-based scanning</span> — renders
                your pages to surface cookies set at runtime.
              </CheckItem>
              <CheckItem>
                <span className="font-medium text-ink">Scheduled scans</span> — monthly on Growth,
                weekly or daily on Business, so drift doesn't go unnoticed.
              </CheckItem>
              <CheckItem>
                <span className="font-medium text-ink">Scan history</span> — revisit past scans to
                see what changed between runs.
              </CheckItem>
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard icon={<CalendarClock className="h-5 w-5" />} title="Scheduled scans">
                Keep your cookie map current without remembering to run a scan.
              </FeatureCard>
              <FeatureCard icon={<History className="h-5 w-5" />} title="Scan history">
                Compare runs over time and spot new cookies as they appear.
              </FeatureCard>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line bg-surface">
        <Reveal>
          <div className="rounded-xl border border-line bg-brand-mist/60 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-medium tracking-normal text-ink md:text-3xl">
              Scan first. Configure once. Stay current.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Start with a manual scan on the Free plan, then let scheduled scans keep your
              cookie categories accurate as your site evolves.
            </p>
            <div className="mt-6 flex justify-center">
              <CTAGroup primary={{ label: "Start for free", to: "/contact" }} />
            </div>
          </div>
        </Reveal>
      </Section>

      <FaqSection eyebrow="Scanner FAQ" title="Questions about the cookie scanner" items={faqs} />
      <FinalCta
        title="See every cookie your site sets."
        description="Start for free, run your first scan, and map every tracker to the right consent category."
        secondaryLabel="Explore consent management"
        secondaryTo="/product/consent"
      />
    </>
  );
}
