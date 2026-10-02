import type { Metadata } from "next";
import {
  BarChart3,
  Blocks,
  BookOpen,
  Code2,
  Cookie,
  FileText,
  Puzzle,
  ScrollText,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { CTAGroup, PageHero, Reveal, Section, SectionHeader } from "@/components/marketing/ui";
import { FinalCta } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Documentation — UpFront",
  description:
    "UpFront documentation: getting started, installation, analytics, consent management, cookie scanner, proof of consent, integrations, and troubleshooting.",
  openGraph: {
    title: "Documentation — UpFront",
    description:
      "UpFront documentation: getting started, installation, analytics, consent management, cookie scanner, proof of consent, integrations, and troubleshooting.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const categories = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Create your workspace, add a website, and get oriented.",
    articles: ["Create a workspace", "Add your first website", "Workspace settings"],
  },
  {
    icon: Code2,
    title: "Installation",
    description: "Install the script on any stack — one line, under 4KB.",
    articles: ["Script installation", "Verify installation", "Single-page apps"],
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Everything UpFront measures, and how to read it.",
    articles: ["Understanding your dashboard", "Filters & date ranges", "Multi-site workspace"],
  },
  {
    icon: ShieldCheck,
    title: "Consent Management",
    description: "Configure banners, categories, and the Preference Centre.",
    articles: ["Banner Studio", "Consent categories", "Script auto-blocking"],
  },
  {
    icon: Cookie,
    title: "Cookie Scanner",
    description: "Discover, classify, and monitor cookies and trackers.",
    articles: ["Run your first scan", "Classification & overrides", "Scheduled scans"],
  },
  {
    icon: ScrollText,
    title: "Proof of Consent",
    description: "Search, filter, and export consent records.",
    articles: ["Reading a consent record", "CSV export", "Retention windows"],
  },
  {
    icon: Puzzle,
    title: "Integrations",
    description: "Connect consent signals to the tools you already use.",
    articles: ["Google Consent Mode v2", "Global Privacy Control", "Tag managers"],
  },
  {
    icon: Wrench,
    title: "Troubleshooting",
    description: "Fix common issues with installation, blocking, and data.",
    articles: ["Script not detected", "Scripts not blocked", "Data discrepancies"],
  },
];

export default function DocsPage() {
  return (
    <>
      <PageHero
        eyebrow="Documentation"
        title="Everything you need to get running."
        description="Guides for installing UpFront, configuring consent, and understanding your data. Start here, then go deeper by product."
      >
        <CTAGroup primary={{ label: "Start for free", to: "/contact" }} />
      </PageHero>

      <Section>
        <Reveal>
          <SectionHeader
            align="left"
            eyebrow="Quickstart"
            title="Install in one line"
          />
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-6 overflow-hidden rounded-xl border border-line bg-ink shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="text-xs font-medium text-slate-400">Your website's &lt;head&gt;</span>
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
          <p className="mt-3 text-sm text-muted-foreground">
            Replace <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">YOUR-SITE-ID</code> with
            the site ID from your workspace. The exact script is generated for you when you add a
            website.
          </p>
        </Reveal>
      </Section>

      <Section className="border-t border-line bg-surface">
        <Reveal>
          <SectionHeader
            align="left"
            eyebrow="Browse by category"
            title="Find the guide you need"
          />
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <Reveal key={cat.title} delay={(i % 4) * 60}>
              <div className="card-lift flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-xs">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-mist text-primary">
                  <cat.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-base font-medium text-ink">{cat.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {cat.description}
                </p>
                <ul className="mt-4 flex-1 space-y-2 border-t border-line pt-4">
                  {cat.articles.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-ink-soft">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="border-t border-line">
        <Reveal>
          <div className="rounded-xl border border-line bg-brand-mist/60 p-8 text-center">
            <Blocks className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-medium text-ink">
              The docs grow with the product.
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              This landing page is organized so new guides slot into these categories as UpFront
              expands. If something is missing, tell us what you need.
            </p>
            <div className="mt-6 flex justify-center">
              <CTAGroup
                primary={{ label: "Contact support", to: "/contact" }}
                secondary={{ label: "View pricing", to: "/pricing" }}
              />
            </div>
          </div>
        </Reveal>
      </Section>

      <FinalCta
        title="Ready to get started?"
        description="Create your workspace and install the script in under two minutes."
        secondaryLabel="Explore the product"
        secondaryTo="/"
      />
    </>
  );
}
