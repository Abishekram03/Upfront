"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", className)}>{children}</div>
  );
}

export function Section({
  children,
  id,
  className,
  containerClassName,
}: {
  children: ReactNode;
  id?: string;
  className?: string | undefined;
  containerClassName?: string;
}) {
  return (
    <section id={id} className={cn("py-20 md:py-32", className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string | undefined;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", visible && "reveal-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className="flex items-center gap-2 text-sm font-medium text-primary"
          style={align === "center" ? { justifyContent: "center" } : undefined}
        >
          <span className="h-px w-5 bg-primary/60" aria-hidden="true" />
          {eyebrow}
          {align === "center" ? <span className="h-px w-5 bg-primary/60" aria-hidden="true" /> : null}
        </p>
      ) : null}
      <h2 className="text-4xl font-medium tracking-normal text-balance text-ink md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{description}</p>
      ) : null}
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "card-lift rounded-2xl border border-line bg-surface p-8 shadow-sm",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mist text-primary">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-medium text-ink">{title}</h3>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export function CTAGroup({
  primary,
  secondary,
  align = "center",
  className,
}: {
  primary: { label: string; to?: string; href?: string };
  secondary?: { label: string; to?: string; href?: string };
  align?: "center" | "left";
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row",
        align === "center" ? "justify-center" : "justify-start",
        className,
      )}
    >
      <PrimaryCta {...primary} />
      {secondary ? <SecondaryCta {...secondary} /> : null}
    </div>
  );
}

export function PrimaryCta({
  label,
  to,
  href,
  className,
}: {
  label: string;
  to?: string;
  href?: string;
  className?: string | undefined;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-7 py-4 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    className,
  );
  const target = to || href || "/signup";
  return (
    <Link href={target} className={cls}>
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

export function SecondaryCta({
  label,
  to,
  href,
  className,
}: {
  label: string;
  to?: string;
  href?: string;
  className?: string | undefined;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-1.5 rounded-md border border-line bg-surface px-8 py-4 text-base font-medium text-ink transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    className,
  );
  const target = to || href || "/pricing";
  return (
    <Link href={target} className={cls}>
      {label}
    </Link>
  );
}

export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-ink-soft">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export function CrossItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
      <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
      <Container className="relative py-16 text-center md:py-24">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-5xl font-medium tracking-normal text-balance text-ink md:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
        {children ? <div className="mt-8">{children}</div> : null}
      </Container>
    </section>
  );
}
