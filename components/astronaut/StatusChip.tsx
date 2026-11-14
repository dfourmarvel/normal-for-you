import type { ReactNode } from "react";
import { STATUS_LABEL } from "@/app/astronaut/model";
import type { Status } from "@/lib/types";

// Same look as the proof page's chips: colour, icon shape and text together, so colour is never the only signal.
const CHIP: Record<Status, { cls: string; icon: ReactNode }> = {
  nominal: {
    cls: "bg-teal-soft text-chip-nominal",
    icon: <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  watch: {
    cls: "bg-yellow-soft text-chip-watch",
    icon: (
      <>
        <path d="M8 1.5l7 13H1z" fill="currentColor" />
        <path d="M8 6v4M8 12v.5" stroke="var(--yellow-soft)" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  act: {
    cls: "bg-primary-soft text-chip-act",
    icon: (
      <>
        <path d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" fill="currentColor" />
        <path d="M8 4.5v4.5M8 11.2v.3" stroke="var(--primary-soft)" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  notMeasured: {
    cls: "bg-border-soft text-chip-none",
    icon: <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  },
};

export function StatusChip({ status }: { status: Status }) {
  const c = CHIP[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${c.cls}`}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">{c.icon}</svg>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SimulatedBadge({ text }: { text: string }) {
  return (
    <p className="inline-flex max-w-full items-start gap-1.5 rounded-xl border border-purple bg-card px-2.5 py-1 text-xs font-medium text-charcoal">
      <svg aria-hidden="true" viewBox="0 0 8 8" className="mt-1 h-2 w-2 shrink-0 text-purple"><circle cx="4" cy="4" r="4" fill="currentColor" /></svg>
      <span>{text}</span>
    </p>
  );
}

export function SectionLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-xs font-semibold tracking-[0.08em] text-secondary uppercase">
      {children}
    </h2>
  );
}

export const CARD = "rounded-2xl border border-border bg-card p-4 shadow-[0_1px_3px_rgba(44,44,44,0.04)] sm:p-5";
export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
