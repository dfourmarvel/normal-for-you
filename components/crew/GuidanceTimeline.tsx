import type { GuidancePlanItem } from "@/lib/types";

export function GuidanceTimeline({ plan }: { plan: GuidancePlanItem[] }) {
  return (
    <div className="relative pl-0">
      {plan.map((item, i) => (
        <div key={`${item.time}-${i}`} className="flex gap-3 relative pb-5 last:pb-0">
          {i < plan.length - 1 && (
            <div className="absolute left-[18px] top-8 bottom-0 w-px bg-border" aria-hidden />
          )}
          <div className="w-9 shrink-0 text-[12px] font-semibold text-teal-dark pt-1">{item.time}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-[13.5px] text-charcoal">{item.title}</h4>
            <p className="text-xs text-secondary mt-0.5">{item.detail}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-6 h-6 rounded-full bg-primary-soft text-primary text-[9px] font-bold flex items-center justify-center">
                {item.actor.initials}
              </span>
              <span className="text-xs text-secondary">{item.actor.name}</span>
              {(item.type === "exercise" || item.type === "sleep" || item.type === "analysis") && (
                <span className="text-muted text-xs" title="Note">
                  ✉
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
