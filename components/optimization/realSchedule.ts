import type { Assignment, BlockedSlot, Machine } from "@/lib/types";
import { TEST_CREW } from "@/lib/testCrew";
import { buildSchedulerQubo, evaluateQubo, type QuboInput, type QuboModel } from "@/lib/scheduler/qubo";
import { buildSimpleSchedule, countHardBreaks } from "@/lib/scheduler/simple";
import { solveSimulatedAnnealing } from "@/lib/scheduler/sa";
import { solveSimulatedBifurcation } from "@/lib/scheduler/sb";
import { assignmentsFromBits, solveBruteForce } from "@/lib/scheduler/brute-force";
import { shelterBlocks } from "@/lib/environment/shelter";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Slot 0 = 06:00 wake; slot 15 = 21:00, the reserved last hour before 22:00 sleep.
const WAKE_HOUR = 6;
export const slotTime = (slot: number) => `${String(WAKE_HOUR + slot).padStart(2, "0")}:00`;

export const SA_SEED = 2026;
export const SA_ITERATIONS = 30_000; // sa.ts default, stated so the page can show it

export const SCHED_CREW = [
  ...TEST_CREW.map((a) => ({ id: a.id, name: `${a.name} (simulated)` })),
  { id: "D", name: "Simulated crew D (scheduler only)" },
];
const CREW_IDS = SCHED_CREW.map((c) => c.id);

// B is on Watch (sleep debt): one session fewer, morning preference, and a protected recovery block.
const WEEKLY_TARGETS: Record<string, number> = { A: 7, B: 6, C: 7, D: 7 };
const USUAL: Record<string, { slot: number; machine: Machine }> = {
  A: { slot: 4, machine: "treadmill" }, // 10:00
  B: { slot: 1, machine: "bike" }, // 07:00
  C: { slot: 6, machine: "bike" }, // 12:00
  D: { slot: 9, machine: "treadmill" }, // 15:00
};
export const RECOVERY_BLOCK: BlockedSlot = { crewId: "B", day: 2, slot: 8, reason: "sleep" }; // Wed 14:00
// Demo replay: shelter Tue 10:00–14:00 for all crew.
export const STORM_SHELTER: BlockedSlot[] = shelterBlocks(1, [4, 5, 6, 7]);

export function weekInput(storm: boolean): QuboInput {
  const preferredAssignments: Assignment[] = CREW_IDS.flatMap((crewId) =>
    DAYS.map((_, day) => ({ crewId, day, ...USUAL[crewId] })));
  return {
    crewIds: CREW_IDS,
    blockedSlots: [RECOVERY_BLOCK, ...(storm ? STORM_SHELTER : [])],
    weeklyTargets: WEEKLY_TARGETS,
    preferredAssignments,
    recoveryCrewIds: ["B"],
  };
}

export type Run = { assignments: Assignment[]; penalty: number; hardBreaks: number; ms: number };
export type WeekRuns = {
  variables: number;
  terms: number;
  buildMs: number;
  simple: Run;
  sa: Run;
  sb: Run;
  blockedSlots: BlockedSlot[];
  otherSeedRange: number[];
};

function bitsOf(model: QuboModel, assignments: Assignment[]) {
  const index = new Map(model.variables.map((v, i) => [v.key, i]));
  const bits = new Uint8Array(model.variables.length);
  for (const a of assignments) {
    const i = index.get(`${a.crewId}:${a.day}:${a.slot}:${a.machine}`);
    if (i !== undefined) bits[i] = 1;
  }
  return bits;
}

const timed = <T,>(fn: () => T): [T, number] => {
  const t = performance.now();
  const value = fn();
  return [value, performance.now() - t];
};

export function runWeek(storm: boolean): WeekRuns {
  const input = weekInput(storm);
  const [model, buildMs] = timed(() => buildSchedulerQubo(input));

  const [simplePlan, simpleMs] = timed(() => buildSimpleSchedule({
    ...input,
    preferredSlots: input.preferredAssignments,
  }));
  // simple.ts reports penalty 0; score its plan on the same QUBO so the two solvers compare like for like.
  const simple: Run = {
    assignments: simplePlan.assignments,
    penalty: evaluateQubo(model, bitsOf(model, simplePlan.assignments)),
    hardBreaks: countHardBreaks(simplePlan.assignments, input.blockedSlots),
    ms: simpleMs,
  };

  const [annealed, saMs] = timed(() => solveSimulatedAnnealing(model, { seed: SA_SEED, iterations: SA_ITERATIONS }));
  const saAssignments = assignmentsFromBits(model, annealed.bits);
  const sa: Run = {
    assignments: saAssignments,
    penalty: annealed.energy,
    hardBreaks: countHardBreaks(saAssignments, input.blockedSlots),
    ms: saMs,
  };

  const [bifurcated, sbMs] = timed(() => solveSimulatedBifurcation(model, { seed: SA_SEED }));
  const sbAssignments = assignmentsFromBits(model, bifurcated.bits);
  const sb: Run = {
    assignments: sbAssignments,
    penalty: bifurcated.energy,
    hardBreaks: countHardBreaks(sbAssignments, input.blockedSlots),
    ms: sbMs,
  };

  return {
    variables: model.variables.length,
    terms: model.quadratic.length,
    buildMs,
    simple,
    sa,
    sb,
    blockedSlots: input.blockedSlots,
    otherSeedRange: OTHER_SEEDS[storm ? "storm" : "normal"],
  };
}

/** Crew A and B, Monday 06:00–09:00, both machines: 2 × 4 × 2 = 16 real choices from the week model. */
export const SLICE = { crewIds: ["A", "B"], day: 0, slots: 4 };

export function sliceQubo(full: QuboModel): { indices: number[]; model: QuboModel } {
  const indices = full.variables.flatMap((v, i) =>
    SLICE.crewIds.includes(v.crewId) && v.day === SLICE.day && v.slot < SLICE.slots ? [i] : []);
  const local = new Map(indices.map((fullIndex, k) => [fullIndex, k]));
  // Every other choice is fixed at 0, so its own term and every pair touching it drop out; the constant stays.
  const quadratic = full.quadratic.flatMap((t) => {
    const i = local.get(t.i);
    const j = local.get(t.j);
    return i === undefined || j === undefined ? [] : [{ i, j, weight: t.weight }];
  });
  return {
    indices,
    model: {
      variables: indices.map((i) => full.variables[i]),
      linear: indices.map((i) => full.linear[i]),
      quadratic,
      offset: full.offset,
    },
  };
}

// Measured with SA_ITERATIONS steps; realSchedule.test.ts re-runs these seeds and fails if the range drifts.
export const OTHER_SEEDS = { seeds: [1, 2, 3, 4, 5], normal: [1.5, 5], storm: [0.75, 14.5] };

export type SmallCase = {
  variables: number;
  checked: number;
  exactEnergy: number;
  exactMs: number;
  exactBits: number[];
  exactPlan: Assignment[];
  saEnergy: number;
  saMs: number;
  saPlan: Assignment[];
  gap: number;
  match: boolean;
  otherSeedsHit: number;
};

/** Sessions that land on the person's usual slot and machine (the preference reward in the QUBO). */
export const usualKept = (plan: Assignment[]) =>
  plan.filter((a) => USUAL[a.crewId]?.slot === a.slot && USUAL[a.crewId]?.machine === a.machine).length;

const SLICE_OTHER_SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Brute force and SA on the same 16-variable slice of the normal week, so SA can be checked against the true best. */
export function runSmallCase(): SmallCase {
  const { model } = sliceQubo(buildSchedulerQubo(weekInput(false)));
  const [exact, exactMs] = timed(() => solveBruteForce(model));
  const [annealed, saMs] = timed(() => solveSimulatedAnnealing(model, { seed: SA_SEED, iterations: SA_ITERATIONS }));
  const gap = annealed.energy - exact.energy;
  return {
    variables: model.variables.length,
    checked: exact.checked,
    exactEnergy: exact.energy,
    exactMs,
    exactBits: [...exact.bits],
    exactPlan: assignmentsFromBits(model, exact.bits),
    saEnergy: annealed.energy,
    saMs,
    saPlan: assignmentsFromBits(model, annealed.bits),
    gap,
    match: gap === 0,
    otherSeedsHit: SLICE_OTHER_SEEDS.filter((seed) =>
      solveSimulatedAnnealing(model, { seed, iterations: SA_ITERATIONS }).energy === exact.energy).length,
  };
}

export type Job = "normal" | "storm" | "small";
export const runJob = (job: Job) => (job === "small" ? runSmallCase() : runWeek(job === "storm"));

export type Cell = { sessions: { time: string; machine: Machine }[]; recovery: string | null; shelter: string | null };

/** One row per crew member, one cell per day; recovery/shelter carry their clock time for display. */
export function weekGrid(assignments: Assignment[], blockedSlots: BlockedSlot[]) {
  return SCHED_CREW.map((crew) => ({
    crew,
    cells: DAYS.map((_, day): Cell => {
      const mine = blockedSlots.filter((b) => b.day === day && (b.crewId === "all" || b.crewId === crew.id));
      const recovery = mine.find((b) => b.reason === "sleep");
      const shelter = mine.filter((b) => b.reason === "shelter").map((b) => b.slot);
      return {
        sessions: assignments
          .filter((a) => a.crewId === crew.id && a.day === day)
          .sort((a, b) => a.slot - b.slot)
          .map((a) => ({ time: slotTime(a.slot), machine: a.machine })),
        recovery: recovery ? slotTime(recovery.slot) : null,
        shelter: shelter.length ? `${slotTime(Math.min(...shelter))}–${slotTime(Math.max(...shelter) + 1)}` : null,
      };
    }),
  }));
}

export const sessionsFor = (assignments: Assignment[], crewId: string) =>
  assignments.filter((a) => a.crewId === crewId).length;