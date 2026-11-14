import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { PageHeader } from "@/components/shared/PageHeader";

const ROWS = [
  ["CM-sched-72h-A", "48", "23", "0.318", "0.371", "142", "890", "6.3×"],
  ["CM-sched-72h-B", "48", "23", "0.295", "0.340", "138", "910", "6.6×"],
  ["SPE-response-18h", "36", "19", "0.410", "0.455", "98", "620", "6.3×"],
  ["Sleep-protect-5d", "60", "28", "0.352", "0.401", "205", "1400", "6.8×"],
];

export default function BenchmarksPage() {
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
                {["Instance", "Vars", "Constraints", "SB obj", "SA obj", "SB ms", "SA ms", "Speedup"].map(
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
                  {r.map((c) => (
                    <td key={c} className="py-3 pr-3">
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
            Numbers are simulated for UI demonstration. Backend will expose FastAPI endpoints returning
            the same JSON shapes. Do not claim quantum hardware acceleration.
          </p>
        </Card>
        <Card>
          <div className="font-semibold text-[15px] mb-2">Credibility checklist</div>
          <p className="text-sm leading-relaxed">
            ✓ Same feasibility across solvers
            <br />
            ✓ Lower objective preferred
            <br />
            ✓ Wall-time on identical host
            <br />✓ Explicit “quantum-inspired classical” label
          </p>
        </Card>
      </div>
    </>
  );
}
