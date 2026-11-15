"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/shared/BrandMark";
import { MissionTime } from "@/components/shared/MissionTime";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const PRIMARY = [
  { href: "/", label: "Check", match: ["/"] },
  { href: "/proof", label: "Why trust it", match: ["/proof"] },
  { href: "/crew", label: "Crew", match: ["/crew"] },
];

const MORE = [
  { href: "/mission", label: "Overview" },
  { href: "/astronaut", label: "Astronaut replays" },
  { href: "/health-analysis", label: "Analysis" },
  { href: "/biological-state", label: "Biological state" },
  { href: "/optimization", label: "Optimization" },
  { href: "/proof/heart-rhythm", label: "Heart rhythm (real data)" },
  { href: "/forecasts", label: "Forecasts" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, match: string[]) {
  return match.some((m) => (m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(m + "/")));
}

function navLinkClass(active: boolean, compact = false) {
  return `${compact ? "block w-full text-left px-3 py-2.5 rounded-[12px] text-[14px]" : "px-3 py-2 rounded-full text-[12.5px]"} font-medium whitespace-nowrap transition-colors shrink-0 ${
    active ? (compact ? "bg-primary-soft text-primary font-semibold" : "bg-primary text-white font-semibold") : "text-charcoal hover:bg-card-muted"
  }`;
}

export function TopNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  // Most specific match wins, so /proof/heart-rhythm doesn't also light up /proof.
  const moreHref = MORE.filter((n) => pathname === n.href || pathname.startsWith(n.href + "/")).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  // /proof/heart-rhythm lights "Why trust it"; the More button stays plain when a primary item is already lit.
  const moreActive = moreHref !== undefined && !PRIMARY.some((n) => isActive(pathname, n.match));

  // Close both menus on navigation (React's "reset state when a prop changes" pattern).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
    setMoreOpen(false);
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMoreOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const allLinks = (
    <>
      {PRIMARY.map((n) => {
        const active = isActive(pathname, n.match);
        return (
          <Link key={n.href} href={n.href} className={navLinkClass(active)}>
            {n.label}
          </Link>
        );
      })}
      <div className="relative shrink-0" ref={moreRef}>
        <button
          type="button"
          className={navLinkClass(moreActive || moreOpen)}
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          onClick={(e) => {
            e.stopPropagation();
            setMoreOpen((v) => !v);
          }}
        >
          More
        </button>
        {moreOpen && (
          <div
            role="menu"
            className="absolute top-[calc(100%+8px)] right-0 min-w-[200px] bg-white rounded-2xl shadow-[0_8px_28px_rgba(44,40,36,0.10)] border border-border p-1.5 z-40"
          >
            {MORE.map((n) => {
              const active = n.href === moreHref;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className={`block px-3 py-2.5 rounded-[10px] text-[13px] font-medium ${
                    active ? "bg-primary-soft text-primary font-semibold" : "text-charcoal hover:bg-card-muted"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <header className="mb-4 sm:mb-5 py-2" role="banner">
      {/* Phone / tablet: logo + menu button, no clipped pills */}
      <div className="flex items-center justify-between gap-3 xl:hidden">
        <BrandMark compact />
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle size="sm" />
          <span className="w-8 h-8 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center" aria-hidden>
            BT
          </span>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-white shadow-card border border-border/60 flex items-center justify-center text-charcoal"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="xl:hidden mt-3 bg-white rounded-[20px] border border-border shadow-card p-2 z-40 relative"
        >
          <nav className="flex flex-col" aria-label="Primary">
            {PRIMARY.map((n) => {
              const active = isActive(pathname, n.match);
              return (
                <Link key={n.href} href={n.href} className={navLinkClass(active, true)}>
                  {n.label}
                </Link>
              );
            })}
            <div className="my-1.5 mx-2 border-t border-border-soft" />
            {MORE.map((n) => {
              const active = n.href === moreHref;
              return (
                <Link key={n.href} href={n.href} className={navLinkClass(active, true)}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-2 pt-2 mx-1 border-t border-border-soft flex flex-col gap-2">
            <RoleSwitcher />
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-2 pb-1">
              <MissionTime />
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <ThemeToggle size="sm" />
                <button type="button" className="w-9 h-9 rounded-full bg-card-muted flex items-center justify-center text-charcoal" aria-label="Search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3-3" />
                  </svg>
                </button>
                <button type="button" className="w-9 h-9 rounded-full bg-card-muted flex items-center justify-center text-charcoal relative" aria-label="Alerts">
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8a6 6 0 0112 0c0 7 3 7 3 7H3s3 0 3-7" />
                    <path d="M10 18a2 2 0 004 0" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: single-row pills (do not wrap) */}
      <div className="hidden xl:flex items-center gap-4 flex-nowrap">
        <BrandMark />
        <nav
          className="flex items-center gap-0.5 bg-white p-1 rounded-full shadow-card mx-auto flex-nowrap whitespace-nowrap"
          aria-label="Primary"
        >
          {allLinks}
        </nav>
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <MissionTime />
          <button type="button" className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-charcoal" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" />
            </svg>
          </button>
          <button type="button" className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-charcoal relative" aria-label="Alerts">
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0112 0c0 7 3 7 3 7H3s3 0 3-7" />
              <path d="M10 18a2 2 0 004 0" />
            </svg>
          </button>
          <ThemeToggle />
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}
