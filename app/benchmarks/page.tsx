import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { PageHeader } from "@/components/shared/PageHeader";

export default function BenchmarksPage() {
  // Real scheduler, run once when the page is built; SA uses a fixed seed, so these repeat exactly.
  const normal = runWeek(false);
  const storm = runWeek(true);
  const small = runSmallCase();
  const ROWS = [
    ["Full week, normal", String(normal.variables), normal.simple.penalty.toFixed(2), normal.sa.penalty.toFixed(2), "Too big to check", "Not built"],
    ["Full week, solar storm", String(storm.variables), storm.simple.penalty.toFixed(2), storm.sa.penalty.toFixed(2), "Too big to check", "Not built"],
    ["Slice: A and B, Mon 06:00–10:00", String(small.variables), "Not run", small.saEnergy.toFixed(2), small.exactEnergy.toFixed(2), "Not built"],
  ];
  return (
    <>
      <PageHeader
        title="Benchmarks"
        subtitle="Solver and model evaluation on simulated instances · classical hardware only"
        actions={<Button href="/optimization">Open live comparison</Button>}
      />
      <Card className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-border">
                {["Instance", "Choices", "Simple plan", `SA (seed ${SA_SEED})`, "Brute force (exact)", "SB"].map(
                  (h) => (
                    <th key={h} className="py-2 pr-3 font-medium">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r[0]} className="border-b border-border-soft last:border-0">
                  {r.map((c, i) => (
                    <td key={i} className="py-3 pr-3">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="font-semibold text-[15px] mb-2">Notes for implementers</div>
          <p className="text-sm text-secondary">
            Penalty scores (lower is better) from the real scheduler on the simulated crew week, worked out when
            this page was built. Run times are on the Optimization screen, measured in your browser. Simulated
            bifurcation (SB) is not built, so it has no numbers. Do not claim quantum hardware acceleration.
          </p>
        </Card>
        <Card>
          <div className="font-semibold text-[15px] mb-2">Credibility checklist</div>
          <p className="text-sm leading-relaxed">
            ✓ Same feasibility across solvers
            <br />
            ✓ Lower objective preferred
            <br />
            ✓ Simulated bifurcation marked “Not built”
            <br />✓ Explicit “quantum-inspired classical” label
          </p>
        </Card>
      </div>
    </>
  );
}
