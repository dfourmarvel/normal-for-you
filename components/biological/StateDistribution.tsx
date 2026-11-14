import { Card } from "@/components/shared/Card";
import { Tag } from "@/components/shared/Tag";

export function StateDistribution({
  bins,
  values,
  active,
}: {
  bins: string[];
  values: number[];
  active: string;
}) {
  const max = Math.max(...values, 1);
  const short = ["Stable", "Mild", "Coupled", "Uncertain", "Recovery"];
  return (
    <Card>
      <div className="font-semibold text-[15px] mb-2">State distribution</div>
      <p className="text-sm text-secondary mb-3">Posterior mass over latent physiological regimes (simulated)</p>
      <div className="flex items-end gap-2 h-28" aria-label="State distribution histogram">
        {values.map((v, i) => {
          const isPeak = bins[i] === active || bins[i]?.includes("Coupled");
          return (
            <div key={bins[i] || i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div
                className={`w-full rounded-t-md ${isPeak ? "bg-primary" : "bg-teal/50"}`}
                style={{ height: `${(v / max) * 100}%` }}
                title={`${bins[i]} ${v}%`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted">
        {short.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <p className="mt-3">
        <Tag tone="coral">Active regime: {active}</Tag>
      </p>
    </Card>
  );
}
