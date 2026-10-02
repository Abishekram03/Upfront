"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "banner" | "preferences";

const tabLabels: { id: Tab; label: string }[] = [
  { id: "banner", label: "Consent banner" },
  { id: "preferences", label: "Preference Centre" },
];

export function ConsentPreview({ className }: { className?: string }) {
  const [tab, setTab] = useState<Tab>("banner");
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className={cn("rounded-xl border border-line bg-surface p-4 shadow-xl shadow-slate-900/[0.08] sm:p-5", className)}>
      <div
        role="tablist"
        aria-label="Consent interface previews"
        className="mb-4 inline-flex rounded-lg border border-line bg-muted/60 p-1"
      >
        {tabLabels.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              tab === t.id ? "bg-surface text-ink shadow-xs" : "text-muted-foreground hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "banner" ? (
        <div className="overflow-hidden rounded-lg border border-line bg-muted/40">
          {/* Mini website backdrop */}
          <div className="space-y-2.5 p-4" aria-hidden="true">
            <div className="h-2.5 w-24 rounded-full bg-slate-300/80" />
            <div className="h-2 w-full max-w-[85%] rounded-full bg-slate-200" />
            <div className="h-2 w-full max-w-[70%] rounded-full bg-slate-200" />
            <div className="mt-3 flex gap-2">
              <div className="h-6 w-20 rounded-md bg-primary/25" />
              <div className="h-6 w-16 rounded-md bg-slate-200" />
            </div>
          </div>
          {/* Banner */}
          <div className="border-t border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">We value your privacy</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  We use cookies to improve your experience. You can accept all, reject
                  non-essential, or customize your preferences.
                </p>
              </div>
              <span className="rounded border border-line bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                EN
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSaved(true);
                  window.setTimeout(() => setSaved(false), 1600);
                }}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-dark cursor-pointer shadow-2xs"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaved(true);
                  window.setTimeout(() => setSaved(false), 1600);
                }}
                className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-muted/60 cursor-pointer shadow-2xs"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={() => setTab("preferences")}
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline cursor-pointer"
              >
                Customize
              </button>
            </div>
            <p
              className={cn(
                "mt-2 text-[11px] font-semibold text-success transition-opacity",
                saved ? "opacity-100" : "opacity-0",
              )}
              role="status"
            >
              ✓ Preference recorded
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="border-b border-line bg-muted/40 px-4 py-3">
            <p className="text-sm font-bold text-ink">Manage your preferences</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Choose which categories you allow. You can change this at any time.
            </p>
          </div>
          <div className="divide-y divide-line">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Strictly necessary</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Required for core site functionality.
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Always active
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Analytics</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Helps us understand how the site is used.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analytics}
                onClick={() => setAnalytics(!analytics)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                  analytics ? "bg-primary" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                    analytics ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">Marketing</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Personalized ads and measurement.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={marketing}
                onClick={() => setMarketing(!marketing)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                  marketing ? "bg-primary" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                    marketing ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line bg-muted/30 px-4 py-3">
            <button
              type="button"
              onClick={() => setTab("banner")}
              className="text-xs font-semibold text-muted-foreground hover:text-ink cursor-pointer"
            >
              ← Back to banner
            </button>
            <button
              type="button"
              onClick={() => {
                setSaved(true);
                window.setTimeout(() => setSaved(false), 1600);
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-dark cursor-pointer shadow-2xs"
            >
              Save preferences
            </button>
          </div>
          <p
            className={cn(
              "px-4 pb-3 text-[11px] font-semibold text-success transition-opacity",
              saved ? "opacity-100" : "opacity-0",
            )}
            role="status"
          >
            ✓ Preference recorded
          </p>
        </div>
      )}
    </div>
  );
}
