import { describe, expect, it } from "vitest";
import { countHardBreaks } from "@/lib/scheduler/simple";
import { RECOVERY_BLOCK, STORM_SHELTER, runSmallCase, runWeek, sessionsFor, weekGrid } from "./realSchedule";

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

  it("gives B a recovery slot, kept free of exercise, and one session fewer", () => {
    const bRow = weekGrid(normal.sa.assignments, normal.blockedSlots).find((r) => r.crew.id === "B")!;
    expect(bRow.cells[RECOVERY_BLOCK.day].recovery).toBe("14:00");
    for (const run of [normal.simple, normal.sa]) {
      expect(run.assignments.some((a) => a.crewId === "B" && a.day === RECOVERY_BLOCK.day && a.slot === RECOVERY_BLOCK.slot)).toBe(false);
      expect(sessionsFor(run.assignments, "B")).toBeLessThan(sessionsFor(run.assignments, "A"));
    }
  });

  it("brute force on the 16-variable case finds Obed's fixture optimum (-10) and SA matches it", () => {
    const small = runSmallCase();
    expect(small.checked).toBe(65_536);
    expect(small.exactEnergy).toBe(-10);
    expect(small.saEnergy).toBe(-10);
    expect(small.match).toBe(true);
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
