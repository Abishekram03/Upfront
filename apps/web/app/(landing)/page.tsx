import { Metadata } from "next";
import {
  BarChart3,
  Ban,
  Blocks,
  CalendarClock,
  Check,
  ChevronRight,
  Coins,
  FileText,
  Gauge,
  Globe2,
  Languages,
  Layers,
  Lock,
  MapPin,
  Monitor,
  MousePointerClick,
  Puzzle,
  ScrollText,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  Unplug,
} from "lucide-react";
import {
  Container,
  CTAGroup,
  CheckItem,
  FeatureCard,
  PrimaryCta,
  Reveal,
  SecondaryCta,
  Section,
  SectionHeader,
} from "@/components/marketing/ui";
import {
  InteractiveDashboardPreview,
  BrowserMockupFrame,
} from "@/components/marketing/dashboard-preview";
import { FaqSection } from "@/components/marketing/faq";
import { PricingSection } from "@/components/marketing/pricing";
import { ComparisonSection } from "@/components/marketing/comparison";
import { FinalCta } from "@/components/marketing/cta";
import { homeFaqs } from "@/lib/site";

export const metadata: Metadata = {
  title: "UpFront — Privacy Analytics & Consent Management",
  description:
    "Know your traffic. Respect their privacy. Cookieless analytics and a complete Consent Management Platform in one script under 4KB.",
  openGraph: {
    title: "UpFront — Privacy Analytics & Consent Management",
    description:
      "Know your traffic. Respect their privacy. Cookieless analytics and a complete Consent Management Platform in one script under 4KB.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* <ProblemSection /> — Hidden from landing view */}
      <AnalyticsSection />
      <ConsentSection />
      <ScannerProofSection />
      <SetupSection />
      <WhyUpFrontSection />
      {/* <ComparisonSection /> — Hidden from landing view */}
      <FaqSection items={homeFaqs} />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-mist via-surface to-brand-mist pt-10 pb-16 md:pt-14 md:pb-20">
      <Container className="relative mx-auto max-w-6xl text-center">
        <Reveal>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            Open Source Tool · Apache 2.0
          </div>
          <h1 className="text-4xl font-medium leading-[1.15] tracking-tight text-ink sm:text-5xl md:text-6xl text-balance">
            The Open Source Tool for{" "}
            <span className="text-primary">Privacy Analytics & Consent</span>.
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-normal leading-relaxed text-ink-soft text-balance">
            Cookieless web analytics and a complete Consent Management Platform — unified in a single
            script under 4KB. 100% free, self-hostable, and open source under Apache 2.0.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <CTAGroup
            align="center"
            className="mt-8 justify-center"
            primary={{ label: "Star on GitHub", to: "https://github.com/Abishekram03/usrly" }}
            secondary={{ label: "Explore features", to: "/product/analytics" }}
          />
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-normal text-ink-soft">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>100% Free & Open Source (Apache 2.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Unlimited websites</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Under 4KB footprint</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["Cookieless analytics", "Consent banner", "Cookie scanner", "Proof of consent"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface/80 px-3 py-1.5 text-xs font-normal text-ink-soft shadow-2xs backdrop-blur-xs"
              >
                <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                {t}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={360}>
          <div className="mt-12 md:mt-16">
            <InteractiveDashboardPreview />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function ProblemSection() {
  return (
    <Section className="bg-surface">
      <Reveal>
        <SectionHeader
          eyebrow="The problem"
          title="Your website shouldn't need a stack of tools to understand its traffic and respect visitor privacy."
          description="Most teams bolt a consent platform onto an analytics tool — and inherit the complexity of both."
        />
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Reveal delay={0}>
          <FeatureCard icon={<Layers className="h-5 w-5" />} title="Tool fragmentation">
            Analytics in one dashboard. Consent in another. Multiple scripts to install, update,
            and keep in sync.
          </FeatureCard>
        </Reveal>
        <Reveal delay={100}>
          <FeatureCard icon={<Blocks className="h-5 w-5" />} title="Bloated websites">
            Every extra third-party script adds page weight and complexity for your visitors to
            download before they see anything useful.
          </FeatureCard>
        </Reveal>
        <Reveal delay={200}>
          <FeatureCard icon={<Coins className="h-5 w-5" />} title="Per-domain pricing">
            Managing several websites gets expensive fast when tools charge separately for every
            domain you add.
          </FeatureCard>
        </Reveal>
      </div>
      <Reveal delay={150}>
        <div className="mt-10 rounded-xl border border-primary/25 bg-brand-mist/70 p-6 text-center sm:p-8">
          <p className="text-lg font-medium text-ink">
            UpFront replaces the patchwork:{" "}
            <span className="font-medium text-primary">
              one script, one dashboard, one subscription.
            </span>
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

const analyticsChips = [
  { icon: Timer, label: "Real-time traffic" },
  { icon: BarChart3, label: "Pageviews" },
  { icon: MousePointerClick, label: "Unique visitors" },
  { icon: Globe2, label: "Referrers & UTM" },
  { icon: MapPin, label: "Geography" },
  { icon: Monitor, label: "Devices" },
  { icon: Puzzle, label: "Browsers" },
  { icon: Server, label: "Operating systems" },
  { icon: CalendarClock, label: "Flexible date ranges" },
  { icon: Layers, label: "Multi-site workspace" },
];

function AnalyticsSection() {
  return (
    <Section className="border-t border-line">
      <Reveal>
        <SectionHeader
          eyebrow="Analytics"
          title="Understand your traffic — without tracking your visitors."
          description="Privacy-first website analytics with no cookies and zero raw IP storage. Real-time pageviews, referrers, geography, and devices — the metrics that matter, nothing more."
        />
      </Reveal>

      <Reveal delay={100}>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {analyticsChips.map((chip) => (
            <div
              key={chip.label}
              className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-3 text-sm text-ink-soft shadow-2xs"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-mist text-primary">
                <chip.icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="font-medium text-ink">{chip.label}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={140}>
        <div className="mx-auto mt-10 max-w-4xl">
          <BrowserMockupFrame
            src="/dashboard-illustration/overview.png"
            alt="UpFront Analytics Dashboard Overview"
            width={1504}
            height={873}
            url="upfront.local/analytics"
          />
        </div>
      </Reveal>

      <Reveal delay={180}>
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <p className="rounded-xl border border-line bg-brand-mist/60 px-6 py-4 text-sm text-ink-soft">
            <span className="font-semibold text-ink">Unlimited websites</span> — privacy-first analytics with zero cookies and no raw IP storage. 100% free and open source.
          </p>
          <div className="mt-6">
            <PrimaryCta label="Explore analytics" to="/product/analytics" />
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

const consentFeatures = [
  { icon: SlidersHorizontal, title: "Banner Studio", desc: "Design and configure your banner without code." },
  { icon: Settings2, title: "Preference Centre", desc: "Let visitors fine-tune their choices anytime." },
  { icon: Layers, title: "Granular categories", desc: "Necessary, analytics, marketing, and custom." },
  { icon: Ban, title: "Script auto-blocking", desc: "Third-party scripts wait for consent." },
  { icon: Gauge, title: "Google Consent Mode v2", desc: "Feed consent states to your Google tags." },
  { icon: ShieldCheck, title: "Global Privacy Control", desc: "Honor browser-level opt-out signals." },
  { icon: FileText, title: "IAB TCF v2.3", desc: "Standards-based signaling out of the box." },
  { icon: Languages, title: "Multi-language", desc: "Serve banners in your visitors' languages." },
  { icon: MapPin, title: "Geo-targeting", desc: "Adapt behavior by visitor region." },
  { icon: CalendarClock, title: "Consent versioning", desc: "Track configuration changes over time." },
  { icon: ScrollText, title: "Cookie Policy generator", desc: "Keep your policy in step with your site." },
  { icon: Lock, title: "Proof-of-consent records", desc: "Retain receipts for every choice." },
];

function ConsentSection() {
  return (
    <Section className="border-t border-line bg-surface">
      <Reveal>
        <SectionHeader
          eyebrow="Consent Management"
          title="Full consent management, built right in."
          description="A complete CMP in the same script — banner configuration, script blocking, cookie scanning, and proof-of-consent records, all handled from one dashboard."
        />
      </Reveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {consentFeatures.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 80}>
            <div className="card-lift flex items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-mist text-primary">
                <f.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{f.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={120}>
        <div className="mx-auto mt-10 max-w-4xl">
          <BrowserMockupFrame
            src="/dashboard-illustration/banner-studio.png"
            alt="UpFront Banner Studio"
            width={1918}
            height={868}
            url="upfront.local/consent/studio"
          />
        </div>
      </Reveal>

      <div className="mt-10 text-center">
        <PrimaryCta label="Explore consent management" to="/product/consent" />
      </div>
    </Section>
  );
}

function ScannerProofSection() {
  return (
    <Section className="border-t border-line">
      <div className="grid gap-10 md:grid-cols-2">
        <Reveal>
          <div className="flex h-full flex-col justify-between rounded-2xl border border-line bg-surface p-8 shadow-xs">
            <div>
              <SectionHeader
                align="left"
                eyebrow="Cookie Scanner"
                title="Know what's actually running on your website."
                description="UpFront scans your website and identifies the cookies and trackers it finds — then helps you map every one to the right consent category."
              />
              <ul className="mt-6 space-y-3">
                <CheckItem>HTTP scanning and browser-based scanning</CheckItem>
                <CheckItem>Automatic cookie classification</CheckItem>
                <CheckItem>Manual category overrides where you decide</CheckItem>
                <CheckItem>Scheduled scans and scan history</CheckItem>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-line">
              <SecondaryCta label="Explore the scanner" to="/product/scanner" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="flex h-full flex-col justify-between rounded-2xl border border-line bg-surface p-8 shadow-xs">
            <div>
              <SectionHeader
                align="left"
                eyebrow="Proof of Consent & Policy"
                title="Keep a clear record of consent."
                description="Every consent decision is stored as a proof-of-consent record — with automated cookie policy generation synced directly to your live scan."
              />
              <ul className="mt-6 space-y-3">
                <CheckItem>Timestamp, country, and consent status per record</CheckItem>
                <CheckItem>Categories granted and configuration version</CheckItem>
                <CheckItem>Search, filtering, and CSV export</CheckItem>
                <CheckItem>Full historical records retained and searchable</CheckItem>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-line">
              <SecondaryCta label="Explore the audit vault" to="/product/proof" />
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={160}>
        <div className="mx-auto mt-12 max-w-4xl">
          <BrowserMockupFrame
            src="/dashboard-illustration/policies.png"
            alt="UpFront Cookie Policy & Legal Compliance"
            width={1693}
            height={877}
            url="upfront.local/consent/policy"
          />
        </div>
      </Reveal>
    </Section>
  );
}

const steps = [
  {
    title: "Create your UpFront workspace",
    desc: "Add your website and configure your privacy and consent defaults.",
  },
  {
    title: "Copy one lightweight script",
    desc: "A single <script> tag, under 4KB, served from your instance or CDN.",
  },
  {
    title: "Paste it into your website",
    desc: "Add it to your site's <head> and start measuring and managing consent immediately.",
  },
];

function SetupSection() {
  return (
    <Section className="border-t border-line bg-surface">
      <Reveal>
        <SectionHeader
          eyebrow="Setup"
          title="Live in three steps"
          description="No build tools, no plugins, no configuration files. One line in your HTML."
        />
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <Reveal key={step.title} delay={i * 100}>
            <div className="relative rounded-xl border border-line bg-surface p-6 shadow-xs">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-medium text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function WhyUpFrontSection() {
  return (
    <Section className="border-t border-line">
      <Reveal>
        <SectionHeader
          eyebrow="Why UpFront"
          title="Two essential website tools. One lightweight script."
          description="Analytics and consent management — the two things every modern website needs — consolidated into one platform with a unified dashboard."
        />
      </Reveal>
      <Reveal delay={120}>
        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-6">
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-lg border border-line bg-surface px-4 py-4 text-center shadow-xs">
              <p className="text-sm font-medium text-ink">Analytics</p>
              <p className="mt-1 text-xs text-muted-foreground">Cookieless, real-time, privacy-first</p>
            </div>
            <div className="rounded-lg border border-line bg-surface px-4 py-4 text-center shadow-xs">
              <p className="text-sm font-medium text-ink">Consent Management</p>
              <p className="mt-1 text-xs text-muted-foreground">Banner, scanner, and proof of consent</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-primary" aria-hidden="true">
            <ChevronRight className="h-5 w-5 rotate-90" />
          </div>
          <div className="w-full rounded-xl border border-primary/30 bg-brand-mist p-6 text-center">
            <p className="text-lg font-medium text-ink">One UpFront platform</p>
            <ul className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-soft">
              <li>One script</li>
              <li>Under 4KB</li>
              <li>Unlimited websites</li>
              <li>Unified dashboard</li>
              <li>Privacy-first architecture</li>
            </ul>
          </div>
        </div>
      </Reveal>
      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-xs">
          <Unplug className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-ink">Cookieless by default</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            No cookies used for measurement, and zero raw IP storage.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-xs">
          <Gauge className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-ink">Under 4KB</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            A script your visitors barely download — designed to stay out of the way.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-xs">
          <Layers className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-ink">Unlimited websites</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Unlimited websites and pageviews. 100% free forever under Apache 2.0.
          </p>
        </div>
      </div>
    </Section>
  );
}

