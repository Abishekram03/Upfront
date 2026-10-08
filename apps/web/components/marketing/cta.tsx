import { Section, PrimaryCta, SecondaryCta } from "./ui";

export function FinalCta({
  title = "Start understanding your traffic — the privacy-first way.",
  description = "Create your workspace for free. Analytics and consent management live on your site in under two minutes.",
  primaryLabel = "Start for free",
  primaryTo = "/contact",
  secondaryLabel = "Read the documentation",
  secondaryTo = "/docs",
}: {
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}) {
  return (
    <Section className="border-t border-line">
      <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-16 text-center sm:px-12 md:py-20">
        <div
          className="absolute inset-0 opacity-[0.14]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 70% 80% at 50% 100%, black 40%, transparent 100%)",
          }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-medium tracking-normal text-balance text-white md:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300">
            {description}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryCta label={primaryLabel} to={primaryTo} className="shadow-none" />
            <SecondaryCta
              label={secondaryLabel}
              to={secondaryTo}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            />
          </div>
          <p className="mt-6 text-xs text-slate-400">
            No credit card required · Unlimited websites · Setup in under 2 minutes
          </p>
        </div>
      </div>
    </Section>
  );
}
