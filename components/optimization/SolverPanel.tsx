import { Card } from "@/components/shared/Card";
import { SA_ITERATIONS, SA_SEED, type WeekRuns } from "./realSchedule";

export function SolverPanel({ week }: { week: WeekRuns }) {
  const cells = [
    { label: "Horizon", value: "7 days × 16 waking hours" },
    { label: "Crew count", value: "4 (3 test astronauts + D)" },
    { label: "QUBO size", value: `${week.variables} variables, ${week.terms.toLocaleString()} pair terms` },
    { label: "QUBO build time", value: `${week.buildMs.toFixed(1)} ms` },
    { label: "SA steps", value: SA_ITERATIONS.toLocaleString() },
    { label: "SA seed", value: String(SA_SEED) },
  ];
  return (
    <Card>
      <div className="font-semibold text-[15px] mb-4">Solver panel: run config</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cells.map((c) => (
          <div key={c.label}>
            <div className="text-[11px] uppercase tracking-wide text-muted mb-1">{c.label}</div>
            <div className="font-semibold text-sm">{c.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
