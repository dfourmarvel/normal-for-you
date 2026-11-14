import { Card } from "@/components/shared/Card";

export function EntropyPanel({ value = 0.62 }: { value?: number }) {
  const pct = Math.round(value * 100);
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute top-4 right-4 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide bg-yellow-soft text-[#9A7A20]">
        EXPERIMENTAL
      </span>
      <div className="text-[11px] font-medium uppercase tracking-wide text-secondary mb-2">
        Biological Entropy Index
      </div>
      <div className="text-[40px] font-bold text-primary leading-none">{value.toFixed(2)}</div>
      <p className="text-sm text-secondary mt-3">
        Relative uncertainty / disorder in the estimated physiological state distribution.{" "}
        <strong className="text-charcoal">Not</strong> a validated biological-entropy instrument. For
        research exploration only.
      </p>
      <div className="mt-4 h-2 rounded-full bg-border-soft overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  );
}
