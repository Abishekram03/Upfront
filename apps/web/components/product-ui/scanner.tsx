import { AppFrame } from "./app-frame";
import { cn } from "@/lib/utils";

const scanSummary = [
  { label: "Cookies found", value: "14" },
  { label: "Third-party domains", value: "6" },
  { label: "Pages scanned", value: "48" },
];

type CookieRow = {
  name: string;
  category: "Necessary" | "Analytics" | "Marketing" | "Functional";
  domain: string;
  type: string;
  status: "Mapped" | "Needs review";
  detected: string;
};

const rows: CookieRow[] = [
  { name: "_ga", category: "Analytics", domain: "acme-store.com", type: "HTTP", status: "Mapped", detected: "Sep 26, 09:14" },
  { name: "_gcl_au", category: "Marketing", domain: "acme-store.com", type: "HTTP", status: "Mapped", detected: "Sep 26, 09:14" },
  { name: "fr", category: "Marketing", domain: "facebook.com", type: "Third-party", status: "Mapped", detected: "Sep 26, 09:14" },
  { name: "_hjSessionUser", category: "Analytics", domain: "hotjar.com", type: "Third-party", status: "Needs review", detected: "Sep 26, 09:15" },
  { name: "csrftoken", category: "Necessary", domain: "acme-store.com", type: "HTTP", status: "Mapped", detected: "Sep 26, 09:16" },
  { name: "theme_dark", category: "Functional", domain: "acme-store.com", type: "HTTP", status: "Mapped", detected: "Sep 26, 09:16" },
];

const categoryStyles: Record<CookieRow["category"], string> = {
  Necessary: "bg-brand-mist text-primary",
  Analytics: "bg-success-soft text-emerald-800",
  Marketing: "bg-warning-soft text-amber-800",
  Functional: "bg-muted text-ink-soft",
};

export function ScannerPreview({ className }: { className?: string }) {
  return (
    <AppFrame url="app.upfront.io/scanner" className={className}>
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-ink">Cookie scan</h4>
            <p className="text-[11px] text-muted-foreground">
              acme-store.com · Completed Sep 26, 09:16 UTC
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            Completed
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {scanSummary.map((s) => (
            <div key={s.label} className="rounded-lg border border-line bg-surface p-3">
              <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-ink">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-line bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-bold">Cookie</th>
                <th className="hidden px-3 py-2 font-bold sm:table-cell">Category</th>
                <th className="hidden px-3 py-2 font-bold md:table-cell">Domain</th>
                <th className="px-3 py-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.name} className="bg-surface hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-2">
                    <span className="font-mono font-semibold text-ink">{r.name}</span>
                    <span className="block text-[10px] text-muted-foreground md:hidden">
                      {r.domain}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2 sm:table-cell">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        categoryStyles[r.category],
                      )}
                    >
                      {r.category}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2 text-muted-foreground md:table-cell">{r.domain}</td>
                  <td className="px-3 py-2">
                    {r.status === "Mapped" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                          <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Mapped
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-warning">Needs review</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-right text-[10px] text-muted-foreground">Illustrative sample data</p>
      </div>
    </AppFrame>
  );
}
