import { Card } from "@/components/shared/Card";
import { Tag } from "@/components/shared/Tag";
import type { Solver } from "@/lib/types";

export function BenchmarkComparison({ solvers }: { solvers: Solver[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {solvers.map((s) => (
        <Card key={s.id} className={s.winner ? "ring-2 ring-primary/30" : ""}>
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-[15px]">{s.name.replace(" (classical)", "")}</div>
            {s.winner ? <Tag tone="coral">Preferred</Tag> : <Tag>Classical baseline</Tag>}
          </div>
          <p className="text-sm text-secondary mt-2">{s.disclaimer}</p>
          <div className={`text-[40px] font-bold mt-3 leading-none ${s.winner ? "text-primary" : "text-secondary"}`}>
            {s.objective_value.toFixed(3)}
          </div>
          <div className="text-xs text-muted mt-1">Objective (lower is better)</div>
          <div className="mt-4 space-y-1.5 text-sm">
            <Row label="Runtime" value={`${s.runtime_ms} ms`} />
            <Row label="Iterations" value={s.iterations.toLocaleString()} />
            <Row label="Feasibility" value={s.feasibility.toFixed(2)} />
            <Row label="Final energy" value={String(s.energy_trace_end)} />
          </div>
          <div className="mt-4 h-2 rounded-full bg-border-soft overflow-hidden">
            <div
              className={`h-full rounded-full ${s.winner ? "bg-primary" : "bg-teal"}`}
              style={{ width: s.winner ? "86%" : "72%" }}
            />
          </div>
          <p className="text-xs text-secondary mt-2">Relative solution quality (normalized)</p>
        </Card>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-secondary">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
