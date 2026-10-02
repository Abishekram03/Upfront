import { Check, Minus, X } from "lucide-react";
import { comparisonRows, type ComparisonRow } from "@/lib/site";
import { Container, Section, SectionHeader } from "./ui";
import { cn } from "@/lib/utils";

function Cell({ value, highlight = false }: { value: string | boolean; highlight?: boolean }) {
  if (value === true) {
    return (
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full",
          highlight ? "bg-brand-mist text-primary" : "bg-success-soft text-success",
        )}
        aria-label="Included"
      >
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-label="Not included"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className={cn("text-sm", highlight ? "font-medium text-ink" : "text-muted-foreground")}>
      {value}
    </span>
  );
}

export function ComparisonSection() {
  return (
    <Section className="border-t border-line bg-surface">
      <SectionHeader
        eyebrow="Compare"
        title="Two essential website tools. One platform."
        description="UpFront compared with the typical setup: a standalone analytics tool plus a separate consent management platform."
      />
      <Container className="mt-10 max-w-none">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[36rem] border-collapse bg-surface text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-5 py-4 text-sm font-medium text-ink">
                  Capability
                </th>
                <th scope="col" className="w-44 bg-brand-mist/60 px-5 py-4 text-center text-sm font-medium text-primary">
                  UpFront
                </th>
                <th scope="col" className="w-56 px-5 py-4 text-center text-sm font-medium text-muted-foreground">
                  Traditional stack
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row: ComparisonRow) => (
                <tr key={row.category} className="border-b border-line last:border-0">
                  <th scope="row" className="px-5 py-3.5 text-sm font-medium text-ink">
                    {row.category}
                  </th>
                  <td className="bg-brand-mist/40 px-5 py-3.5 text-center">
                    <Cell value={row.upfront} highlight />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Cell value={row.traditional} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Minus className="h-3 w-3" aria-hidden="true" />
          "Traditional stack" refers to a typical combination of a standalone analytics tool and a
          separate consent management platform. Capabilities vary by vendor.
        </p>
      </Container>
    </Section>
  );
}
