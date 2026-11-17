import type { Metadata } from "next";
import Link from "next/link";
import {
  Ban,
  FileText,
  Gauge,
  Languages,
  Lock,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  CTAGroup,
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
  title: "Consent Management — Cookie consent and script control | UpFront",
  description:
    "A full-featured Consent Management Platform in the same lightweight script: Banner Studio, Preference Centre, script auto-blocking, Google Consent Mode v2, GPC, and proof-of-consent records.",
  openGraph: {
    title: "Consent Management — Cookie consent and script control | UpFront",
    description:
      "A full-featured Consent Management Platform in the same lightweight script: Banner Studio, Preference Centre, script auto-blocking, Google Consent Mode v2, GPC, and proof-of-consent records.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const faqs = [
  {
    q: "How does the consent banner work?",
    a: "You configure categories, layouts, and text in the Banner Studio. When a visitor makes a choice, UpFront records it, stores the preference, and blocks or releases the scripts mapped to each consent category.",
  },
  {
    q: "Can UpFront block third-party scripts?",
    a: "Yes. Script auto-blocking holds third-party scripts until the visitor grants the consent category they are mapped to, and releases them automatically when consent is given.",
  },
  {
    q: "Does UpFront support Google Consent Mode v2?",
    a: "Yes. Google Consent Mode v2 is available on the Growth and Business plans, letting your Google tags respect the consent states collected by UpFront.",
  },
  {
    q: "Does UpFront support Global Privacy Control?",
    a: "Yes. Global Privacy Control (GPC) signals are respected on the Growth and Business plans and can be recorded alongside visitor choices.",
  },
  {
    q: "Can visitors change their consent later?",
    a: "Yes. The Preference Centre lets visitors revisit and change their choices at any time, and every change is recorded as a new consent event.",
  },
];

export default function ConsentPage() {
  return (
    <>
      <PageHero
        eyebrow="Consent Management"
        title="Full consent management, built right in."
        description="A complete CMP in the same under-4KB script as your analytics. Configure it once — banner, script blocking, scanning, and consent records are handled from one dashboard."
      >
        <CTAGroup
          primary={{ label: "Star on GitHub", to: "https://github.com/Abishekram03/usrly" }}
          secondary={{ label: "Open Banner Studio", to: "/consent/studio" }}
        />
        <div className="mx-auto mt-12 max-w-4xl text-left">
          <BrowserMockupFrame
            src="/dashboard-illustration/banner-studio.png"
            alt="UpFront Consent Banner Studio"
            width={1918}
            height={868}
            url="upfront.local/consent/studio"
            priority
          />
        </div>
      </PageHero>

      <Section className="border-t border-line bg-surface">
        <Reveal>
          <SectionHeader
            eyebrow="Banner Studio"
            title="Design a banner your visitors actually understand."
            description="Choose layouts, colors, and copy that fit your brand. Configure box, bar, or popup banners, granular categories, and custom CSS without restrictions."
          />
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <FeatureCard icon={<SlidersHorizontal className="h-5 w-5" />} title="Preference Centre">
              A visitor-facing panel where people can revisit and change their choices for each
              consent category at any time.
            </FeatureCard>
          </Reveal>
          <Reveal delay={100}>
            <FeatureCard icon={<Ban className="h-5 w-5" />} title="Script auto-blocking">
              Third-party scripts wait until the visitor grants the category they're mapped to —
              then run automatically.
            </FeatureCard>
          </Reveal>
          <Reveal delay={200}>
            <FeatureCard icon={<FileText className="h-5 w-5" />} title="Cookie Policy generator">
              Keep your cookie policy in step with what your site actually sets, generated from
              your scan data.
            </FeatureCard>
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line">
        <Reveal>
          <SectionHeader
            eyebrow="Standards & signals"
            title="Speaks the standards regulators expect."
            description="Built to support GDPR, CCPA, ePrivacy, and global privacy frameworks — with the signals modern ad and analytics stacks need."
          />
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Gauge, title: "Google Consent Mode v2", desc: "Growth+, feed consent states to your Google tags." },
            { icon: ShieldCheck, title: "Global Privacy Control", desc: "Growth+, honor browser-level opt-out signals." },
            { icon: FileText, title: "IAB TCF v2.3", desc: "Business, standards-based consent signaling." },
            { icon: Lock, title: "Consent versioning", desc: "Track configuration changes with records retained per plan." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <FeatureCard icon={<f.icon className="h-5 w-5" />} title={f.title}>
                {f.desc}
              </FeatureCard>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="border-t border-line bg-surface">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeader
              align="left"
              eyebrow="Reach"
              title="The right experience for every visitor."
              description="Consent rules differ by region. UpFront adapts the consent experience to where your visitors are and the languages they speak."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <FeatureCard icon={<MapPin className="h-5 w-5" />} title="Geo-targeting">
                Show or adjust consent experiences based on visitor region.
              </FeatureCard>
              <FeatureCard icon={<Languages className="h-5 w-5" />} title="Multi-language">
                Serve the banner and Preference Centre in your visitors' languages.
              </FeatureCard>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-xl border border-line bg-surface p-6 shadow-lg shadow-slate-900/[0.06]">
              <p className="text-sm font-medium text-ink">Every choice becomes a record</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Each consent decision is stored as a proof-of-consent record — timestamp, country,
                status, categories, and configuration version — available for search, filtering,
                and CSV export.
              </p>
              <div className="mt-4 rounded-lg border border-line bg-muted/40 p-4">
                <ul className="space-y-2 text-xs">
                  {[
                    ["Timestamp", "Sep 26, 10:02 UTC"],
                    ["Country", "DE"],
                    ["Status", "Granted"],
                    ["Categories", "Necessary, Analytics"],
                    ["Version", "cfg v3"],
                  ].map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-ink">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-right text-[10px] text-muted-foreground">
                Illustrative sample data
              </p>
            </div>
          </Reveal>
        </div>
        <Reveal delay={100}>
          <div className="mt-12 rounded-xl border border-line bg-brand-mist/60 p-6 text-center sm:p-8">
            <p className="text-sm leading-relaxed text-ink-soft">
              Need an auditable trail of every consent decision?{" "}
              <span className="font-medium text-ink">
                That's what the Proof of Consent vault is for.
              </span>
            </p>
            <div className="mt-4 flex justify-center">
              <Link
                href="/product/proof"
                className="inline-flex items-center justify-center rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-muted/60"
              >
                Explore Proof of Consent
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>

      <FaqSection eyebrow="Consent FAQ" title="Questions about consent management" items={faqs} />
      <FinalCta
        title="Make consent simple for your visitors."
        description="Start for free and put a polished, configurable consent experience on your site today."
        secondaryLabel="Explore the cookie scanner"
        secondaryTo="/product/scanner"
      />
    </>
  );
}
