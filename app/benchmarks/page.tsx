import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { SA_SEED, runSmallCase, runWeek } from "@/components/optimization/realSchedule";

export default function BenchmarksPage() {
  const normal = runWeek(false);
  const storm = runWeek(true);
  const small = runSmallCase();
  const rows = [
    ["Full week, normal", String(normal.variables), normal.simple.penalty.toFixed(2), normal.sa.penalty.toFixed(2), "Too big to check", "Not built"],
    ["Full week, solar storm", String(storm.variables), storm.simple.penalty.toFixed(2), storm.sa.penalty.toFixed(2), "Too big to check", "Not built"],
    ["Slice: A and B, Mon 06:00–10:00", String(small.variables), "Not run", small.saEnergy.toFixed(2), small.exactEnergy.toFixed(2), "Not built"],
  ];
  return (
    <>
      <PageHeader title="Benchmarks" subtitle="Concept benchmark demo · simulated instance · classical hardware only" actions={<Button href="/optimization">Open live comparison</Button>} />
      <p className="mb-3 rounded-xl border border-border bg-card p-4 text-sm">Concept screen, values made up. These illustrative scheduler results are not a production claim.</p>
      <Card className="mb-4">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-border">
            {["Instance", "Choices", "Simple plan", `SA (seed ${SA_SEED})`, "Brute force (exact)", "SB"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>{rows.map((row) => <tr key={row[0]} className="border-b border-border-soft last:border-0">{row.map((cell, i) => <td key={i} className="py-3 pr-3">{cell}</td>)}</tr>)}</tbody>
        </table></div>
      </Card>
      <Card><p className="text-sm">Simulated bifurcation is not built and has no results. Values shown are demo-only.</p></Card>
    </>
  );
}

