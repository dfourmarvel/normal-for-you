import { describe, expect, it } from "vitest";
import { buildSchedulerQubo, evaluateQubo } from "@/lib/scheduler/qubo";
import { solveSimulatedAnnealing } from "@/lib/scheduler/sa";
import { countHardBreaks } from "@/lib/scheduler/simple";
import {
  OTHER_SEEDS, RECOVERY_BLOCK, SA_ITERATIONS, STORM_SHELTER, runSmallCase, runWeek, sessionsFor, sliceQubo, usualKept, weekGrid, weekInput,
} from "./realSchedule";

const normal = runWeek(false);
const storm = runWeek(true);

describe("real scheduler runs on the Optimization screen", () => {
  it("simple plan and SA both have 0 hard breaks on the full week", () => {
    expect(normal.variables).toBe(4 * 7 * 16 * 2);
    expect(normal.simple.hardBreaks).toBe(0);
    expect(normal.sa.hardBreaks).toBe(0);
    expect(normal.simple.assignments.length).toBeGreaterThan(0);
    expect(normal.sa.assignments.length).toBeGreaterThan(0);
  });

  it("pins the simple plan's penalty on the normal week", () => {
    expect(normal.simple.penalty).toBe(-25.5);
  });

  it("gives B a recovery slot, kept free of exercise, and one session fewer", () => {
    const bRow = weekGrid(normal.sa.assignments, normal.blockedSlots).find((r) => r.crew.id === "B")!;
    expect(bRow.cells[RECOVERY_BLOCK.day].recovery).toBe("14:00");
    for (const run of [normal.simple, normal.sa]) {
      expect(run.assignments.some((a) => a.crewId === "B" && a.day === RECOVERY_BLOCK.day && a.slot === RECOVERY_BLOCK.slot)).toBe(false);
      expect(sessionsFor(run.assignments, "B")).toBeLessThan(sessionsFor(run.assignments, "A"));
    }
  });

  it("storm re-plan keeps every session out of the Tue 10:00-14:00 shelter", () => {
    for (const run of [storm.simple, storm.sa]) {
      expect(run.hardBreaks).toBe(0);
      expect(countHardBreaks(run.assignments, STORM_SHELTER)).toBe(0);
    }
    // The pre-storm plan does use that window, so the re-plan had something to move.
    expect(countHardBreaks(normal.simple.assignments, STORM_SHELTER)).toBeGreaterThan(0);
  });
});

describe("16-variable slice of the real week (A and B, Mon 06:00-09:00, both machines)", () => {
  const full = buildSchedulerQubo(weekInput(false));
  const slice = sliceQubo(full);
  const small = runSmallCase();
  const embed = (bits: Uint8Array) => {
    const out = new Uint8Array(full.variables.length);
    slice.indices.forEach((fullIndex, k) => { out[fullIndex] = bits[k]; });
    return out;
  };
  const maskBits = (mask: number) => Uint8Array.from({ length: 16 }, (_, k) => (mask >>> k) & 1);

  it("keeps exactly the 16 real choices for A and B in the first four Monday slots", () => {
    expect(slice.model.variables).toHaveLength(16);
    for (const v of slice.model.variables) {
      expect(["A", "B"]).toContain(v.crewId);
      expect(v.day).toBe(0);
      expect(v.slot).toBeLessThan(4);
    }
    expect(new Set(slice.model.variables.map((v) => v.key)).size).toBe(16);
  });

  it("gives the same energy as the full week model with every other choice switched off", () => {
    const masks = [0, 1, 0b1010, 0xffff, 0x5a5a, 0x0f0f, 0xa5c3, 0x1234, 0xbeef];
    for (const mask of masks) {
      expect(evaluateQubo(slice.model, maskBits(mask))).toBe(evaluateQubo(full, embed(maskBits(mask))));
    }
  });

  it("brute force checks every one of the 65,536 combinations", () => {
    expect(small.variables).toBe(16);
    expect(small.checked).toBe(65_536);
    let best = Infinity;
    for (let mask = 0; mask < 65_536; mask++) best = Math.min(best, evaluateQubo(slice.model, maskBits(mask)));
    expect(small.exactEnergy).toBe(best);
    expect(evaluateQubo(full, embed(Uint8Array.from(small.exactBits)))).toBe(best);
  });

  it("reports SA honestly against the exact optimum", () => {
    expect(small.saEnergy).toBeGreaterThanOrEqual(small.exactEnergy);
    expect(small.gap).toBe(small.saEnergy - small.exactEnergy);
    expect(small.match).toBe(small.gap === 0);
    // Measured: seed 2026 misses the optimum on this slice by 1.5 (B on the treadmill, not the preferred bike, at 07:00).
    expect(small.exactEnergy).toBe(full.offset - 844.5);
    expect(small.gap).toBe(1.5);
    expect(usualKept(small.exactPlan) - usualKept(small.saPlan)).toBe(1);
    expect(small.otherSeedsHit).toBe(4);
  });
});

describe("SA seed spread stated on the page", () => {
  it.each([false, true])("storm=%s: seeds 1-5 score inside the stated range", (storm) => {
    const model = buildSchedulerQubo(weekInput(storm));
    const scores = OTHER_SEEDS.seeds.map((seed) => solveSimulatedAnnealing(model, { seed, iterations: SA_ITERATIONS }).energy);
    expect([Math.min(...scores), Math.max(...scores)]).toEqual(OTHER_SEEDS[storm ? "storm" : "normal"]);
  }, 30_000);
});
