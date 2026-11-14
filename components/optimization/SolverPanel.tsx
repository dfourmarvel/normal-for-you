import { Card } from "@/components/shared/Card";

export function SolverPanel() {
  const cells = [
    { label: "Horizon", value: "72 hours" },
    { label: "Crew count", value: "4" },
    { label: "SB spin steps", value: "2,400" },
    { label: "Seed", value: "20261105" },
  ];
  return (
    <Card>
      <div className="font-semibold text-[15px] mb-4">Solver panel — run config</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cells.map((c) => (
          <div key={c.label}>
            <div className="text-[11px] uppercase tracking-wide text-muted mb-1">{c.label}</div>
            <div className="font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
