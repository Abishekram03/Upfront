import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { plans, type Plan } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Section, SectionHeader } from "./ui";

function PricingCard({ plan, className }: { plan: Plan; className?: string }) {
  return (
    <div
      className={cn(
        "card-lift relative flex flex-col rounded-xl border bg-surface p-6",
        plan.featured
          ? "border-primary/60 shadow-lg shadow-primary/10 ring-1 ring-primary/25"
          : "border-line shadow-xs",
        className,
      )}
    >
      {plan.featured ? (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Recommended
        </span>
      ) : null}
      <h3 className="text-base font-medium text-ink">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-medium tracking-normal text-ink">${plan.price}</span>
        <span className="text-sm text-muted-foreground">{plan.unit}</span>
      </p>
      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-ink-soft">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/contact"
        className={cn(
          "mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          plan.featured
            ? "bg-primary text-primary-foreground shadow-sm hover:bg-brand-dark"
            : "border border-line bg-surface text-ink hover:bg-muted/60",
        )}
      >
        {plan.cta}
      </Link>
      {plan.id === "free" ? (
        <p className="mt-2.5 text-center text-xs text-muted-foreground">No credit card required</p>
      ) : null}
    </div>
  );
}

export function PricingSection({ id = "pricing" }: { id?: string }) {
  return (
    <Section id={id} className="border-t border-line">
      <SectionHeader
        eyebrow="Pricing"
        title="Simple pricing, priced by traffic — not by website"
        description="Every plan includes unlimited websites. You only pay for the monthly pageviews you use."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Prices shown are current launch pricing. Annual billing and add-ons may be introduced
        later — limits on each plan remain configurable.
      </p>
    </Section>
  );
}
