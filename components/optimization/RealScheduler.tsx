"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Tag } from "@/components/shared/Tag";
import type { Assignment } from "@/lib/types";
import { BenchmarkComparison } from "./BenchmarkComparison";
import { OptimizationResults } from "./OptimizationResults";
import { SolverPanel } from "./SolverPanel";
import { SA_SEED, STORM_SHELTER, runJob, slotTime, usualKept, type Job, type SmallCase, type WeekRuns } from "./realSchedule";

type Results = { id: number; normal?: WeekRuns; storm?: WeekRuns; small?: SmallCase };
const STORM_LABEL = "Solar storm: shelter Tue 10:00–14:00 (demo replay)";
const SHELTER_DAY = STORM_SHELTER[0].day;
const SOLVERS = [["sa", "Simulated annealing"], ["simple", "Simple plan"]] as const;
const inShelter = (a: Assignment) => STORM_SHELTER.some((b) => b.day === a.day && b.slot === a.slot);
const listSessions = (list: Assignment[]) =>
  list.length
    ? [...list].sort((a, b) => a.slot - b.slot).map((a) => `${a.crewId} ${slotTime(a.slot)} ${a.machine}`).join(", ")
    : "none";

export function RealScheduler() {
  const [runId, setRunId] = useState(0);
  const [storm, setStorm] = useState(false);
  const [plan, setPlan] = useState<"sa" | "simple">("sa");
  const [data, setData] = useState<Results>({ id: 0 });
  const [workerFailed, setWorkerFailed] = useState(false);
  const worker = useRef<Worker | null>(null);
  const sent = useRef(new Set<string>());

  // A result from an older run is dropped; the first result of a newer run starts a fresh set.
  const deliver = useCallback((id: number, job: Job, result: WeekRuns | SmallCase) =>
    setData((d) => (id < d.id ? d : { ...(d.id === id ? d : { id }), [job]: result })), []);

  // Solvers run in a background worker so the page stays usable; without one they fall back to the main thread.
  useEffect(() => {
    const jobs = sent.current;
    let w: Worker | null = null;
    try {
      w = new Worker(new URL("./scheduler.worker.js", import.meta.url), { type: "module" });
      w.onmessage = (e) => deliver(e.data.runId, e.data.job, e.data.result);
      w.onerror = () => {
        w?.terminate();
        worker.current = null;
        jobs.clear();
        setWorkerFailed(true);
      };
    } catch {
      w = null;
    }
    worker.current = w;
    return () => {
      w?.terminate();
      worker.current = null;
      jobs.clear();
    };
  }, [deliver]);

  const have: Results = data.id === runId ? data : { id: runId };
  const missing = (["normal", "small", ...(storm ? ["storm"] : [])] as Job[]).filter((j) => !have[j]).join(",");

  useEffect(() => {
    if (!missing) return;
    for (const job of missing.split(",") as Job[]) {
      const key = `${runId}:${job}`;
      if (sent.current.has(key)) continue;
      sent.current.add(key);
      if (worker.current) worker.current.postMessage({ runId, job });
      else setTimeout(() => deliver(runId, job, runJob(job)), 30); // after "Running…" has painted
    }
  }, [missing, runId, deliver, workerFailed]);

  const week = storm ? have.storm : have.normal;
  const small = have.small;
  const normal = have.normal;

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
            <p className="text-sm font-medium">Running… (the solvers are working in this browser; this takes a few seconds on a phone)</p>
          </Card>
        ) : (
          <>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-3">
              Solver comparison: full week, computed live {storm ? "with the storm shelter" : ""}
            </div>
            <div className="mb-5">
              <BenchmarkComparison week={week} />
            </div>

            {storm && normal && (
              <Card className="mb-5">
                <div className="font-semibold text-[15px] mb-3">Storm re-plan</div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <StormStep title="Before: sessions in Tue 10:00–14:00">
                    {SOLVERS.map(([key, name]) => (
                      <span key={key} className="block">
                        {name}: {listSessions(normal[key].assignments.filter(inShelter))}
                      </span>
                    ))}
                  </StormStep>
                  <StormStep title="During: Tue 10:00–14:00">
                    All 4 crew in the shelter. Sessions left in this window after re-planning:{" "}
                    {SOLVERS.map(([key, name]) => `${name} ${week[key].assignments.filter(inShelter).length}`).join(", ")}.
                  </StormStep>
                  <StormStep title="After: Tuesday in the re-plan">
                    {SOLVERS.map(([key, name]) => (
                      <span key={key} className="block">
                        {name}: {listSessions(week[key].assignments.filter((a) => a.day === SHELTER_DAY))}
                        {" "}({week[key].hardBreaks} hard breaks in the week)
                      </span>
                    ))}
                  </StormStep>
                </div>
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
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="font-semibold text-[15px]">Small case: exact check</div>
                <Tag tone={small.match ? "teal" : "coral"}>
                  {small.match ? "✓ SA found the best plan" : `✗ SA missed the best plan by ${small.gap.toFixed(2)}`}
                </Tag>
              </div>
              <p className="text-sm text-secondary mt-2 mb-3">
                {small.variables} real choices cut from this week&apos;s model: crew A and B, Monday, the four 1-hour
                slots from 06:00 to 10:00, both machines. Every other choice in the week is switched off, so this
                checks the solvers; it is not a plan to follow. Brute force tries every on/off combination, so its
                answer is the true best. Scores are high because the empty rest of the week counts as missed weekly
                targets.
              </p>
              <div className="space-y-1.5 text-sm">
                <Row label="Combinations checked" value={small.checked.toLocaleString()} />
                <Row label="Brute force (true best)" value={`${small.exactEnergy.toFixed(2)} in ${small.exactMs.toFixed(1)} ms`} />
                <Row label={`Simulated annealing (seed ${SA_SEED})`} value={`${small.saEnergy.toFixed(2)} in ${small.saMs.toFixed(1)} ms`} />
                <Row label="Usual slot kept" value={`brute force ${usualKept(small.exactPlan)}, SA ${usualKept(small.saPlan)}`} />
                <Row label="SA with seeds 1–10" value={`${small.otherSeedsHit} of 10 found the best plan`} />
              </div>
              {!small.match && (
                <p className="text-sm text-secondary mt-3">
                  Simulated annealing is a guided random search, so it can stop just short of the best answer. Brute
                  force cannot miss, but it only works on tiny cases like this one: the full week has 2^{week.variables}{" "}
                  combinations.
                </p>
              )}
            </Card>

            <SolverPanel week={week} />
          </>
        )}
      </div>
    </>
  );
}

function StormStep({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">{title}</div>
      <p className="text-secondary">{children}</p>
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
