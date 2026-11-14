"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Tag } from "@/components/shared/Tag";
import { countHardBreaks } from "@/lib/scheduler/simple";
import { BenchmarkComparison } from "./BenchmarkComparison";
import { OptimizationResults } from "./OptimizationResults";
import { SolverPanel } from "./SolverPanel";
import { STORM_SHELTER, runSmallCase, runWeek, type WeekRuns } from "./realSchedule";

type Data = { id: number; normal?: WeekRuns; storm?: WeekRuns; small?: ReturnType<typeof runSmallCase> };
const STORM_LABEL = "Solar storm: shelter Tue 10:00–14:00 (demo replay)";

export function RealScheduler() {
  const [runId, setRunId] = useState(0);
  const [storm, setStorm] = useState(false);
  const [plan, setPlan] = useState<"sa" | "simple">("sa");
  const [data, setData] = useState<Data>({ id: -1 });

  const fresh = data.id === runId;
  const needed = !fresh || !data.normal || (storm && !data.storm);

  // Solvers run on the main thread after first paint, so "Running…" shows before the work starts.
  useEffect(() => {
    if (!needed) return;
    const timer = setTimeout(() => {
      const next: Data = fresh ? { ...data } : { id: runId };
      next.normal ??= runWeek(false);
      if (storm) next.storm ??= runWeek(true);
      next.small ??= runSmallCase();
      setData(next);
    }, 30);
    return () => clearTimeout(timer);
  }, [needed, fresh, data, runId, storm]);

  const week = fresh ? (storm ? data.storm : data.normal) : undefined;
  const small = fresh ? data.small : undefined;

  return (
    <>
      <Card className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">Problem</div>
        <div className="font-semibold text-[15px]">One exercise week for 4 crew, 1 treadmill and 1 bike</div>
        <p className="text-sm text-secondary mt-2 mb-3">
          16 waking 1-hour slots a day (06:00–21:00; the 21:00 slot stays free before sleep). Hard rules: one person
          per machine per slot, nobody on both machines at once, nothing in blocked slots. Soft rules: weekly
          target of 7 sessions, no stacking on one day, each person&apos;s usual slot. Test astronaut B is on Watch
          (sleep debt): one session fewer, mornings preferred, and a protected recovery block Wed 14:00.
        </p>
        <div className="flex flex-wrap gap-2">
          <Tag>A, B, C: simulated test astronauts</Tag>
          <Tag>D: simulated crew, scheduler only</Tag>
          <Tag tone="teal">Hard breaks must be 0</Tag>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={storm}
            onChange={(e) => setStorm(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          {STORM_LABEL}
        </label>
        <Button variant="ghost" onClick={() => setRunId((n) => n + 1)}>Re-run solvers</Button>
        <p className="text-xs text-muted basis-full">
          The storm is a replayed demo shelter call, not a live space-weather feed.
        </p>
      </div>

      <div aria-live="polite">
        {!week || !small ? (
          <Card className="mb-5">
            <p className="text-sm font-medium">Running… (solvers are working in this browser)</p>
          </Card>
        ) : (
          <>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-3">
              Solver comparison: full week, computed live {storm ? "with the storm shelter" : ""}
            </div>
            <div className="mb-5">
              <BenchmarkComparison week={week} />
            </div>

            {storm && data.normal && (
              <Card className="mb-5">
                <div className="font-semibold text-[15px] mb-2">Storm re-plan</div>
                <p className="text-sm text-secondary">
                  Before: the normal SA plan would break {countHardBreaks(data.normal.sa.assignments, STORM_SHELTER)} hard
                  rules and the simple plan {countHardBreaks(data.normal.simple.assignments, STORM_SHELTER)} inside the
                  shelter window. After re-planning: SA {week.sa.hardBreaks}, simple plan {week.simple.hardBreaks}.
                </p>
              </Card>
            )}

            <Card className="mb-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="font-semibold text-[15px]">Week plan</div>
                <div role="group" aria-label="Plan shown" className="flex gap-2">
                  {(["sa", "simple"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={plan === p}
                      onClick={() => setPlan(p)}
                      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold border ${
                        plan === p ? "bg-primary text-white border-primary" : "bg-white border-border"
                      }`}
                    >
                      {p === "sa" ? "Simulated annealing" : "Simple plan"}
                    </button>
                  ))}
                </div>
              </div>
              <OptimizationResults
                assignments={week[plan].assignments}
                blockedSlots={week.blockedSlots}
                caption={`${plan === "sa" ? "Simulated annealing" : "Simple plan"} week plan, by crew and day`}
              />
            </Card>

            <Card className="mb-5">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-[15px]">Small case: exact check</div>
                <Tag tone={small.match ? "teal" : "coral"}>{small.match ? "✓ SA matches exact" : "✗ SA differs"}</Tag>
              </div>
              <p className="text-sm text-secondary mt-2 mb-3">
                Obed&apos;s {small.variables}-variable test model (it checks the solvers, not a crew schedule). Brute
                force tries every combination.
              </p>
              <div className="space-y-1.5 text-sm">
                <Row label="Combinations checked" value={small.checked.toLocaleString()} />
                <Row label="Brute force optimum" value={`${small.exactEnergy} in ${small.exactMs.toFixed(1)} ms`} />
                <Row label="Simulated annealing" value={`${small.saEnergy} in ${small.saMs.toFixed(1)} ms`} />
              </div>
            </Card>

            <SolverPanel week={week} />
          </>
        )}
      </div>
    </>
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
