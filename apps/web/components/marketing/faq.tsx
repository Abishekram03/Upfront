"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Section, SectionHeader } from "./ui";
import type { Faq } from "@/lib/site";
import { cn } from "@/lib/utils";

export function FaqSection({
  id = "faq",
  eyebrow = "FAQ",
  title = "Frequently asked questions",
  description,
  items,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  items: Faq[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <Section id={id} className="border-t border-line bg-surface">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mx-auto mt-10 max-w-3xl">
        <div className="w-full divide-y divide-line border-b border-line">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="py-1">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between py-4 text-left text-base font-medium text-ink transition-colors hover:text-primary cursor-pointer"
                >
                  <span className="pr-4">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180 text-primary",
                    )}
                    aria-hidden="true"
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-200 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100 pb-4" : "grid-rows-[0fr] opacity-0 pb-0",
                  )}
                >
                  <div className="overflow-hidden text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
