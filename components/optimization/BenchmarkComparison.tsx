import { Card } from "@/components/shared/Card";
import { Tag } from "@/components/shared/Tag";
import { OTHER_SEEDS, SA_ITERATIONS, SA_SEED, type Run, type WeekRuns } from "./realSchedule";

export function BenchmarkComparison({ week }: { week: WeekRuns }) {
  const gap = week.simple.penalty - week.sa.penalty;
  const verdict = gap === 0 ? "Both solvers reach the same penalty on this run."
    : `${gap > 0 ? "Simulated annealing" : "The simple plan"} scores ${Math.abs(gap).toFixed(2)} lower (better) on this run.`;
  return (
    <>
    <p className="text-sm text-secondary mb-3">{verdict}</p>
    <div className="grid md:grid-cols-3 gap-4">
      <SolverCard name="Simple plan" note="Fixed round-robin rota, the offline fallback. Scored on the same penalty function as SA." run={week.simple} />
      <SolverCard
        name="Simulated annealing"
        note={`Same QUBO, ${SA_ITERATIONS.toLocaleString()} steps, one fixed seed (${SA_SEED}), so the same plan every run. Other seeds score differently: seeds ${OTHER_SEEDS.seeds[0]}–${OTHER_SEEDS.seeds.at(-1)} scored ${week.otherSeedRange[0].toFixed(2)} to ${week.otherSeedRange[1].toFixed(2)} on this week (measured beforehand, not re-run here).`}
        run={week.sa}
      />
      <Card>
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold text-[15px]">Simulated bifurcation</div>
          <Tag>Not built</Tag>
        </div>
        <p className="text-sm text-secondary mt-2">
          Planned (ballistic SB, Goto et al. 2021, Science Advances 7:eabe7953): quantum-inspired, running on an
          ordinary computer. No SB solver exists in the code yet, so no numbers are shown.
        </p>
      </Card>
    </div>
    </>
  );
}

function SolverCard({ name, note, run }: { name: string; note: string; run: Run }) {
  const pass = run.hardBreaks === 0;
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-[15px]">{name}</div>
        <Tag tone={pass ? "teal" : "coral"}>{pass ? "✓ 0 hard breaks" : `✗ ${run.hardBreaks} hard breaks`}</Tag>
      </div>
      <p className="text-sm text-secondary mt-2">{note}</p>
      <div className="text-[40px] font-bold mt-3 leading-none text-charcoal">{run.penalty.toFixed(2)}</div>
      <div className="text-xs text-muted mt-1">Penalty (lower is better)</div>
      <div className="mt-4 space-y-1.5 text-sm">
        <Row label="Run time (this browser)" value={`${run.ms.toFixed(1)} ms`} />
        <Row label="Sessions placed" value={String(run.assignments.length)} />
        <Row label="Hard breaks" value={`${run.hardBreaks} (${pass ? "pass" : "fail"})`} />
      </div>
    </Card>
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
