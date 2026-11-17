"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { GitHubStarButton } from "./github-star-button";
import { productNav } from "@/lib/site";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

const moduleIcons: Record<string, string> = {
  "/product/analytics": "M3 20h18M6 16v-5m6 5V8m6 8v-8",
  "/product/consent": "M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z",
  "/product/scanner": "M21 21l-4.35-4.35M11 6a5 5 0 100 10 5 5 0 000-10z",
  "/product/proof": "M9 12h6m-6 4h6M9 8h6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z",
  "/analytics": "M3 20h18M6 16v-5m6 5V8m6 8v-8",
  "/consent": "M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z",
  "/scanner": "M21 21l-4.35-4.35M11 6a5 5 0 100 10 5 5 0 000-10z",
  "/proof": "M9 12h6m-6 4h6M9 8h6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z",
};

function ProductDropdown({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const anyActive = productNav.some((item) => isActivePath(pathname, item.to));

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/70",
          anyActive ? "text-ink" : "text-ink-soft",
        )}
      >
        Product
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          "absolute left-1/2 top-full w-[30rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-2 transition-all duration-150 z-50",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
        )}
      >
        <div className="grid grid-cols-1 gap-1 rounded-xl border border-line bg-surface p-2 shadow-lg shadow-slate-900/5 sm:grid-cols-2">
          {productNav.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className={cn(
                "group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-brand-mist",
                isActivePath(pathname, item.to) && "bg-brand-mist",
              )}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-background text-primary">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d={moduleIcons[item.to] || "M3 20h18"} />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">{item.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname() || "/";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <ProductDropdown />
          <Link
            href="/docs"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/70",
              isActivePath(pathname, "/docs") ? "text-ink" : "text-ink-soft",
            )}
          >
            Docs
          </Link>
        </nav>

        <div className="hidden items-center md:flex">
          <GitHubStarButton />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-muted/70 md:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "overflow-hidden border-line bg-surface transition-[max-height,opacity] duration-300 md:hidden",
          mobileOpen ? "max-h-[32rem] border-t opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="space-y-1 px-4 py-4 sm:px-6">
          <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Product
          </p>
          {productNav.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/70",
                isActivePath(pathname, item.to) ? "bg-brand-mist text-ink" : "text-ink-soft",
              )}
            >
              {item.title}
            </Link>
          ))}
          <p className="px-2 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            More
          </p>
          <Link
            href="/docs"
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-muted/70"
          >
            Docs
          </Link>
          <div className="border-t border-line pt-3">
            <GitHubStarButton className="w-full justify-center py-2.5" />
          </div>
        </nav>
      </div>
    </header>
  );
}
