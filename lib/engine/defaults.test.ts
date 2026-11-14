import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseOsd569 } from "@/lib/data/osd569";
import { defaultTables, evaluate, rcvForRow, withLabRanges } from "./index";

const csv = readFileSync(path.resolve(__dirname, "../../public/data/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv"), "utf-8");
const { readings, ranges } = parseOsd569(csv);
const tables = withLabRanges(defaultTables, ranges);
const lymph = readings.filter((r) => r.indicator === "lymphAbs");
const rPlus1 = (crew: string) => lymph.find((r) => r.astronautId === crew && r.missionDay === 4)!;

describe("real sourced tables on the real OSD-569 file", () => {
  it("lymphocyte RCV from the EFLM row is the spec's one-sided -24.6%", () => {
    const row = tables.variation.find((v) => v.indicator === "lymphAbs")!;
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
