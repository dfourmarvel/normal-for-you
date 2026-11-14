"use client";

import type { Countermeasure } from "@/lib/types";

export function CountermeasureCard({ item }: { item: Countermeasure }) {
  return (
    <div className="relative bg-white border border-border rounded-[16px] p-3.5 shadow-card">
      <button
        type="button"
        aria-label="Add to plan"
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-soft text-primary text-sm font-bold leading-none hover:bg-primary hover:text-white transition-colors"
      >
        +
      </button>
      <div className="text-2xl mb-2">{item.icon}</div>
      <h5 className="font-semibold text-[13px] text-charcoal pr-5 leading-snug">{item.title}</h5>
      <p className="text-[11px] text-secondary mt-1">{item.subtitle}</p>
    </div>
  );
}
