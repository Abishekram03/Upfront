"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { BookOpen, Coins, LifeBuoy } from "lucide-react";
import {
  CTAGroup,
  FeatureCard,
  PageHero,
  Reveal,
  Section,
  SectionHeader,
} from "@/components/marketing/ui";
import { FinalCta } from "@/components/marketing/cta";

const topics = ["General question", "Product support", "Pricing & billing", "Privacy request"];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the team behind UpFront."
        description="Questions about the product, your workspace, or this site? Send a message — we read every one."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-line bg-surface p-10 text-center shadow-xs">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-success" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h2 className="mt-4 text-xl font-medium text-ink">Message received</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Thanks for reaching out. We'll get back to you as soon as we can — usually within
                  one business day.
                </p>
                <div className="mt-6">
                  <CTAGroup primary={{ label: "Back to home", to: "/" }} />
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-line bg-surface p-6 shadow-xs sm:p-8"
              >
                <h2 className="text-lg font-medium text-ink">Send us a message</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fill in the form and we'll reply by email.
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Your name"
                      className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-sm text-ink shadow-xs outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-sm text-ink shadow-xs outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-ink">
                      Topic
                    </label>
                    <select
                      id="topic"
                      name="topic"
                      className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-sm text-ink shadow-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {topics.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      placeholder="How can we help?"
                      className="w-full resize-y rounded-lg border border-input bg-surface px-3 py-2.5 text-sm text-ink shadow-xs outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-7 py-3.5 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Send message
                </button>
              </form>
            )}
          </Reveal>

          <Reveal delay={120} className="lg:col-span-2">
            <div className="space-y-4">
              <FeatureCard icon={<LifeBuoy className="h-5 w-5" />} title="Product support">
                Questions about installing the script, configuring consent, or reading your data?
                Start here and we'll help you sort it out.
              </FeatureCard>
              <FeatureCard icon={<Coins className="h-5 w-5" />} title="Pricing & billing">
                Ask about plans, pageview limits, upgrades, and downgrades.
              </FeatureCard>
              <FeatureCard icon={<BookOpen className="h-5 w-5" />} title="Documentation first">
                Many answers are already in the docs — installation, analytics, consent, scanning,
                and more.
              </FeatureCard>
              <div className="rounded-xl border border-line bg-brand-mist/60 p-5">
                <p className="text-sm leading-relaxed text-ink-soft">
                  Prefer to explore first? You can{" "}
                  <Link href="/pricing" className="font-medium text-primary underline-offset-2 hover:underline">
                    compare plans
                  </Link>{" "}
                  or{" "}
                  <Link href="/docs" className="font-medium text-primary underline-offset-2 hover:underline">
                    read the docs
                  </Link>{" "}
                  before writing to us.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionHeader
              eyebrow="Note"
              title="Privacy requests"
              description="If you're a visitor of a website that uses UpFront and have a question about your data, contact that website first — it controls its own consent configuration. Website owners can request or delete data through their UpFront workspace."
            />
          </div>
        </Reveal>
      </Section>

      <FinalCta
        title="Or just try it yourself."
        description="Start for free and see the whole platform in under two minutes."
        secondaryLabel="Read the documentation"
        secondaryTo="/docs"
      />
    </>
  );
}
