import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseOsd569 } from "@/lib/data/osd569";
import { defaultTables, withLabRanges } from "@/lib/engine";
import type { Indicator } from "@/lib/types";
import { MARKERS, buildMarker, correctionSentence, describeDraw, studyShape, summarySentence } from "./compute";

const csv = readFileSync(path.resolve(__dirname, "../../public/data/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv"), "utf-8");
const { readings, ranges, corrections } = parseOsd569(csv);
const tables = withLabRanges(defaultTables, ranges);
const view = (indicator: Indicator) => buildMarker(indicator, readings, tables, corrections);

describe("proof summary on the real OSD-569 file", () => {
  it.each([
    ["lymphAbs", 16, 16, 2, 4, []],
    ["neutAbs", 16, 16, 0, 4, []],
    ["wbc", 16, 16, 0, 4, []],
    ["hb", 15, 16, 0, 4, []],
    ["plt", 16, 16, 0, 3, ["C003"]],
  ] as const)("%s: people %i/%i normal, you %i of %i changed", (indicator, peopleNormal, peopleJudged, youChanged, youJudged, noBaseline) => {
    const v = view(indicator);
    expect(v).toMatchObject({ peopleNormal, peopleJudged, youChanged, youJudged, firstLabels: ["R+1"] });
    expect(v.noBaseline.map((c) => c.id)).toEqual(noBaseline);
  });

  it("covers every marker on the page", () => {
    expect(MARKERS.map((m) => m.indicator)).toEqual(["lymphAbs", "neutAbs", "wbc", "hb", "plt"]);
  });

  it("partial: 2 of 4 crew changed (lymphocytes)", () => {
    expect(summarySentence(view("lymphAbs"))).toBe(
      "The lab range called all 16 post-flight results normal. Against their own pre-flight baseline, 2 of 4 crew changed beyond their reference change value the day after landing.",
    );
  });

  it("none: no crew changed (neutrophils); partial people count (haemoglobin)", () => {
    expect(summarySentence(view("neutAbs"))).toContain("none of the 4 crew changed");
    expect(summarySentence(view("hb"))).toContain("called 15 of 16 post-flight results normal");
  });

  it("crew without a baseline are named, not counted as unchanged (platelets)", () => {
    expect(summarySentence(view("plt"))).toBe(
      "The lab range called all 16 post-flight results normal. Against their own pre-flight baseline, none of the 3 crew with a baseline changed beyond their reference change value the day after landing. C003 is left out: baseline too thin (2 pre-flight readings, need 3).",
    );
    expect(view("plt").crew.find((c) => c.id === "C003")?.base).toBeNull();
  });

  it("all: every crew member changed, and mixed first-draw labels", () => {
    const v = view("lymphAbs");
    expect(summarySentence({ ...v, youChanged: 4 })).toContain("all 4 crew changed beyond their reference change value the day after landing.");
    expect(summarySentence({ ...v, firstLabels: ["R+1", "R+45"] })).toContain("at each one's first draw after landing.");
    expect(summarySentence({ ...v, firstLabels: ["R+45"] })).toContain("at the first draw after landing (R+45).");
    expect(summarySentence({ ...v, youJudged: 0, youChanged: 0 })).toContain("No crew member had enough pre-flight draws");
    expect(summarySentence({ ...v, peopleJudged: 0 })).toBe("No post-flight results for this marker could be judged against the lab range.");
  });

  it("marks the rebuilt point only on the corrected draw", () => {
    const rebuilt = (i: Indicator) => view(i).crew.flatMap((c) => c.draws.filter((d) => d.rebuilt).map((d) => `${c.id} ${d.label}`));
    expect(rebuilt("lymphAbs")).toEqual(["C003 L-92"]);
    expect(rebuilt("neutAbs")).toEqual(["C003 L-92"]);
    expect(rebuilt("wbc")).toEqual([]);
    expect(rebuilt("plt")).toEqual([]);
  });

  it("crew count and draws per crew come from the file", () => {
    expect(studyShape(readings)).toEqual({ crew: 4, draws: "7" });
  });

  it("data note sentence is built from the correction", () => {
    expect(describeDraw("L-92")).toBe("92 days before launch");
    expect(describeDraw("R+1")).toBe("1 day after landing");
    expect(correctionSentence(corrections[0])).toBe(
      "Crew C003, 92 days before launch (L-92): its white-cell counts don't match its own percentages × total white count, so its cells are in the wrong columns. We rebuilt lymphocytes and neutrophils from the percentages and total white count in the same row, and left out platelets, which can't be rebuilt. Its other values are used as filed.",
    );
  });
});
