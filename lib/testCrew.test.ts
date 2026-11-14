import { describe, expect, it } from "vitest";
import { defaultTables, regionStatus, statusFor } from "@/lib/engine";
import { peopleAnswer } from "@/lib/engine/answers";
import { REGION_MEMBERS } from "@/lib/engine/regions";
import type { Indicator, Region } from "@/lib/types";
import {
  CREW_INDICATORS, MISSION_DAYS, NOISE, phaseForDay, SIMULATED_LABEL, TEST_BUDDY_CHECKS, TEST_CREW, TEST_READINGS, TEST_STORIES,
} from "./testCrew";

const REGIONS = Object.keys(REGION_MEMBERS) as Region[];
const BRAIN = REGION_MEMBERS.brainSleepMood;
const mine = (id: string) => TEST_READINGS.filter((r) => r.astronautId === id);
const HIST = { A: mine("A"), B: mine("B"), C: mine("C") };
const ctx = (day: number) => ({ phase: phaseForDay(day), missionDay: day });
const region = (id: keyof typeof HIST, r: Region, day: number) => regionStatus(r, id, HIST[id], ctx(day), defaultTables);
const status = (id: keyof typeof HIST, i: Indicator, day: number) => statusFor(id, i, HIST[id], ctx(day), defaultTables);
const days = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
// Signed fraction of the person's own band the latest reading sits at (+ = up), from the engine's you-answer.
const bandFraction = (id: keyof typeof HIST, i: Indicator, day: number) => {
  const you = status(id, i, day).verdict!.answers[1];
  return you.changePct! / Math.abs(you.rcvPct!);
};

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
    for (const i of CREW_INDICATORS) expect(NOISE[i].source.length).toBeGreaterThan(0);
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

  it("every reading of A, and every pre-flight reading of all three, is inside the ranges for people and NASA limits", () => {
    const pre = TEST_READINGS.filter((r) => r.phase === "preflight");
    for (const r of [...pre, ...HIST.A]) expect([r.id, peopleAnswer(r, defaultTables).answer.status]).toEqual([r.id, "nominal"]);
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

describe("B, sleep debt", () => {
  const brain = (day: number) => region("B", "brainSleepMood", day);

  it("brain/sleep is nominal on cruise days 4–39", () => {
    for (const day of days(4, 39)) expect([day, brain(day).status]).toEqual([day, "nominal"]);
  });

  it("goes watch via combined drift on a day in 40–43 and stays watch on days 43–60", () => {
    const first = days(40, 60).find((d) => brain(d).status === "watch");
    expect(first).toBeGreaterThanOrEqual(40);
    expect(first).toBeLessThanOrEqual(43);
    for (const day of days(first!, 60)) {
      const res = brain(day);
      expect([day, res.status]).toEqual([day, "watch"]);
      const drift = res.reasons.find((s) => s.startsWith("Combined drift"));
      expect(drift).toMatch(/sleep -.*fatigue score \+.*reaction-test lapses \+/);
    }
  });

  it("days 43–60: fatigue and lapses each nominal for B alone; most brain people-answers nominal; sleep inside the range for people on most days", () => {
    let sleepInside = 0;
    for (const day of days(43, 60)) {
      for (const i of ["fatigueSP", "pvtLapses"] as const) expect([day, i, status("B", i, day).verdict?.answers[1].status]).toEqual([day, i, "nominal"]);
      const people = BRAIN.map((i) => status("B", i, day).verdict!.answers[0].status);
      expect(people.filter((s) => s === "nominal").length).toBeGreaterThan(BRAIN.length / 2);
      if (people[0] === "nominal") sleepInside++;
    }
    expect(sleepInside).toBeGreaterThan(18 / 2);
  });
});

describe("C, combined drift (demo hero)", () => {
  it("brain/sleep is nominal on every cruise day", () => {
    for (const day of days(4, 158)) expect([day, region("C", "brainSleepMood", day).status]).toEqual([day, "nominal"]);
  });

  it("day 165: brain/sleep watch via combined drift naming sleep, mood and fatigue; heart not act", () => {
    const res = region("C", "brainSleepMood", 165);
    expect(res.status).toBe("watch");
    expect(res.reasons.find((s) => s.startsWith("Combined drift"))).toMatch(/sleep -.*fatigue score \+.*mood score \+/);
    expect(region("C", "heart", 165).status).not.toBe("act");
  });

  it("day 165: HR, sleep, mood and fatigue are nominal for people and for C alone, at 0.5–0.75 of C's band the bad way", () => {
    for (const [i, sign] of [["restingHR", 1], ["sleepHours", -1], ["moodPHQ2", 1], ["fatigueSP", 1]] as const) {
      const v = status("C", i, 165).verdict!;
      expect([i, v.answers[0].status, v.answers[1].status]).toEqual([i, "nominal", "nominal"]);
      const f = sign * bandFraction("C", i, 165);
      expect(f).toBeGreaterThanOrEqual(0.5);
      expect(f).toBeLessThan(0.75);
    }
  });

  it("day 165: no reading passes a NASA limit (no people-answer is act)", () => {
    for (const i of CREW_INDICATORS) expect([i, status("C", i, 165).verdict?.answers[0].status]).not.toEqual([i, "act"]);
  });

  // The spec expects "not expected for pre-landing"; the pre-landing phase row says sleep is expected to fall (no size),
  // so the today-answer calls C's fall expected. With no size it cannot cancel anything, so drift still counts it.
  it("day 165: the today-answer for C's sleep says the fall is expected for pre-landing (engine's actual output)", () => {
    const v = status("C", "sleepHours", 165).verdict!;
    expect(v.answers[2]).toMatchObject({ status: "nominal", compareTo: "expected for preLanding" });
    expect(v.overall).toBe("nominal");
  });
});
