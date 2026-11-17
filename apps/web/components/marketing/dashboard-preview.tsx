"use client";

import { useState } from "react";
import Image from "next/image";
import { BarChart3, Palette, FileText, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type PreviewTab = "analytics" | "studio" | "policies";

interface TabItem {
  id: PreviewTab;
  label: string;
  url: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  icon: any;
}

const TABS: TabItem[] = [
  {
    id: "analytics",
    label: "Analytics Overview",
    url: "upfront.local/analytics",
    src: "/dashboard-illustration/overview.png",
    width: 1504,
    height: 873,
    alt: "UpFront Privacy Analytics Overview Dashboard",
    icon: BarChart3,
  },
  {
    id: "studio",
    label: "Banner Studio",
    url: "upfront.local/consent/studio",
    src: "/dashboard-illustration/banner-studio.png",
    width: 1918,
    height: 868,
    alt: "UpFront Consent Management Banner Studio",
    icon: Palette,
  },
  {
    id: "policies",
    label: "Cookie & Legal Policies",
    url: "upfront.local/consent/policy",
    src: "/dashboard-illustration/policies.png",
    width: 1693,
    height: 877,
    alt: "UpFront Cookie Policy & Legal Compliance Dashboard",
    icon: FileText,
  },
];

export function InteractiveDashboardPreview({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("analytics");
  const current = TABS.find((t) => t.id === activeTab) || TABS[0]!;

  return (
    <div className={cn("mx-auto w-full max-w-6xl", className)}>
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
                isActive
                  ? "bg-white text-primary shadow-xs ring-1 ring-slate-200"
                  : "bg-surface/60 text-ink-soft hover:bg-white hover:text-ink hover:shadow-2xs"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Browser Window Mockup */}
      <div className="relative rounded-xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/5">
        {/* Mock Browser Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-400/80" />
            <div className="h-3 w-3 rounded-full bg-amber-400/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>

          <div className="flex items-center gap-2 rounded-md border border-slate-200/70 bg-white px-3 py-1 text-[11px] font-mono text-slate-500 shadow-2xs w-72 max-w-[50%] justify-center">
            <Lock className="h-3 w-3 text-emerald-600" />
            <span className="truncate">{current.url}</span>
          </div>

          <div className="w-10" />
        </div>

        {/* Screenshot View */}
        <div className="relative bg-slate-100/50 aspect-video overflow-hidden">
          {TABS.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-200",
                tab.id === activeTab ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              )}
            >
              <Image
                src={tab.src}
                alt={tab.alt}
                width={tab.width}
                height={tab.height}
                className="w-full h-full object-cover object-top"
                priority={tab.id === "analytics"}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrowserMockupFrame({
  src,
  alt,
  width,
  height,
  url = "upfront.local/dashboard",
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  url?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-slate-200/90 bg-white shadow-xl overflow-hidden ring-1 ring-slate-900/5",
        className
      )}
    >
      {/* Mock Browser Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>

        <div className="flex items-center gap-2 rounded-md border border-slate-200/70 bg-white px-3 py-0.5 text-[11px] font-mono text-slate-500 shadow-2xs w-64 max-w-[60%] justify-center">
          <Lock className="h-2.5 w-2.5 text-emerald-600" />
          <span className="truncate">{url}</span>
        </div>

        <div className="w-8" />
      </div>

      {/* Image */}
      <div className="relative bg-slate-100/50 overflow-hidden">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-auto object-cover object-top"
          priority={priority}
        />
      </div>
    </div>
  );
}
