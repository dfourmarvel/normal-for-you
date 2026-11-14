import { describe, expect, it } from "vitest";
import type { LimitRow, Tables, VariationRow } from "@/lib/data/tables";
import type { Indicator, Phase, Reading } from "@/lib/types";
import { evaluate, rcvLogNormal, regionStatus, statusFor, tFor } from "./index";

const SRC = "test fixture";
const A = "A";
let seq = 0;
const mk = (indicator: Indicator, missionDay: number, value: number, phase?: Phase): Reading => ({
  id: `${indicator}-${missionDay}-${seq++}`, astronautId: A, indicator, value, unit: "u", takenAt: "",
  missionDay, phase: phase ?? (missionDay < 0 ? "preflight" : "cruise"), source: "simulated",
});
const pre = (indicator: Indicator, value = 100, n = 3): Reading[] => Array.from({ length: n }, (_, i) => mk(indicator, -30 + i, value));
const preVals = (indicator: Indicator, values: number[]): Reading[] => values.map((v, i) => mk(indicator, -30 + i, v));
const population = (indicator: Indicator, badDirection: VariationRow["badDirection"]): VariationRow =>
  ({ method: "populationCV", indicator, cviPct: 10.9, cvaPct: 5.45, badDirection, directionSource: SRC, status: "unverified", source: SRC });
const own = (indicator: Indicator, badDirection: VariationRow["badDirection"]): VariationRow =>
  ({ method: "ownSD", indicator, badDirection, directionSource: SRC, source: SRC });
const tables = (t: Partial<Tables> = {}): Tables => ({ variation: [], ranges: [], limits: [], phases: [], ...t });
const cruise = { phase: "cruise" as const, missionDay: 10 };
const lymphTables = tables({ variation: [population("lymphAbs", "down")] });

describe("fix 1: escalation uses the reading immediately before, same-day readings included", () => {
  it("day 9 bad, day 10 recovery then bad again: the second day-10 reading is watch", () => {
    const h = [...pre("lymphAbs"), mk("lymphAbs", 9, 60), mk("lymphAbs", 10, 100), mk("lymphAbs", 10, 60)];
    expect(evaluate(h[5], h, cruise, lymphTables).answers[1].status).toBe("watch");
  });

  it("two bad readings on the same day: the second is act", () => {
    const h = [...pre("lymphAbs"), mk("lymphAbs", 10, 60), mk("lymphAbs", 10, 60)];
    expect(evaluate(h[3], h, cruise, lymphTables).answers[1].status).toBe("watch");
    expect(evaluate(h[4], h, cruise, lymphTables).answers[1].status).toBe("act");
  });

  it("takenAt orders same-day readings before position in history", () => {
    const at = (r: Reading, t: string): Reading => ({ ...r, takenAt: `2026-11-14T${t}:00Z` });
    const late = at(mk("lymphAbs", 10, 100), "18:00");
    const early = at(mk("lymphAbs", 10, 60), "08:00");
    const noon = at(mk("lymphAbs", 10, 60), "12:00");
    const h = [...pre("lymphAbs"), late, early, noon];
    expect(evaluate(noon, h, cruise, lymphTables).answers[1].status).toBe("act");
    expect(evaluate(late, h, cruise, lymphTables).answers[1].status).toBe("nominal");
  });
});

describe("fix 2: edges as the guideline words them, every limit row checked", () => {
  const people = (value: number, t: Tables, indicator: Indicator = "hb") => evaluate(mk(indicator, 10, value), [], cruise, t).answers[0].status;
  const edges = (inclusive: boolean) => tables({ ranges: [{
    indicator: "hb", low: { value: 10, inclusive }, high: { value: 20, inclusive },
    critLow: { value: 5, inclusive }, critHigh: { value: 30, inclusive }, unit: "u", label: "test", source: SRC,
  }] });

  it("an inclusive normal edge is normal at the edge value; an exclusive one is not", () => {
    expect([people(10, edges(true)), people(20, edges(true))]).toEqual(["nominal", "nominal"]);
    expect([people(10, edges(false)), people(20, edges(false))]).toEqual(["watch", "watch"]);
  });

  it("an inclusive act edge is act at the edge value; an exclusive one is watch", () => {
    expect([people(5, edges(true)), people(30, edges(true))]).toEqual(["act", "act"]);
    expect([people(5, edges(false)), people(30, edges(false))]).toEqual(["watch", "watch"]);
    expect([people(4.9, edges(false)), people(30.1, edges(false))]).toEqual(["act", "act"]);
  });

  it("breachedWhen covers above, atOrAbove, below and atOrBelow", () => {
    const lim = (breachedWhen: LimitRow["breachedWhen"]): Tables =>
      tables({ limits: [{ indicator: "co2", limit: 3, breachedWhen, unit: "u", requirementNo: "T", label: "t", source: SRC }] });
    expect([people(3, lim("above"), "co2"), people(3.1, lim("above"), "co2")]).toEqual(["nominal", "act"]);
    expect([people(2.9, lim("atOrAbove"), "co2"), people(3, lim("atOrAbove"), "co2")]).toEqual(["nominal", "act"]);
    expect([people(3, lim("below"), "co2"), people(2.9, lim("below"), "co2")]).toEqual(["nominal", "act"]);
    expect([people(3.1, lim("atOrBelow"), "co2"), people(3, lim("atOrBelow"), "co2")]).toEqual(["nominal", "act"]);
  });

  it("a breach of any limit row for the indicator is act, not only the first row", () => {
    const row = (limit: number, requirementNo: string): LimitRow =>
      ({ indicator: "co2", limit, breachedWhen: "above", unit: "mmHg", requirementNo, label: requirementNo, source: SRC });
    const r = mk("co2", 10, 4);
    const v = evaluate(r, [r], cruise, tables({ limits: [row(5, "LOOSE"), row(3, "TIGHT")] }));
    expect(v.answers[0]).toMatchObject({ status: "act", compareTo: "TIGHT" });
    expect(v.action.saw).toContain("TIGHT");
  });
});

describe("fix 4: own pre-flight SD band (Coskun 2022 model 2)", () => {
  const spread = [90, 95, 100, 105, 110]; // mean 100, sample SD √62.5
  const halfOneSided = 2.132 * Math.sqrt(62.5) * Math.sqrt(6 / 5);

  it("uses the standard t table, next lower df between entries, Z above df 30", () => {
    expect([tFor(4, "down"), tFor(4, "both")]).toEqual([2.132, 2.776]);
    expect([tFor(11, "up"), tFor(11, "both")]).toEqual([1.812, 2.228]);
    expect([tFor(30, "down"), tFor(31, "down"), tFor(91, "both")]).toEqual([1.697, 1.697, 2.042]);
  });

  it("band = mean ± t × s × √((n+1)/n), one-sided for a named bad direction", () => {
    const t = tables({ variation: [own("spo2", "down")] });
    const h = [...preVals("spo2", spread), mk("spo2", 10, 85)];
    const a = evaluate(h[5], h, cruise, t).answers[1];
    expect(a.changePct).toBeCloseTo(-15, 9);
    expect(a.rcvPct).toBeCloseTo(-halfOneSided, 9);
    expect(a.status).toBe("nominal");
    expect(a.compareTo).toBe("your band 82–118"); // 100 ± 18.46, whole numbers at a base ≥ 100
  });

  it("5 pre-flight temperatures give a two-sided band in °C", () => {
    const t = tables({ variation: [own("tempC", "both")] });
    const temps = [36.4, 36.5, 36.6, 36.7, 36.8];
    const half = 2.776 * Math.sqrt(0.025) * Math.sqrt(6 / 5); // about 0.48 °C
    const h = [...preVals("tempC", temps), mk("tempC", 10, 37.2), mk("tempC", 11, 36.9)];
    const hot = evaluate(h[5], h, cruise, t).answers[1];
    expect(hot.rcvPct).toBeCloseTo((100 * half) / 36.6, 9);
    expect(hot.compareTo).toBe("your band 36.1–37.1");
    expect(hot.status).toBe("watch");
    expect(evaluate(h[6], h, { ...cruise, missionDay: 11 }, t).answers[1].status).toBe("nominal");
  });

  it("below the band once is watch, twice in a row in the bad direction is act", () => {
    const t = tables({ variation: [own("spo2", "down")] });
    const h = [...preVals("spo2", spread), mk("spo2", 10, 75), mk("spo2", 11, 75)];
    expect(evaluate(h[5], h, cruise, t).answers[1].status).toBe("watch");
    expect(evaluate(h[6], h, { ...cruise, missionDay: 11 }, t).answers[1].status).toBe("act");
  });

  it("needs 5 pre-flight readings and some spread", () => {
    const t = tables({ variation: [own("tempC", "both")] });
    const four = [...preVals("tempC", [36.5, 36.6, 36.7, 36.8]), mk("tempC", 10, 36.6)];
    expect(evaluate(four[4], four, cruise, t).answers[1])
      .toMatchObject({ status: "notMeasured", compareTo: "baseline too thin (4 pre-flight readings, need 5)" });
    const flat = [...preVals("tempC", [36.6, 36.6, 36.6, 36.6, 36.6]), mk("tempC", 10, 36.6)];
    expect(evaluate(flat[5], flat, cruise, t).answers[1])
      .toMatchObject({ status: "notMeasured", compareTo: "baseline has no spread; need varied pre-flight readings" });
  });

  it("combined drift in brainSleepMood works on own-SD bands", () => {
    const members = ["sleepHours", "fatigueSP", "moodPHQ2", "pvtLapses"] as const;
    const t = tables({ variation: [own("sleepHours", "down"), own("fatigueSP", "up"), own("moodPHQ2", "up"), own("pvtLapses", "up")] });
    const drift = 0.6 * halfOneSided;
    const today: Record<(typeof members)[number], number> = { sleepHours: 100 - drift, fatigueSP: 100 + drift, moodPHQ2: 100 + drift, pvtLapses: 100 };
    const h = members.flatMap((i) => [...preVals(i, spread), mk(i, 9, today[i])]);
    for (const i of members) expect(statusFor(A, i, h, cruise, t).status).toBe("nominal");
    const r = regionStatus("brainSleepMood", A, h, cruise, t);
    expect(r.status).toBe("watch");
    expect(r.reasons.join(" ")).toContain("Combined drift: 3 readings moved the wrong way this week");
  });
});

describe("fix 5: an expected direction with no size cannot cancel a warning", () => {
  it("today says expected, but overall stays watch and the card is not 'No action'", () => {
    const range = { indicator: "lymphAbs" as const, low: { value: 50, inclusive: true }, unit: "u", label: "lab range", source: SRC };
    const h = [...pre("lymphAbs"), mk("lymphAbs", 10, 70)];
    const t = tables({ variation: [population("lymphAbs", "down")], ranges: [range],
      phases: [{ phase: "cruise", indicator: "lymphAbs", expected: "down", note: SRC, source: SRC }] });
    const v = evaluate(h[3], h, cruise, t);
    expect(v.answers[2]).toMatchObject({ status: "nominal", compareTo: "expected for cruise" });
    expect(v.overall).toBe("watch");
    expect(v.action.kind).toBe("watchDrift");
    expect(v.action.doNow).not.toBe("No action.");
  });
});

describe("fix 6: combined drift ignores a change the phase table expects", () => {
  const heart = ["restingHR", "sbp", "dbp", "spo2"] as const;
  const t = tables({
    variation: heart.map((i) => population(i, "both")),
    phases: (["restingHR", "sbp", "dbp"] as const).map((indicator) =>
      ({ phase: "first72h" as const, indicator, expected: "down" as const, note: SRC, source: SRC })),
  });
  const fell = 100 * (1 + (0.6 * rcvLogNormal(10.9, 5.45, 1.96).downPct) / 100);
  const h = heart.flatMap((i) => [...pre(i), mk(i, 1, i === "spo2" ? 100 : fell, "first72h")]);

  it("three expected first-72h falls are not drift", () => {
    expect(regionStatus("heart", A, h, { phase: "first72h", missionDay: 1 }, t).status).toBe("nominal");
  });

  it("the same falls in a phase with no expectation are drift", () => {
    expect(regionStatus("heart", A, h, { phase: "cruise", missionDay: 1 }, t).status).toBe("watch");
  });
});

describe("fix 7: kept behaviour", () => {
  it("an opposite-direction change inside the RCV stays nominal (noise)", () => {
    const h = [...pre("lymphAbs"), mk("lymphAbs", 10, 90)];
    const t = tables({ variation: [population("lymphAbs", "down")],
      phases: [{ phase: "cruise", indicator: "lymphAbs", expected: "up", note: SRC, source: SRC }] });
    const v = evaluate(h[3], h, cruise, t);
    expect(v.answers[2]).toMatchObject({ status: "nominal", compareTo: "no clear change for cruise" });
    expect(v.overall).toBe("nominal");
  });

  it("drift uses the last reading of the window, including the later of two same-day readings", () => {
    const h = [...pre("lymphAbs"), mk("lymphAbs", 9, 60), mk("lymphAbs", 9, 100)];
    const r = statusFor(A, "lymphAbs", h, cruise, lymphTables);
    expect(r.verdict?.reading).toBe(h[4]);
    expect(r.status).toBe("nominal");
  });
});

describe("review fixes after the second verification", () => {
  it("a copy of a logged reading is not its own previous reading (no false act)", () => {
    const bad = mk("lymphAbs", 10, 60);
    const h = [...pre("lymphAbs"), bad];
    expect(evaluate({ ...bad }, h, cruise, lymphTables).answers[1].status).toBe("watch");
  });

  it("above 30 df the df-30 t row is used, not Z", () => {
    const preflight = Array.from({ length: 32 }, (_, i) => mk("sleepHours", -60 + i, i % 2 ? 7.5 : 6.5));
    expect(preflight.every((r) => r.phase === "preflight")).toBe(true);
    const h = [...preflight, mk("sleepHours", 10, 6.14)];
    const t = tables({ variation: [own("sleepHours", "down")] });
    expect(evaluate(h[32], h, cruise, t).answers[1].status).toBe("nominal");
  });
});
