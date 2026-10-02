import type { ReactNode } from "react";
import { Container, PageHero, Section } from "./ui";
import { LAST_UPDATED } from "@/lib/site";

export function LegalPage({
  eyebrow,
  title,
  description,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <Section className="pt-12 md:pt-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="mb-8 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            {intro ? <p className="mb-10 text-lg leading-relaxed text-ink">{intro}</p> : null}
            <div className="space-y-10">{children}</div>
          </div>
        </Container>
      </Section>
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-medium tracking-normal text-ink">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}
