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
import { DashboardPreview } from "@/components/product-ui/dashboard";
import { ConsentPreview } from "@/components/product-ui/consent";
import { ScannerPreview } from "@/components/product-ui/scanner";
import { ProofPreview } from "@/components/product-ui/proof";
import { FaqSection } from "@/components/marketing/faq";
import { PricingSection } from "@/components/marketing/pricing";
import { ComparisonSection } from "@/components/marketing/comparison";
import { FinalCta } from "@/components/marketing/cta";
import { homeFaqs } from "@/lib/site";

export const metadata: Metadata = {
  title: "UpFront — Privacy Analytics & Consent Management",
  description:
    "Privacy-first website analytics and consent management in one lightweight script. Understand your traffic, manage consent, scan cookies, and keep proof of consent in one place.",
  openGraph: {
    title: "UpFront — Privacy Analytics & Consent Management",
    description:
      "Privacy-first website analytics and consent management in one lightweight script. Understand your traffic, manage consent, scan cookies, and keep proof of consent in one place.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <AnalyticsSection />
      <ConsentSection />
      <ScannerProofSection />
      <SetupSection />
      <WhyUpFrontSection />
      <ComparisonSection />
      <PricingSection />
      <FaqSection items={homeFaqs} />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-mist via-surface to-brand-mist">
      <Container className="relative grid items-center gap-12 pb-16 pt-16 md:pb-24 md:pt-24 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <Reveal>
            <h1 className="text-4xl font-medium leading-[1.2] text-ink sm:text-5xl md:text-[3.5rem]">
              <span className="text-primary">Privacy analytics and consent</span> in one lightweight script
            </h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 max-w-xl text-lg font-normal leading-relaxed text-ink-soft">
              UpFront combines cookieless analytics and a full-featured Consent Management Platform
              in one script under 4KB, so you can understand your traffic and respect visitor choices.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <CTAGroup align="left" className="mt-8" primary={{ label: "Get started for free", to: "/contact" }} />
          </Reveal>
          <Reveal delay={240}>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-base font-normal text-ink-soft">
              {["No credit card required", "Unlimited websites"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Cookieless analytics", "Consent banner", "Cookie scanner", "Proof of consent"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-md bg-brand-mist px-3 py-1.5 text-sm font-normal text-primary">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal delay={200} className="relative">
          <ConsentPreview />
        </Reveal>
      </Container>
      <Container className="relative pb-20">
        <Reveal>
          <DashboardPreview />
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
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div>
            <SectionHeader
              align="left"
              eyebrow="Analytics"
              title="Understand your traffic without tracking your visitors."
              description="UpFront provides privacy-oriented website analytics without cookies by default and without storing raw IP addresses. You get the numbers that matter — nothing more, nothing leaked."
            />
            <ul className="mt-8 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
              {analyticsChips.map((chip) => (
                <li key={chip.label} className="flex items-center gap-2 text-sm text-ink-soft">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-mist text-primary">
                    <chip.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {chip.label}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-lg border border-line bg-brand-mist/60 px-4 py-3 text-sm text-ink-soft">
              <span className="font-semibold text-ink">Unlimited websites</span> on every plan —
              pricing is based on monthly pageviews, not the number of sites you add.
            </p>
            <div className="mt-6">
              <PrimaryCta label="Explore analytics" to="/product/analytics" />
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <LiveTrafficCard />
        </Reveal>
      </div>
    </Section>
  );
}

function LiveTrafficCard() {
  const points = [8, 14, 11, 19, 16, 24, 21, 28, 25, 33, 30, 38];
  const w = 320;
  const h = 90;
  const line = points
    .map((v, i) => `${(i * w) / (points.length - 1)},${h - (v / 42) * h}`)
    .join(" ");
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-lg shadow-slate-900/[0.06]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Right now</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <span className="live-dot" aria-hidden="true" />
          34 live
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Active visitors on your site in the last 5 minutes
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full" role="img" aria-label="Sample live visitor sparkline">
        <defs>
          <linearGradient id="live-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${h} ${line} ${w},${h}`} fill="url(#live-area)" />
        <polyline
          points={line}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Top source</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">google.com</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Top page</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-ink">/pricing</p>
        </div>
      </div>
      <p className="mt-3 text-right text-[10px] text-muted-foreground">Illustrative sample data</p>
    </div>
  );
}

const consentFeatures = [
  { icon: SlidersHorizontal, title: "Banner Studio", desc: "Design and configure your banner without code." },
  { icon: Settings2, title: "Preference Centre", desc: "Let visitors fine-tune their choices anytime." },
  { icon: Layers, title: "Granular categories", desc: "Necessary, analytics, marketing, and custom." },
  { icon: Ban, title: "Script auto-blocking", desc: "Third-party scripts wait for consent." },
  { icon: Gauge, title: "Google Consent Mode v2", desc: "Feed consent states to your Google tags." },
  { icon: ShieldCheck, title: "Global Privacy Control", desc: "Honor browser-level opt-out signals." },
  { icon: FileText, title: "IAB TCF v2.3", desc: "Standards-based signaling on Business." },
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
          title="Consent management without the complexity."
          description="A complete Consent Management Platform built into the same script — configure it once and let it handle categories, blocking, and records."
        />
      </Reveal>
      <Reveal delay={120} className="mx-auto mt-12 max-w-2xl">
        <ConsentPreview />
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
      <div className="mt-10 text-center">
        <PrimaryCta label="Explore consent management" to="/product/consent" />
      </div>
    </Section>
  );
}

function ScannerProofSection() {
  return (
    <Section className="border-t border-line">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <ScannerPreview />
        </Reveal>
        <Reveal delay={120}>
          <div>
            <SectionHeader
              align="left"
              eyebrow="Cookie Scanner"
              title="Know what's actually running on your website."
              description="UpFront scans your website and identifies the cookies and trackers it finds — then helps you map every one to the right consent category."
            />
            <ul className="mt-6 space-y-2.5">
              <CheckItem>HTTP scanning and browser-based scanning</CheckItem>
              <CheckItem>Automatic cookie classification</CheckItem>
              <CheckItem>Manual category overrides where you decide</CheckItem>
              <CheckItem>Scheduled scans and scan history</CheckItem>
            </ul>
            <div className="mt-6">
              <SecondaryCta label="Explore the scanner" to="/product/scanner" />
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-20 grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="order-2 lg:order-1">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Proof of Consent"
              title="Keep a clear record of consent."
              description="Every consent decision is stored as a proof-of-consent record — a receipt you can search, filter, and export when you need evidence."
            />
            <ul className="mt-6 space-y-2.5">
              <CheckItem>Timestamp, country, and consent status per record</CheckItem>
              <CheckItem>Categories granted and configuration version</CheckItem>
              <CheckItem>Search, filtering, and CSV export</CheckItem>
              <CheckItem>Historical records retained per your plan</CheckItem>
            </ul>
            <div className="mt-6">
              <SecondaryCta label="Explore the audit vault" to="/product/proof" />
            </div>
          </div>
        </Reveal>
        <Reveal delay={120} className="order-1 lg:order-2">
          <ProofPreview />
        </Reveal>
      </div>
    </Section>
  );
}

const steps = [
  {
    title: "Create your UpFront workspace",
    desc: "Sign up, add your website, and choose your consent defaults.",
  },
  {
    title: "Copy one lightweight script",
    desc: "A single <script> tag, under 4KB, served from our edge.",
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
      <Reveal delay={150}>
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="overflow-hidden rounded-xl border border-line bg-ink shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="text-xs font-medium text-slate-400">index.html</span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white">
                &lt; 4KB
              </span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-200">
              <code>{`<script
  defer
  src="https://cdn.upfront.app/upfront.js"
  data-site="YOUR-SITE-ID"
></script>`}</code>
            </pre>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Example snippet — the exact script is generated in your workspace.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

function WhyUpFrontSection() {
  const modules = ["Analytics", "Consent Management", "Cookie Scanner", "Proof of Consent"];
  return (
    <Section className="border-t border-line">
      <Reveal>
        <SectionHeader
          eyebrow="Why UpFront"
          title="Two essential website tools. One lightweight script."
          description="What used to be four products and four scripts becomes one platform with one unified dashboard."
        />
      </Reveal>
      <Reveal delay={120}>
        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-6">
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            {modules.map((m) => (
              <div
                key={m}
                className="rounded-lg border border-line bg-surface px-3 py-3 text-center text-sm font-medium text-ink-soft shadow-xs"
              >
                {m}
              </div>
            ))}
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
            Every plan includes unlimited websites. Pricing follows pageviews.
          </p>
        </div>
      </div>
    </Section>
  );
}
