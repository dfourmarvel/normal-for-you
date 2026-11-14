import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { baseline, evaluate, median } from "@/lib/engine";
import type { Tables } from "./tables";
import { parseOsd569 } from "./osd569";

const csv = readFileSync(path.resolve(__dirname, "../../public/data/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv"), "utf-8");
const { readings, ranges, corrections } = parseOsd569(csv);
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
    expect(readings.filter((r) => r.indicator === "plt")).toHaveLength(27);
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

describe("column-shifted row", () => {
  const value = (sample: string, indicator: string) => readings.find((r) => r.id === `${sample}_${indicator}`)?.value;
  const shifted = "C003_whole-blood_L-92_cbc";

  it("finds exactly one shifted row: C003 L-92", () => {
    expect(corrections).toHaveLength(1);
    expect(corrections[0]).toMatchObject({ sample: shifted, astronautId: "C003", draw: "L-92" });
    expect(corrections[0].changes.map((c) => [c.indicator, c.fileValue, c.usedValue])).toEqual([
      ["lymphAbs", 6826, 1997],
      ["neutAbs", 10.1, 6826],
      ["plt", 12.9, null],
    ]);
    expect(corrections[0].changes[0].reason).toContain("holds the neutrophil count");
  });

  it("rebuilds the differential from percent × WBC, drops platelets, keeps WBC and haemoglobin", () => {
    expect(value(shifted, "lymphAbs")).toBe(1997);
    expect(value(shifted, "neutAbs")).toBe(6826);
    expect(value(shifted, "plt")).toBeUndefined();
    expect(value(shifted, "wbc")).toBe(9.6);
    expect(value(shifted, "hb")).toBe(13.2);
  });

  it("leaves every other row as filed", () => {
    expect(value("C003_whole-blood_L-3_cbc", "lymphAbs")).toBe(3156);
    expect(value("C003_whole-blood_L-44_cbc", "plt")).toBe(345);
    expect(readings.filter((r) => r.id.startsWith(shifted))).toHaveLength(4);
  });

  it("detects a shift written into a clean row", () => {
    const bad = withCell("absolute_lymphocytes_value_cells_per_microliter", "3570"); // C001 L-3: its neutrophil count
    const out = parseOsd569(bad);
    expect(out.corrections.map((c) => c.sample)).toEqual(["C001_whole-blood_L-3_cbc", shifted]);
    expect(out.readings.find((r) => r.id === "C001_whole-blood_L-3_cbc_lymphAbs")?.value).toBe(2667);
  });
});

// Edits several cells of the first data row (C001 L-3) at once.
function withCells(edits: Record<string, string>): string {
  const lines = csv.split(/\r?\n/);
  const header = lines[0].replace(/^﻿/, "").split(",");
  const cells = lines[1].split(",");
  for (const [column, value] of Object.entries(edits)) cells[header.indexOf(column)] = value;
  lines[1] = cells.join(",");
  return lines.join("\n");
}
const firstRow = "C001_whole-blood_L-3_cbc";
const WBC = "white_blood_cell_count_value_thousand_per_microliter";

describe("rows that cannot be checked", () => {
  const ids = (out: ReturnType<typeof parseOsd569>) => new Set(out.readings.filter((r) => r.id.startsWith(firstRow)).map((r) => r.indicator));

  it("real shifted row is still rebuilt, and marked as shifted", () => {
    expect(corrections[0].kind).toBe("shifted");
  });

  it("blank WBC with a filled differential: lymphocyte and neutrophil counts are left out, platelets and haemoglobin kept", () => {
    const out = parseOsd569(withCells({ [WBC]: "" }));
    const c = out.corrections.find((x) => x.sample === firstRow);
    expect(c?.kind).toBe("unverifiable");
    expect(c?.changes.map((ch) => [ch.indicator, ch.usedValue])).toEqual([["lymphAbs", null], ["neutAbs", null]]);
    expect(c?.changes[0].reason).toContain("total white count is blank");
    expect(ids(out)).toEqual(new Set(["hb", "plt"]));
  });

  it("blank WBC with a blank differential is not a correction", () => {
    const blank: Record<string, string> = { [WBC]: "" };
    for (const k of ["basophils", "eosinophils", "lymphocytes", "monocytes", "neutrophils"]) {
      blank[`absolute_${k}_value_cells_per_microliter`] = "";
      blank[`${k}_value_percent`] = "";
    }
    const out = parseOsd569(withCells(blank));
    expect(out.corrections.map((x) => x.sample)).toEqual(["C003_whole-blood_L-92_cbc"]);
    expect(ids(out)).toEqual(new Set(["hb", "plt"]));
  });

  it("a mismatch where the percentages do not add up to 100 is not rebuilt", () => {
    const out = parseOsd569(withCells({ lymphocytes_value_percent: "20" }));
    const c = out.corrections.find((x) => x.sample === firstRow);
    expect(c?.kind).toBe("unverifiable");
    expect(c?.changes[0].reason).toContain("add up to 81.9, not 100");
    expect(c?.changes.map((ch) => ch.indicator)).toEqual(["lymphAbs", "neutAbs", "wbc", "plt"]);
    expect(ids(out)).toEqual(new Set(["hb"]));
  });

  it("a mismatch where fewer than 3 cells match percent × WBC is not rebuilt", () => {
    const out = parseOsd569(withCells({ [WBC]: "15" }));
    const c = out.corrections.find((x) => x.sample === firstRow);
    expect(c?.kind).toBe("unverifiable");
    expect(c?.changes[0].reason).toContain("Only 0 of the 5 count cells match");
    expect(c?.changes.every((ch) => ch.usedValue === null)).toBe(true);
    expect(ids(out)).toEqual(new Set(["hb"]));
  });
});

describe("OSD-569 lymphocyte proof table", () => {
  const crew = [
    { id: "C001", base: 2241, change: -27, you: "watch" },
    { id: "C002", base: 2119, change: -27, you: "watch" },
    { id: "C003", base: 2083, change: 0, you: "nominal" },
    { id: "C004", base: 1786, change: 21, you: "nominal" },
  ] as const;

  it("C003 baseline is the median of its three pre-flight draws after the rebuild", () => {
    expect(median([1997, 2083, 3156])).toBe(2083);
    const r1 = lymph.find((r) => r.astronautId === "C003" && r.missionDay === 4);
    expect(r1?.value).toBe(2086);
  });

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

  it("all 28 pre- and post-flight lymphocyte values sit inside 850-3,900", () => {
    expect(lymph).toHaveLength(28);
    for (const r of lymph) expect(r.value >= 850 && r.value <= 3900, r.id).toBe(true);
  });
});
