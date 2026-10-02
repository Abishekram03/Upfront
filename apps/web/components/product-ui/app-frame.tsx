import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Browser-style window chrome shared by all product previews. */
export function AppFrame({
  url = "app.upfront.io",
  children,
  className,
  bodyClassName,
}: {
  url?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
  bodyClassName?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-surface shadow-xl shadow-slate-900/[0.08]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-line bg-muted/50 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </span>
        <span className="mx-auto flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-0.5 text-[11px] text-muted-foreground">
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-success" aria-hidden="true">
            <path
              d="M12 1a5 5 0 015 5v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1V6a5 5 0 015-5zm0 2a3 3 0 00-3 3v3h6V6a3 3 0 00-3-3z"
              fill="currentColor"
            />
          </svg>
          {url}
        </span>
      </div>
      <div className={cn("bg-surface", bodyClassName)}>{children}</div>
    </div>
  );
}

export const sidebarNav = [
  { label: "Overview", icon: "M4 13h6V4H4v9zm10 7h6v-9h-6v9zM4 20h6v-3H4v3zm10-7h6V4h-6v9z" },
  {
    label: "Analytics",
    icon: "M3 20h18M6 16v-5m6 5V8m6 8v-8",
  },
  {
    label: "Consent",
    icon: "M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "Scanner",
    icon: "M21 21l-4.35-4.35M11 6a5 5 0 100 10 5 5 0 000-10z",
  },
  {
    label: "Proof",
    icon: "M9 12h6m-6 4h6M9 8h6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z",
  },
  {
    label: "Settings",
    icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a7.4 7.4 0 01-2 1.2l-.4 2.6h-4l-.4-2.6a7.4 7.4 0 01-2-1.2l-2.4 1-2-3.4 2-1.6a7.4 7.4 0 010-2.4l-2-1.6 2-3.4 2.4 1a7.4 7.4 0 012-1.2L9.6 2h4l.4 2.6a7.4 7.4 0 012 1.2l2.4-1 2 3.4-2 1.6c.1.4.1.8.1 1.2z",
  },
] as const;

/** App shell with sidebar + site selector, used inside AppFrame. */
export function AppShell({
  active = "Overview",
  title,
  actions,
  children,
}: {
  active?: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[26rem] text-left">
      <aside className="hidden w-44 shrink-0 flex-col border-r border-line bg-muted/30 p-3 sm:flex">
        <div className="flex items-center gap-2 px-1.5 py-1">
          <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
            <rect x="2" y="2" width="60" height="60" rx="14" fill="#1868db" />
            <path
              d="M18 38 L32 22 L46 38"
              fill="none"
              stroke="#ffffff"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 46 L44 46"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.55"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-xs font-medium text-ink">UpFront</span>
        </div>
        <button
          type="button"
          className="mt-3 flex items-center justify-between rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink"
        >
          <span className="truncate">acme-store.com</span>
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-muted-foreground" aria-hidden="true">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <nav aria-hidden="true" className="mt-3 space-y-0.5">
          {sidebarNav.map((item) => (
            <span
              key={item.label}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium",
                item.label === active ? "bg-brand-mist text-primary" : "text-muted-foreground",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d={item.icon} />
              </svg>
              {item.label}
            </span>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-ink">{title}</h4>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function RangePill({ label = "Last 7 days" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-ink-soft">
      {label}
      <svg viewBox="0 0 24 24" className="h-3 w-3 text-muted-foreground" aria-hidden="true">
        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function LiveBadge({ count = 34 }: { count?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-1 text-[11px] font-medium text-ink">
      <span className="live-dot" aria-hidden="true" />
      {count} live now
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  positive = true,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-medium tabular-nums tracking-normal text-ink">{value}</p>
      {delta ? (
        <p
          className={cn(
            "mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium",
            positive ? "text-success" : "text-warning",
          )}
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
            <path
              d={positive ? "M7 14l5-5 5 5" : "M7 10l5 5 5-5"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {delta}
        </p>
      ) : null}
    </div>
  );
}

/** Simple horizontal share bar (devices, browsers). */
export function ShareBar({
  segments,
}: {
  segments: { label: string; pct: number; className: string }[];
}) {
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((s) => (
          <span
            key={s.label}
            className={cn("h-full", s.className)}
            style={{ width: `${s.pct}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", s.className)} aria-hidden="true" />
            {s.label} · {s.pct}%
          </span>
        ))}
      </div>
    </div>
  );
}
