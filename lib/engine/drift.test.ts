import { describe, expect, it } from "vitest";
import type { PhaseRow, Tables, VariationRow } from "@/lib/data/tables";
import type { Indicator, Phase, Reading } from "@/lib/types";
import { defaultTables, regionStatus } from "./index";

const SRC = "test fixture";
const A = "A";
let seq = 0;
const mk = (indicator: Indicator, missionDay: number, value: number, phase: Phase = missionDay < 0 ? "preflight" : "cruise"): Reading => ({
  id: `${indicator}-${missionDay}-${seq++}`, astronautId: A, indicator, value, unit: "u", takenAt: "", missionDay, phase, source: "simulated",
});
const spread = [90, 95, 100, 105, 110]; // mean 100, sample SD √62.5
const band = 2.132 * Math.sqrt(62.5) * Math.sqrt(6 / 5); // one-sided own-SD band, n = 5, % of 100
const own = (indicator: Indicator, badDirection: VariationRow["badDirection"]): VariationRow =>
  ({ method: "ownSD", indicator, badDirection, directionSource: SRC, source: SRC });
const brain = ["sleepHours", "fatigueSP", "moodPHQ2", "pvtLapses"] as const;
const t = (phases: PhaseRow[]): Tables => ({
  variation: [own("sleepHours", "down"), own("fatigueSP", "up"), own("moodPHQ2", "up"), own("pvtLapses", "up")],
  ranges: [], limits: [], phases,
});
const sleepRow = (maxChangePct?: number): PhaseRow => ({ phase: "cruise", indicator: "sleepHours", expected: "down", maxChangePct, note: SRC, source: SRC });

// Sleep falls by `sleepFrac` of its band; fatigue and mood rise 0.6 of theirs; PVT flat.
const history = (sleepFrac: number): Reading[] => brain.flatMap((i) => [
  ...spread.map((v, d) => mk(i, -30 + d, v)),
  mk(i, 9, i === "sleepHours" ? 100 - sleepFrac * band : i === "pvtLapses" ? 100 : 100 + 0.6 * band),
]);
const cruise = { phase: "cruise" as const, missionDay: 9 };

describe("combined drift: only a sized expected change is exempt", () => {
  it("a sleep fall the phase row expects with no size still counts as drift", () => {
    const r = regionStatus("brainSleepMood", A, history(0.6), cruise, t([sleepRow()]));
    expect(r.status).toBe("watch");
    expect(r.reasons.join(" ")).toMatch(/Combined drift: 3 readings.*sleep -/);
  });

  it("the default cruise table (sleep 'expected down', no size) does not hide a sleep fall", () => {
    const real: Tables = { ...defaultTables, variation: t([]).variation };
    expect(regionStatus("brainSleepMood", A, history(0.6), cruise, real).status).toBe("watch");
  });

  it("a fall within the row's size is exempt", () => {
    const r = regionStatus("brainSleepMood", A, history(0.6), cruise, t([sleepRow(0.6 * band + 1)]));
    expect(r.status).toBe("nominal");
  });

  it("a fall bigger than the row's size counts", () => {
    const r = regionStatus("brainSleepMood", A, history(0.6), cruise, t([sleepRow(0.6 * band - 1)]));
    expect(r.status).toBe("watch");
  });
});
