import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { defaultTables, regionStatus, statusFor } from "@/lib/engine";
import { peopleAnswer } from "@/lib/engine/answers";
import { REGION_MEMBERS } from "@/lib/engine/regions";
import type { Indicator, Reading, Region, Status } from "@/lib/types";
import {
  CREW_INDICATORS, DETECTION_SUMMARY as S, MISSION_DAYS, NOISE, phaseForDay, SIMULATED_LABEL, simulateAstronaut,
  TEST_BUDDY_CHECKS, TEST_CREW, TEST_READINGS, TEST_STORIES,
} from "./testCrew";

const REGIONS = Object.keys(REGION_MEMBERS) as Region[];
const BRAIN = REGION_MEMBERS.brainSleepMood;
const mine = (id: string) => TEST_READINGS.filter((r) => r.astronautId === id);
const HIST = { A: mine("A"), B: mine("B"), C: mine("C") };
const ctx = (day: number) => ({ phase: phaseForDay(day), missionDay: day });
const region = (id: keyof typeof HIST, r: Region, day: number) => regionStatus(r, id, HIST[id], ctx(day), defaultTables);
const status = (id: keyof typeof HIST, i: Indicator, day: number) => statusFor(id, i, HIST[id], ctx(day), defaultTables);
const days = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const flagged = (s: Status) => s === "watch" || s === "act";
const count = (ds: number[], ok: (d: number) => boolean) => ds.filter(ok).length;

// Brain/sleep status for days 0..to, index = day (days 0–3 left out). Fast path for many seeds: the engine reads only the
// latest reading in the last 7 days, the one before it (cadence ≤ 3 days) and pre-flight values, so a 10-day window
// plus pre-flight gives the same answer; the "same as the full history" test below checks that on the fixed seeds.
function brainStatuses(id: string, readings: readonly Reading[], to: number, windowed = true): Status[] {
  const own = readings.filter((r) => BRAIN.includes(r.indicator));
  const pre = own.filter((r) => r.phase === "preflight");
  const flight = own.filter((r) => r.phase !== "preflight");
  const out: Status[] = [];
  for (const d of days(4, to)) {
    const h = windowed ? [...pre, ...flight.filter((r) => r.missionDay > d - 10 && r.missionDay <= d)] : readings;
    out[d] = regionStatus("brainSleepMood", id, h, ctx(d), defaultTables).status;
  }
  return out;
}
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2;
};

const FULL = { B: brainStatuses("B", HIST.B, 60, false), C: brainStatuses("C", HIST.C, 172, false) };

describe("test crew data", () => {
  it("three simulated astronauts, every reading marked simulated, labels and stories ready for screens", () => {
    expect(TEST_CREW).toEqual([
      { id: "A", name: "Test astronaut A", simulated: true },
      { id: "B", name: "Test astronaut B", simulated: true },
      { id: "C", name: "Test astronaut C", simulated: true },
    ]);
    expect(TEST_READINGS.every((r) => r.source === "simulated")).toBe(true);
    expect(SIMULATED_LABEL).toMatch(/Simulated astronaut.*3-night average/);
    expect(Object.keys(TEST_STORIES)).toEqual(["A", "B", "C"]);
    expect(TEST_STORIES.B).toContain("flagged on 13 of 18 days 43–60 (7 Watch, 6 Act), first on day 41.");
    expect(TEST_STORIES.C).toContain("at Watch on 7 of 14 days 159–172, first on day 162, and on day 165; with no story it was at Watch on 5 of 155 cruise days.");
    for (const i of CREW_INDICATORS) expect(NOISE[i].source.length).toBeGreaterThan(0);
    for (const f of Object.values(S)) expect(f.text.length).toBeGreaterThan(0);
  });

  it("simulateAstronaut with no seed gives the fixed crew", () => {
    for (const id of ["A", "B", "C"] as const) expect(simulateAstronaut(id)).toEqual(HIST[id]);
  });

  it("phases: first72h 0–3, cruise 4–158, preLanding 159–180", () => {
    expect([-1, 0, 3, 4, 158, 159, 180].map(phaseForDay))
      .toEqual(["preflight", "first72h", "first72h", "cruise", "cruise", "preLanding", "preLanding"]);
    expect(TEST_READINGS.every((r) => r.phase === phaseForDay(r.missionDay))).toBe(true);
    expect(TEST_READINGS.every((r) => Date.parse(r.takenAt) === Date.parse("2031-03-03T07:30:00Z") + r.missionDay * 86_400_000)).toBe(true);
  });

  it("5 pre-flight readings on 5 distinct days per indicator, and no in-flight gap of 7 days", () => {
    for (const id of ["A", "B", "C"] as const) for (const i of CREW_INDICATORS) {
      const series = HIST[id].filter((r) => r.indicator === i);
      const pre = series.filter((r) => r.phase === "preflight");
      expect(new Set(pre.map((r) => r.missionDay)).size).toBe(5);
      expect(pre).toHaveLength(5);
      const flight = series.filter((r) => r.phase !== "preflight").map((r) => r.missionDay);
      expect(flight[0]).toBe(0);
      expect(flight.at(-1)).toBe(MISSION_DAYS);
      expect(Math.max(...flight.slice(1).map((d, k) => d - flight[k]))).toBeLessThanOrEqual(6);
    }
  });

  it("values stay on their scales", () => {
    const of = (i: Indicator) => TEST_READINGS.filter((r) => r.indicator === i).map((r) => r.value);
    const ints = (i: Indicator, lo: number, hi: number) => expect(of(i).every((v) => Number.isInteger(v) && v >= lo && v <= hi)).toBe(true);
    ints("fatigueSP", 1, 7);
    ints("moodPHQ2", 0, 6);
    ints("pvtLapses", 0, Infinity);
    ints("spo2", 0, 100);
    expect(TEST_READINGS.every((r) => Number.isFinite(r.value))).toBe(true);
  });

  // B and C pre-flight values are raw draws round made-up means, so one lands just outside the range for people (measured).
  it("every reading of A, and every pre-flight reading of all three but C's temperature on day -7 (37.5 °C, Watch), is inside the ranges for people", () => {
    const pre = TEST_READINGS.filter((r) => r.phase === "preflight");
    const outside = pre.filter((r) => peopleAnswer(r, defaultTables).answer.status !== "nominal");
    expect(outside.map((r) => [r.id, r.value, peopleAnswer(r, defaultTables).answer.status])).toEqual([["C-tempC--7", 37.5, "watch"]]);
    for (const r of HIST.A) expect([r.id, peopleAnswer(r, defaultTables).answer.status]).toEqual([r.id, "nominal"]);
  });

  it("buddy check about C: week of day 161, mood 2, 'seems withdrawn'", () => {
    expect(TEST_BUDDY_CHECKS).toEqual([
      { fromId: "A", aboutId: "C", weekOf: "2031-08-11", mood: 2, sleep: 0, confusion: 0, conflict: 0, note: "seems withdrawn" },
    ]);
    expect(new Date("2031-08-11T00:00:00Z").getUTCDay()).toBe(1);
    expect(HIST.C.find((r) => r.missionDay === 161)?.takenAt.slice(0, 10)).toBe("2031-08-11");
  });
});

describe("A, nominal", () => {
  it("every cruise day: all regions nominal except eyes (not built), and no combined drift", () => {
    for (const day of days(4, 158)) for (const r of REGIONS) {
      const res = region("A", r, day);
      if (r === "eyes") expect(res).toEqual({ region: "eyes", status: "notMeasured", reasons: ["vision self-check not built"] });
      else expect([day, r, res.status]).toEqual([day, r, "nominal"]);
      expect(res.reasons.join(" ")).not.toContain("Combined drift");
    }
  });
});

describe("B, sleep debt (raw noise round a shifted mean)", () => {
  it("brain/sleep is nominal on cruise days 4–39, before the story starts", () => {
    expect(count(days(4, 39), (d) => flagged(FULL.B[d]))).toBe(S.bCruiseFlaggedDays.value);
    for (const day of days(4, 39)) expect([day, FULL.B[day]]).toEqual([day, "nominal"]);
  });

  it("measured: first flagged day, and flagged on 13 of 18 days 43–60 (7 Watch, 6 Act)", () => {
    expect(days(40, 60).find((d) => flagged(FULL.B[d]))).toBe(S.bFirstFlagDay.value);
    expect(FULL.B[41]).toBe("watch");
    expect(region("B", "brainSleepMood", 41).reasons.join(" ")).toMatch(/^Reaction-test lapses:/);
    expect(count(days(43, 60), (d) => flagged(FULL.B[d]))).toBe(S.bFlaggedDays43to60.value);
    expect(count(days(43, 60), (d) => FULL.B[d] === "watch")).toBe(7);
    expect(count(days(43, 60), (d) => FULL.B[d] === "act")).toBe(6);
    expect(region("B", "brainSleepMood", 43).reasons.find((s) => s.startsWith("Combined drift")))
      .toMatch(/sleep -.*fatigue score \+.*reaction-test lapses \+/);
  });

  it("measured: most brain people-answers nominal on 21 of 21 days 40–60; no people-answer of B is act on those days", () => {
    const majority = (d: number) => BRAIN.filter((i) => status("B", i, d).verdict!.answers[0].status === "nominal").length > BRAIN.length / 2;
    expect(count(days(40, 60), majority)).toBe(S.bPeopleMajorityDays40to60.value);
    for (const day of days(40, 60)) for (const i of CREW_INDICATORS) {
      expect([day, i, status("B", i, day).verdict?.answers[0].status]).not.toEqual([day, i, "act"]);
    }
  });
});

describe("C, combined drift (raw noise round a sliding mean)", () => {
  it("measured: brain/sleep on days 159–172, first Watch day 162, Watch on day 165", () => {
    expect(days(159, 172).map((d) => FULL.C[d])).toEqual([
      "nominal", "nominal", "nominal", "watch", "nominal", "watch", "watch", "watch", "watch", "nominal", "watch", "nominal", "nominal", "watch",
    ]);
    expect(days(159, 172).find((d) => flagged(FULL.C[d]))).toBe(S.cFirstFlagDay.value);
    expect(FULL.C[165]).toBe(S.cDay165.value);
    expect(count(days(159, 172), (d) => flagged(FULL.C[d]))).toBe(S.cFlaggedDays159to172.value);
  });

  it("measured: Watch on 5 of 155 cruise days with no story (false alarms on days 17, 38, 92, 122, 123)", () => {
    const alarms = days(4, 158).filter((d) => flagged(FULL.C[d]));
    expect(alarms).toEqual([17, 38, 92, 122, 123]);
    expect(alarms).toHaveLength(S.cCruiseFlaggedDays.value);
  });

  it("day 165: Watch via combined drift naming sleep, fatigue and mood; heart not act", () => {
    const res = region("C", "brainSleepMood", 165);
    expect(res.reasons.find((s) => s.startsWith("Combined drift"))).toMatch(/sleep -.*fatigue score \+.*mood score \+/);
    expect(region("C", "heart", 165).status).not.toBe("act");
  });

  it("days 159–180: no reading passes a NASA limit (no people-answer is act); day 165 sleep is below the range for people", () => {
    for (const day of days(159, MISSION_DAYS)) for (const i of CREW_INDICATORS) {
      expect([day, i, status("C", i, day).verdict?.answers[0].status]).not.toEqual([day, i, "act"]);
    }
    expect(status("C", "sleepHours", 165).verdict!.answers[0].status).toBe("watch");
  });

  // The pre-landing phase row says sleep is expected to fall (no size), so the today-answer calls C's fall expected.
  // With no size it cannot cancel anything, so drift still counts it.
  it("day 165: the today-answer for C's sleep says the fall is expected for pre-landing (engine's actual output)", () => {
    const v = status("C", "sleepHours", 165).verdict!;
    expect(v.answers[2]).toMatchObject({ status: "nominal", compareTo: "expected for preLanding" });
    expect(v.overall).toBe("watch");
  });
});

// Number.prototype.toLocaleString builds a new formatter on every call (about 0.1 ms here), which dominates the
// many-seed run. Same output from a cached Intl.NumberFormat; the engine's statuses and text do not change.
const nativeToLocale = Number.prototype.toLocaleString;
const formatters = new Map<string, Intl.NumberFormat>();
function cachedToLocale(this: number, locales?: string, options?: Intl.NumberFormatOptions): string {
  const key = `${locales}|${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) formatters.set(key, (f = new Intl.NumberFormat(locales, options)));
  return f.format(this);
}

// shortcut: 100 seeds each keeps this near 5 s (200 gave B 92.5% by day 43, C 61.5% on day 165); raise if the engine gets faster.
describe("many seeds (1–100 per astronaut): detection and false-alarm rates", () => {
  const SEEDS = days(1, 100);
  beforeAll(() => { Number.prototype.toLocaleString = cachedToLocale as typeof nativeToLocale; });
  afterAll(() => { Number.prototype.toLocaleString = nativeToLocale; });

  it("the fast path gives the same statuses as the full history on the fixed seeds", () => {
    expect(brainStatuses("B", HIST.B, 60)).toEqual(FULL.B);
    expect(brainStatuses("C", HIST.C, 172)).toEqual(FULL.C);
  });

  it("B: median first flag day, share flagged by day 43, share of days 43–60 flagged, cruise false alarms", () => {
    const runs = SEEDS.map((s) => brainStatuses("B", simulateAstronaut("B", s), 60));
    const first = runs.map((st) => days(40, 60).find((d) => flagged(st[d])) ?? Infinity);
    const share = (ds: number[], ok: (s: Status) => boolean) =>
      runs.reduce((n, st) => n + count(ds, (d) => ok(st[d])), 0) / (runs.length * ds.length);
    expect(median(first)).toBe(S.seedsBMedianFirstFlagDay.value);
    expect(first.filter((d) => d <= 43).length / runs.length).toBeCloseTo(S.seedsBFlaggedBy43.value, 2);
    expect(share(days(43, 60), flagged)).toBeCloseTo(S.seedsBFlaggedShare43to60.value, 2);
    expect(share(days(43, 60), (s) => s === "act")).toBeCloseTo(0.366, 2);
    expect(share(days(4, 39), flagged)).toBeCloseTo(S.seedsBCruiseFalseAlarm.value, 2);
  }, 20_000); // about 2 s alone; slower when the whole suite runs in parallel

  it("C: share flagged on day 165, on any day 159–172, share of days 159–172, cruise false alarms, any day 145–158", () => {
    const runs = SEEDS.map((s) => brainStatuses("C", simulateAstronaut("C", s), 172));
    const share = (ds: number[]) => runs.reduce((n, st) => n + count(ds, (d) => flagged(st[d])), 0) / (runs.length * ds.length);
    const anyIn = (ds: number[]) => runs.filter((st) => ds.some((d) => flagged(st[d]))).length / runs.length;
    expect(median(runs.map((st) => days(159, 172).find((d) => flagged(st[d])) ?? Infinity))).toBe(S.seedsCMedianFirstFlagDay.value);
    expect(runs.filter((st) => flagged(st[165])).length / runs.length).toBeCloseTo(S.seedsCDay165.value, 2);
    expect(runs.filter((st) => st[165] === "act").length / runs.length).toBeCloseTo(0.06, 2);
    expect(anyIn(days(159, 172))).toBeCloseTo(S.seedsCFlaggedIn159to172.value, 2);
    expect(share(days(159, 172))).toBeCloseTo(S.seedsCFlaggedShare159to172.value, 2);
    expect(share(days(4, 158))).toBeCloseTo(S.seedsCCruiseFalseAlarm.value, 2);
    expect(anyIn(days(145, 158))).toBeCloseTo(S.seedsCFlaggedIn145to158.value, 2);
  }, 20_000);
});
