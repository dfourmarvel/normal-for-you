import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { baseline, evaluate } from "@/lib/engine";
import type { Tables } from "./tables";
import { parseOsd569 } from "./osd569";

const csv = readFileSync(path.resolve(__dirname, "../../public/data/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv"), "utf-8");
const { readings, ranges } = parseOsd569(csv);
const lymph = readings.filter((r) => r.indicator === "lymphAbs");

const fixture: Tables = {
  variation: [{
    indicator: "lymphAbs", method: "populationCV", cviPct: 10.9, cvaPct: 5.45, badDirection: "down",
    directionSource: "test fixture", status: "unverified", source: "test fixture",
  }],
  ranges,
  limits: [],
  phases: [],
};

function withCell(column: string, value: string): string {
  const lines = csv.split(/\r?\n/);
  const col = lines[0].replace(/^﻿/, "").split(",").indexOf(column);
  const cells = lines[1].split(",");
  cells[col] = value;
  lines[1] = cells.join(",");
  return lines.join("\n");
}

describe("parseOsd569", () => {
  it("parses 28 samples with all five indicators and strips the BOM", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(new Set(readings.map((r) => r.id.replace(/_(lymphAbs|neutAbs|wbc|hb|plt)$/, ""))).size).toBe(28);
    expect(lymph).toHaveLength(28);
    expect(new Set(readings.map((r) => r.indicator))).toEqual(new Set(["lymphAbs", "neutAbs", "wbc", "hb", "plt"]));
  });

  it("maps sample names to astronaut, mission day and phase", () => {
    const by = (id: string) => lymph.find((r) => r.id === `${id}_lymphAbs`);
    expect(by("C001_whole-blood_L-92_cbc")).toMatchObject({ astronautId: "C001", missionDay: -92, phase: "preflight", source: "osd569", takenAt: "" });
    expect(by("C003_whole-blood_R+1_cbc")).toMatchObject({ astronautId: "C003", missionDay: 4, phase: "postflight" });
    expect(by("C004_whole-blood_R+194_cbc")?.missionDay).toBe(197);
  });

  it("builds one lab-range row per indicator, with haemoglobin in g/dL", () => {
    expect(ranges).toHaveLength(5);
    expect(ranges.find((r) => r.indicator === "lymphAbs")).toMatchObject({ low: { value: 850, inclusive: true }, high: { value: 3900, inclusive: true }, label: "lab range 850–3,900 cells/µL" });
    const hb = ranges.find((r) => r.indicator === "hb");
    expect(hb).toMatchObject({ unit: "g/dL", low: { value: 11.7, inclusive: true }, high: { value: 17.1, inclusive: true } });
    expect(hb?.note).toContain("2 reference ranges");
    expect(ranges.filter((r) => r.note)).toHaveLength(1);
    expect(ranges.find((r) => r.indicator === "plt")?.unit).toBe("thousand/µL");
  });

  it("throws when an analyte's range differs between rows", () => {
    const bad = withCell("absolute_lymphocytes_range_max_cells_per_microliter", "9999");
    expect(() => parseOsd569(bad)).toThrow(/range differs/);
  });

  it("skips empty cells instead of inventing a value", () => {
    const gap = withCell("absolute_lymphocytes_value_cells_per_microliter", "");
    expect(parseOsd569(gap).readings.filter((r) => r.indicator === "lymphAbs")).toHaveLength(27);
  });
});

describe("OSD-569 lymphocyte proof table", () => {
  const crew = [
    { id: "C001", base: 2241, change: -27, you: "watch" },
    { id: "C002", base: 2119, change: -27, you: "watch" },
    { id: "C003", base: 3156, change: -34, you: "watch" },
    { id: "C004", base: 1786, change: 21, you: "nominal" },
  ] as const;

  it.each(crew)("$id: baseline $base, R+1 change $change%", ({ id, base, change, you }) => {
    expect(baseline(readings, id, "lymphAbs")).toBe(base);
    const r1 = lymph.find((r) => r.astronautId === id && r.missionDay === 4);
    if (!r1) throw new Error("R+1 reading missing");
    const v = evaluate(r1, readings, { phase: "postflight", missionDay: 4 }, fixture);
    expect(Math.round(v.answers[1].changePct ?? NaN)).toBe(change);
    expect(v.answers[0].status).toBe("nominal");
    expect(v.answers[1].status).toBe(you);
  });

  it("all 16 post-flight lymphocyte values sit inside 850-3,900", () => {
    const post = lymph.filter((r) => r.phase === "postflight");
    expect(post).toHaveLength(16);
    for (const r of post) expect(r.value >= 850 && r.value <= 3900).toBe(true);
  });
});
