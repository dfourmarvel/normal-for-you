import { describe, expect, it } from "vitest";
import { DETECTION_SUMMARY as S, SIMULATED_LABEL } from "@/lib/testCrew";
import {
  buddyNotes, clampDay, crewCards, dayView, defaultTrendIndicator, detectionFacts, isFlagged, SCREENING, SEND_DELAY, surgeonReport, trendView,
  type DayView,
} from "./model";

const region = (v: DayView, r: string) => v.regions.find((x) => x.region === r)!;

describe("astronaut self-check view models", () => {
  it("picker: A, B, C with a one-line story and their story days", () => {
    const cards = crewCards();
    expect(cards.map((c) => c.astronaut.id)).toEqual(["A", "B", "C"]);
    expect(cards.every((c) => c.astronaut.simulated)).toBe(true);
    expect(cards.map((c) => c.oneLine.split(":")[0])).toEqual(["Nominal", "Sleep debt", "Combined drift"]);
    expect(cards.map((c) => c.storyDays.map((d) => d.day))).toEqual([[100], [43], [165]]);
  });

  it("A day 100: every region nominal except eyes (not measured), no combined drift", () => {
    const v = dayView("A", 100);
    expect(v.phase).toBe("cruise");
    expect(v.regions.map((r) => [r.region, r.status])).toEqual([
      ["heart", "nominal"], ["brainSleepMood", "nominal"], ["bonesMuscles", "nominal"],
      ["eyes", "notMeasured"], ["bloodImmune", "nominal"], ["environment", "nominal"],
    ]);
    expect(region(v, "eyes").reasons).toEqual(["vision self-check not built"]);
    expect(v.regions.every((r) => !r.combined)).toBe(true);
  });

  it("B day 43: brain/sleep flagged, combined drift naming sleep, fatigue and reaction-test lapses", () => {
    const brain = region(dayView("B", 43), "brainSleepMood");
    expect(isFlagged(brain.status)).toBe(true);
    expect(brain.combined?.items.join(", ")).toMatch(/sleep -.*fatigue score \+.*reaction-test lapses \+/);
    expect(brain.combined?.text).toMatch(/readings in brain, sleep and mood moved the wrong way this week/);
    expect(brain.combined?.text).toContain(`Together they're worth a check: ${brain.combined!.items.join(", ")}.`);
  });

  it("C day 165: brain/sleep Watch via combined drift (sleep, fatigue, mood); heart not Act; sleep below the range for people", () => {
    const v = dayView("C", 165);
    expect(v.phaseLabel).toBe("Pre-landing");
    const brain = region(v, "brainSleepMood");
    expect(brain.status).toBe(S.cDay165.value);
    expect(brain.combined?.items.join(", ")).toMatch(/sleep -.*fatigue score \+.*mood score \+/);
    expect(region(v, "heart").status).not.toBe("act");
    const sleep = brain.rows.find((r) => r.indicator === "sleepHours")!.result.verdict!;
    expect(sleep.answers[0].status).toBe("watch");
    expect(sleep.answers[2]).toMatchObject({ status: "nominal", compareTo: "expected for preLanding" });
    // Sleep and fatigue are flagged by themselves, so the card must not say "none far enough alone".
    expect(brain.combined!.flaggedAlone).toBeGreaterThan(0);
    expect(brain.combined!.text).not.toContain("none far enough alone");
  });

  it("flight-surgeon report: who, when, flagged readings with three answers, the delay as an assumption, not sent", () => {
    const v = dayView("C", 165);
    const text = surgeonReport(v, region(v, "brainSleepMood"));
    for (const s of ["(draft, not sent)", SIMULATED_LABEL, "Astronaut: Test astronaut C", "Mission day 165, phase: Pre-landing",
      "Brain, sleep and mood: Watch", "Normal for people? Watch", "Normal for you?", "Normal for this mission day?",
      `Send delay: ${SEND_DELAY}.`, SCREENING]) expect(text).toContain(s);
    expect(SEND_DELAY).toContain("not a NASA figure");
  });

  it("buddy check about C shows only in the week of day 161", () => {
    expect(buddyNotes("C", 165).map((n) => [n.check.note, n.fromName, n.firstDay, n.lastDay])).toEqual([["seems withdrawn", "Test astronaut A", 161, 167]]);
    expect(buddyNotes("C", 160)).toEqual([]);
    expect(buddyNotes("C", 168)).toEqual([]);
    expect(buddyNotes("A", 165)).toEqual([]);
  });

  it("trend: values up to the chosen day, personal band, range for people when there is one", () => {
    const t = trendView("C", "sleepHours", 165);
    expect(t.points.at(-1)!.day).toBe(165);
    expect(t.points.every((p) => p.day <= 165)).toBe(true);
    expect(t.band!.low).toBeLessThan(t.band!.high);
    expect(t.range).toMatchObject({ low: 7, label: "AASM/SRS: at least 7 h per night" });
    expect(trendView("C", "co2", 165).band).toBeUndefined();
    expect(defaultTrendIndicator(dayView("C", 165))).not.toBe("restingHR");
  });

  it("detection facts: measured texts for B and C only; day clamps to the mission", () => {
    expect(detectionFacts("A")).toEqual([]);
    expect(detectionFacts("B")).toContain(S.bFlaggedDays43to60.text);
    expect(detectionFacts("B").every((t) => t.includes("B"))).toBe(true);
    expect(detectionFacts("C")).toContain(S.seedsCCruiseFalseAlarm.text);
    expect(detectionFacts("C").every((t) => t.includes("C"))).toBe(true);
    expect([clampDay(-5), clampDay(42.6), clampDay(999)]).toEqual([0, 43, 180]);
  });
});
