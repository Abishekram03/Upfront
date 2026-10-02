import { AppFrame } from "./app-frame";
import { cn } from "@/lib/utils";

type ConsentRow = {
  receipt: string;
  time: string;
  country: string;
  status: "Granted" | "Partial" | "Denied";
  categories: string;
  version: string;
};

const records: ConsentRow[] = [
  { receipt: "rcpt_9F3A21C7", time: "Sep 26, 10:02", country: "DE", status: "Granted", categories: "Necessary, Analytics", version: "cfg v3" },
  { receipt: "rcpt_7B84EE02", time: "Sep 26, 10:01", country: "FR", status: "Partial", categories: "Necessary", version: "cfg v3" },
  { receipt: "rcpt_2D91F6B4", time: "Sep 26, 09:58", country: "US", status: "Granted", categories: "Necessary, Analytics, Marketing", version: "cfg v3" },
  { receipt: "rcpt_51C7AD38", time: "Sep 26, 09:55", country: "GB", status: "Denied", categories: "Necessary only", version: "cfg v3" },
  { receipt: "rcpt_E40B916D", time: "Sep 26, 09:51", country: "IN", status: "Granted", categories: "Necessary, Analytics", version: "cfg v2" },
];

const statusStyles: Record<ConsentRow["status"], string> = {
  Granted: "bg-success-soft text-ink",
  Partial: "bg-warning-soft text-ink",
  Denied: "bg-muted text-muted-foreground",
};

export function ProofPreview({ className }: { className?: string }) {
  return (
    <AppFrame url="app.upfront.io/proof" className={className}>
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-medium text-ink">Proof-of-consent vault</h4>
            <p className="text-[11px] text-muted-foreground">1,482 records this month</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-primary" aria-hidden="true">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export CSV
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="flex flex-1 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" aria-hidden="true">
              <path d="M21 21l-4.35-4.35M11 6a5 5 0 100 10 5 5 0 000-10z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Search receipts, countries, versions…
          </span>
          <span className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink-soft">
            Status · All
          </span>
          <span className="hidden rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink-soft sm:block">
            Last 30 days
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-line bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Receipt</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Time (UTC)</th>
                <th className="px-3 py-2 font-medium">Country</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">Categories</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {records.map((r) => (
                <tr key={r.receipt} className="bg-surface">
                  <td className="px-3 py-2 font-mono text-primary">{r.receipt}</td>
                  <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">{r.time}</td>
                  <td className="px-3 py-2 text-ink">{r.country}</td>
                  <td className="hidden max-w-[10rem] truncate px-3 py-2 text-muted-foreground md:table-cell">
                    {r.categories}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusStyles[r.status],
                      )}
                    >
                      {r.status}
                    </span>
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
