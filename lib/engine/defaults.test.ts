import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseOsd569 } from "@/lib/data/osd569";
import type { Indicator, Phase, Reading } from "@/lib/types";
import { defaultTables, evaluate, rcvForRow, withLabRanges } from "./index";

const mk = (indicator: Indicator, missionDay: number, value: number, phase: Phase = missionDay < 0 ? "preflight" : "cruise"): Reading =>
  ({ id: `${indicator}-${missionDay}`, astronautId: "A", indicator, value, unit: "u", takenAt: "", missionDay, phase, source: "simulated" });
const peopleOn = (indicator: Indicator, value: number) => {
  const r = mk(indicator, 10, value);
  return evaluate(r, [r], { phase: "cruise", missionDay: 10 }, defaultTables).answers[0].status;
};

describe("real tables: edges and limits as the guidelines word them", () => {
  it.each([
    ["sbp", 119.5, "nominal"], ["sbp", 120, "watch"], ["sbp", 180, "watch"], ["sbp", 180.5, "act"],
    ["dbp", 79.5, "nominal"], ["dbp", 80, "watch"], ["dbp", 120, "watch"], ["dbp", 120.5, "act"],
    ["glucose", 99.5, "nominal"], ["glucose", 100, "watch"], ["glucose", 70, "nominal"], ["glucose", 54, "watch"], ["glucose", 53.5, "act"],
    ["tempC", 37.4, "nominal"], ["tempC", 37.9, "watch"], ["tempC", 38.0, "act"], ["tempC", 35.0, "act"],
    ["spo2", 96, "nominal"], ["spo2", 95.5, "watch"], ["spo2", 91, "act"],
    ["restingHR", 50, "nominal"], ["restingHR", 90, "nominal"], ["restingHR", 49.5, "watch"], ["restingHR", 40, "act"], ["restingHR", 131, "act"],
    ["sleepHours", 7, "nominal"],
    ["radDose", 599.9, "nominal"], ["radDose", 600, "act"], ["co2", 3, "nominal"], ["co2", 3.1, "act"],
  ] as const)("%s %d → people %s", (indicator, value, status) => {
    expect(peopleOn(indicator, value)).toBe(status);
  });

  it("resting HR row is the 50–90 band with the textbook range in the label", () => {
    const hr = defaultTables.ranges.find((r) => r.indicator === "restingHR");
    expect(hr).toMatchObject({ low: { value: 50, inclusive: true }, high: { value: 90, inclusive: true }, label: "NEWS2 band 50–90 bpm (textbook 60–100)" });
  });

  it("no derived whole-number edge is left in the vital ranges", () => {
    const values = defaultTables.ranges.flatMap((r) => [r.low, r.high, r.critLow, r.critHigh]).flatMap((e) => (e ? [e.value] : []));
    for (const derived of [119, 181, 79, 121, 99, 53, 51]) expect(values).not.toContain(derived);
  });
});

describe("real tables: phase expectation without a size", () => {
  it("systolic 120 → 70 in the first 72 h does not end nominal", () => {
    const h = [mk("sbp", -30, 120), mk("sbp", -20, 120), mk("sbp", -10, 120), mk("sbp", 1, 70, "first72h")];
    const v = evaluate(h[3], h, { phase: "first72h", missionDay: 1 }, defaultTables);
    expect(v.answers.map((a) => a.status)).toEqual(["nominal", "watch", "nominal"]);
    expect(v.answers[2].compareTo).toBe("expected for first72h");
    expect(v.overall).toBe("watch");
    expect(v.action.kind).not.toBe("expected");
  });
});

describe("real tables: own-SD rows", () => {
  it("indicators without a usable published CV use the own pre-flight SD", () => {
    const own = defaultTables.variation.filter((v) => v.method === "ownSD").map((v) => [v.indicator, v.badDirection]);
    expect(Object.fromEntries(own)).toEqual({
      spo2: "down", tempC: "both", sleepHours: "down", fatigueSP: "up", moodPHQ2: "up", pvtLapses: "up", bodyMass: "both", hrvRMSSD: "both",
    });
  });
});

const csv = readFileSync(path.resolve(__dirname, "../../public/data/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv"), "utf-8");
const { readings, ranges } = parseOsd569(csv);
const tables = withLabRanges(defaultTables, ranges);
const lymph = readings.filter((r) => r.indicator === "lymphAbs");
const rPlus1 = (crew: string) => lymph.find((r) => r.astronautId === crew && r.missionDay === 4)!;

describe("real sourced tables on the real OSD-569 file", () => {
  it("lymphocyte RCV from the EFLM row is the spec's one-sided -24.6%", () => {
    const row = tables.variation.find((v) => v.indicator === "lymphAbs");
    if (row?.method !== "populationCV") throw new Error("lymphocytes must use the population CV");
    expect(rcvForRow(row).downPct).toBeCloseTo(-24.6, 1);
  });

  it.each(["C001", "C002", "C003"])("%s day after landing: normal for people, not normal for you", (crew) => {
    const v = evaluate(rPlus1(crew), lymph, { phase: "postflight", missionDay: 4 }, tables);
    expect(v.answers[0].status).toBe("nominal");
    expect(v.answers[1].status).toBe("watch");
  });

  it("C004 (+21%) stays inside its own band", () => {
    const v = evaluate(rPlus1("C004"), lymph, { phase: "postflight", missionDay: 4 }, tables);
    expect(v.answers[1].status).toBe("nominal");
  });

  it("every table row names a source", () => {
    const all = [...tables.variation, ...tables.ranges, ...tables.limits, ...tables.phases];
    expect(all.length).toBeGreaterThan(0);
    for (const row of all) expect(row.source.trim()).not.toBe("");
  });
});
