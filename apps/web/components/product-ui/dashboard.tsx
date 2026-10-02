"use client";

import { AppFrame, AppShell, LiveBadge, RangePill, ShareBar, StatCard } from "./app-frame";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Sample pageview series (illustrative data)
const series = [42, 51, 47, 63, 58, 74, 69];
const max = 80;

function chartPoints(width: number, height: number) {
  const stepX = width / (series.length - 1);
  return series
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - (v / max) * height).toFixed(1)}`)
    .join(" ");
}

function TrafficChart() {
  const w = 560;
  const h = 130;
  const line = chartPoints(w, h);
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground">Pageviews</p>
        <p className="text-[11px] font-semibold text-muted-foreground">48,120 this week</p>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h + 20}`}
        className="mt-2 w-full"
        role="img"
        aria-label="Sample pageview chart for the last seven days"
      >
        <defs>
          <linearGradient id="upf-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1868db" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#1868db" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            x2={w}
            y1={h * f}
            y2={h * f}
            stroke="currentColor"
            className="text-line"
            strokeDasharray="3 4"
          />
        ))}
        <polygon points={area} fill="url(#upf-area)" />
        <polyline
          points={line}
          fill="none"
          stroke="#1868db"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chart-line"
        />
        <circle cx={w} cy={h - ((series[series.length - 1] ?? 0) / max) * h} r="3.5" fill="#1868db" />
        {days.map((d, i) => (
          <text
            key={d}
            x={(i * w) / (series.length - 1)}
            y={h + 15}
            textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"}
            className="fill-slate-400"
            fontSize="10"
          >
            {d}
          </text>
        ))}
      </svg>
    </div>
  );
}

const topPages = [
  { path: "/", views: 9420, pct: 92 },
  { path: "/pricing", views: 6110, pct: 60 },
  { path: "/blog/cookie-audit", views: 4380, pct: 43 },
  { path: "/docs/install", views: 2960, pct: 29 },
];
const referrers = [
  { label: "google.com", pct: 38 },
  { label: "news.ycombinator.com", pct: 21 },
  { label: "x.com", pct: 14 },
  { label: "Direct / None", pct: 19 },
];
const countries = [
  { name: "United States", pct: 34 },
  { name: "Germany", pct: 19 },
  { name: "United Kingdom", pct: 13 },
  { name: "India", pct: 9 },
];

export function DashboardPreview({ className }: { className?: string }) {
  return (
    <AppFrame className={className}>
      <AppShell
        active="Analytics"
        title="Analytics"
        actions={
          <>
            <LiveBadge />
            <RangePill />
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Pageviews" value="48,120" delta="+12.4%" />
          <StatCard label="Unique visitors" value="12,982" delta="+8.1%" />
          <StatCard label="Bounce rate" value="41.3%" delta="-1.2%" positive={false} />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <TrafficChart />
          </div>
          <div className="space-y-3 lg:col-span-2">
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-[11px] font-medium text-muted-foreground">Top pages</p>
              <ul className="mt-2 space-y-2">
                {topPages.map((p) => (
                  <li key={p.path} className="text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-ink">{p.path}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {p.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-[11px] font-medium text-muted-foreground">Referrers</p>
              <ul className="mt-2 space-y-1.5">
                {referrers.map((r) => (
                  <li key={r.label} className="flex items-center justify-between text-[11px]">
                    <span className="truncate text-ink">{r.label}</span>
                    <span className="tabular-nums text-muted-foreground">{r.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-[11px] font-medium text-muted-foreground">Devices</p>
            <div className="mt-3">
              <ShareBar
                segments={[
                  { label: "Desktop", pct: 62, className: "bg-primary" },
                  { label: "Mobile", pct: 33, className: "bg-primary/50" },
                  { label: "Tablet", pct: 5, className: "bg-slate-300" },
                ]}
              />
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-[11px] font-medium text-muted-foreground">Countries</p>
            <ul className="mt-2 space-y-1.5">
              {countries.map((c) => (
                <li key={c.name} className="flex items-center justify-between text-[11px]">
                  <span className="truncate text-ink">{c.name}</span>
                  <span className="tabular-nums text-muted-foreground">{c.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-[11px] font-medium text-muted-foreground">Consent choices</p>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              <li className="flex items-center justify-between">
                <span className="text-ink font-medium">Analytics granted</span>
                <span className="tabular-nums text-muted-foreground">72%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-ink font-medium">Marketing granted</span>
                <span className="tabular-nums text-muted-foreground">41%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-ink font-medium">Denied all</span>
                <span className="tabular-nums text-muted-foreground">14%</span>
              </li>
            </ul>
            <p className="mt-2 border-t border-line pt-2 text-[10px] text-muted-foreground">
              Illustrative sample data
            </p>
          </div>
        </div>
      </AppShell>
    </AppFrame>
  );
}
