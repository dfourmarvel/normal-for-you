import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseOsd569 } from "@/lib/data/osd569";
import { defaultTables, withLabRanges } from "@/lib/engine";
import type { Indicator } from "@/lib/types";
import { MARKERS, buildMarker, closeCall, correctionSentence, dataNoteIntro, describeDraw, preflightDrawsSentence, studyShape, summarySentence } from "./compute";

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

describe("honest wording on the proof page", () => {
  const firstYou = (indicator: Indicator, id: string) => view(indicator).crew.find((c) => c.id === id)?.post[0].verdict.answers[1] ?? {};

  it("close call: C003 neutrophils, 0.1 points inside the band (real file)", () => {
    expect(closeCall(firstYou("neutAbs", "C003"))).toBe("Close call: −36.2% against a limit of −36.3%, 0.1 points inside the band.");
  });

  it("close call: just past the limit, and not a close call when far or unknown", () => {
    expect(closeCall({ changePct: -36.9, rcvPct: -36.3 })).toBe("Close call: −36.9% against a limit of −36.3%, 0.6 points past the limit.");
    expect(closeCall({ changePct: 40.5, rcvPct: 41.2 })).toBe("Close call: +40.5% against a limit of +41.2%, 0.7 points inside the band.");
    expect(closeCall({ changePct: -20, rcvPct: -36.3 })).toBeNull();
    expect(closeCall({ changePct: -37.4, rcvPct: -36.3 })).toBeNull();
    expect(closeCall({ changePct: -20 })).toBeNull();
  });

  it("close call: the printed gap and side agree, never 0.0 or 1.0 points", () => {
    expect(closeCall({ changePct: -36.34, rcvPct: -36.3 })).toBe("Close call: −36.3% against a limit of −36.3%, 0.04 points past the limit.");
    expect(closeCall({ changePct: -36.26, rcvPct: -36.3 })).toBe("Close call: −36.3% against a limit of −36.3%, 0.04 points inside the band.");
    expect(closeCall({ changePct: -37.26, rcvPct: -36.3 })).toBeNull(); // 0.96 prints as 1.0, so not under 1 point
    expect(closeCall({ changePct: -36.3, rcvPct: -36.3 })).toBe("Close call: −36.3% against a limit of −36.3%, less than 0.01 points inside the band.");
  });

  it("dropped draw: C003 platelets say which draw was left out; nobody else gets a note", () => {
    const note = "Not enough pre-flight draws: the L-92 draw was left out (see the data note)";
    expect(view("plt").crew.map((c) => [c.id, c.baseNote])).toEqual([["C001", undefined], ["C002", undefined], ["C003", note], ["C004", undefined]]);
    expect(view("lymphAbs").crew.every((c) => c.baseNote === undefined)).toBe(true);
  });

  it("pre-flight draw counts come from the data for the selected marker", () => {
    expect(preflightDrawsSentence(view("plt"))).toBe(
      "Personal bands use 3 pre-flight draws each (C003: 2, too few for a band); the method papers recommend 5 for a trend check.",
    );
    expect(preflightDrawsSentence(view("lymphAbs"))).toBe("Personal bands use 3 pre-flight draws each; the method papers recommend 5 for a trend check.");
  });

  it("pre-flight draw counts: every crew member under 3 draws is called too few for a band", () => {
    const v = view("lymphAbs");
    const keep = (n: number) => (c: (typeof v.crew)[number]) => ({ ...c, draws: [...c.draws.filter((d) => d.phase === "preflight").slice(0, n), ...c.draws.filter((d) => d.phase !== "preflight")] });
    expect(preflightDrawsSentence({ ...v, crew: v.crew.map(keep(2)) })).toBe(
      "Each crew member has 2 pre-flight draws, too few for a band (a band needs 3); the method papers recommend 5 for a trend check.",
    );
    expect(preflightDrawsSentence({ ...v, crew: v.crew.map((c, i) => keep(i === 0 ? 1 : 2)(c)) })).toBe(
      "No crew member has more than 2 pre-flight draws, too few for a band (a band needs 3); the method papers recommend 5 for a trend check.",
    );
  });

  it("data note words each kind of row correctly", () => {
    const unverifiable = { ...corrections[0], kind: "unverifiable" as const, changes: corrections[0].changes.filter((ch) => ch.usedValue === null) };
    expect(dataNoteIntro(corrections)).toBe("One row in NASA's file has cell counts in the wrong columns. Charts mark rebuilt points with a hollow dot.");
    expect(dataNoteIntro([unverifiable])).toBe("One row in NASA's file can't be checked against its own white-cell totals, so its white-cell values are left out.");
    expect(dataNoteIntro([...corrections, unverifiable])).toContain("can't be checked");
    expect(dataNoteIntro([...corrections, unverifiable])).toContain("wrong columns");
    expect(correctionSentence(unverifiable)).toBe(
      "Crew C003, 92 days before launch (L-92): its white-cell counts can't be checked against its own percentages and total white count. We left out platelets. Its other values are used as filed.",
    );
  });
});
