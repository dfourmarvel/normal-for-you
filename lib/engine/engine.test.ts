import { describe, expect, it } from "vitest";
import type { LimitRow, PhaseRow, Tables, VariationRow } from "@/lib/data/tables";
import type { Indicator, Phase, Reading } from "@/lib/types";
import { baseline, evaluate, rcvLogNormal, regionStatus, statusFor } from "./index";

const SRC = "test fixture";
const A = "A";
const mk = (indicator: Indicator, missionDay: number, value: number, phase?: Phase, astronautId = A): Reading => ({
  id: `${astronautId}-${indicator}-${missionDay}`, astronautId, indicator, value, unit: "u", takenAt: "",
  missionDay, phase: phase ?? (missionDay < 0 ? "preflight" : "cruise"), source: "simulated",
});
const pre = (indicator: Indicator, value = 100, n = 3): Reading[] =>
  Array.from({ length: n }, (_, i) => mk(indicator, -30 + i, value));

const variation = (indicator: Indicator, badDirection: VariationRow["badDirection"], cviPct = 10.9, cvaPct = 5.45): VariationRow =>
  ({ method: "populationCV", indicator, cviPct, cvaPct, badDirection, directionSource: SRC, status: "unverified", source: SRC });
const tables = (t: Partial<Tables> = {}): Tables => ({ variation: [], ranges: [], limits: [], phases: [], ...t });
const cruise = { phase: "cruise" as const, missionDay: 10 };
const lymphTables = tables({ variation: [variation("lymphAbs", "down")] });

describe("rcvLogNormal", () => {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  it.each([
    [10.9, 5.45, 1.645, -24.6, 32.7],
    [10.9, 5.45, 1.96, -28.6, 40.1],
    [10.9, 2.5, 1.645, -22.9, 29.6],
  ])("CVI %d CVA %d Z %d -> %d / +%d", (cvi, cva, z, down, up) => {
    const r = rcvLogNormal(cvi, cva, z);
    expect(r1(r.downPct)).toBe(down);
    expect(r1(r.upPct)).toBe(up);
  });
});

describe("baseline", () => {
  it("is the median of pre-flight readings and null below 3", () => {
    expect(baseline([mk("hb", -3, 10), mk("hb", -2, 30), mk("hb", -1, 20)], A, "hb")).toBe(20);
    expect(baseline([mk("hb", -3, 10), mk("hb", -2, 30)], A, "hb")).toBeNull();
    expect(baseline([mk("hb", -3, 10), mk("hb", -2, 30), mk("hb", 5, 20, "cruise")], A, "hb")).toBeNull();
  });
});

describe("you-answer", () => {
  it("reports a thin baseline as notMeasured, never normal", () => {
    const h = [...pre("lymphAbs", 100, 2), mk("lymphAbs", 10, 100)];
    const v = evaluate(h[2], h, cruise, lymphTables);
    expect(v.answers[1].status).toBe("notMeasured");
    expect(v.answers[1].compareTo).toContain("baseline too thin");
    expect(v.overall).toBe("notMeasured");
    expect(v.action.kind).toBe("notMeasured");
  });

  it("notMeasured when no variation data exists", () => {
    const h = [...pre("hb"), mk("hb", 10, 100)];
    expect(evaluate(h[3], h, cruise, tables()).answers[1]).toMatchObject({ status: "notMeasured", compareTo: "no biological-variation data" });
  });

  it("a NaN value is notMeasured on every answer", () => {
    const h = [...pre("lymphAbs"), mk("lymphAbs", 10, NaN)];
    const v = evaluate(h[3], h, cruise, lymphTables);
    expect(v.answers.map((a) => a.status)).toEqual(["notMeasured", "notMeasured", "notMeasured"]);
    expect(v.overall).toBe("notMeasured");
  });

  it("environment readings are not judged against a personal baseline", () => {
    const h = [mk("co2", 10, 2)];
    const v = evaluate(h[0], h, cruise, tables());
    expect(v.answers[1]).toMatchObject({ status: "nominal", compareTo: "not applicable (cabin reading)" });
  });

  it("one bad reading is watch; two in a row is act; a rise is never act for a down-bad indicator", () => {
    const h = [...pre("lymphAbs"), mk("lymphAbs", 10, 60), mk("lymphAbs", 11, 60)];
    const first = evaluate(h[3], h, cruise, lymphTables);
    expect(first.answers[1].status).toBe("watch");
    expect(first.answers[1].rcvPct).toBeCloseTo(-24.6, 1);
    expect(first.overall).toBe("watch");
    const second = evaluate(h[4], h, { ...cruise, missionDay: 11 }, lymphTables);
    expect(second.answers[1].status).toBe("act");
    expect(second.overall).toBe("act");
    expect(second.action.callGroundWhen).toBe("now");

    const up = [...pre("lymphAbs"), mk("lymphAbs", 10, 150), mk("lymphAbs", 11, 150)];
    expect(evaluate(up[4], up, { ...cruise, missionDay: 11 }, lymphTables).answers[1].status).toBe("watch");
  });

  it("a recovery between two bad readings resets the escalation", () => {
    const h = [...pre("lymphAbs"), mk("lymphAbs", 10, 60), mk("lymphAbs", 11, 100), mk("lymphAbs", 12, 60)];
    expect(evaluate(h[5], h, { ...cruise, missionDay: 12 }, lymphTables).answers[1].status).toBe("watch");
  });

  it("states the personal band with thousands separators", () => {
    const h = [...pre("lymphAbs", 2000), mk("lymphAbs", 10, 2000)];
    expect(evaluate(h[3], h, cruise, lymphTables).answers[1].compareTo).toBe("your band 1,507–2,654");
  });
});

describe("people-answer", () => {
  const range = { indicator: "hb" as const, low: { value: 13, inclusive: true }, high: { value: 17, inclusive: true }, critLow: { value: 7, inclusive: true }, unit: "g/dL", label: "lab range 13–17 g/dL", source: SRC };
  const run = (value: number, t: Tables) => evaluate(mk("hb", 10, value), [], cruise, t).answers[0];
  it("nominal / watch / act from the range row", () => {
    const t = tables({ ranges: [range] });
    expect(run(15, t).status).toBe("nominal");
    expect(run(12, t).status).toBe("watch");
    expect(run(7, t).status).toBe("act");
    expect(run(12, t).compareTo).toBe("lab range 13–17 g/dL");
  });
  it("says so when there is no range and no limit", () => {
    expect(run(15, tables())).toMatchObject({ status: "nominal", compareTo: "no population range; judged on your own baseline only" });
  });
  it("a limit breach is act and the action card names the requirement", () => {
    const limit: LimitRow = { indicator: "co2", limit: 3, breachedWhen: "above", unit: "mmHg", requirementNo: "V2 TEST", label: "test CO2 limit", source: SRC };
    const r = mk("co2", 10, 4);
    const v = evaluate(r, [r], cruise, tables({ limits: [limit] }));
    expect(v.answers[0].status).toBe("act");
    expect(v.overall).toBe("act");
    expect(v.action.kind).toBe("actLimit");
    expect(v.action.saw).toContain("V2 TEST");
    const ok = mk("co2", 10, 2);
    expect(evaluate(ok, [ok], cruise, tables({ limits: [limit] })).overall).toBe("nominal");
  });
});

describe("today-answer and the overall exception", () => {
  const phaseRow = (expected: PhaseRow["expected"], maxChangePct?: number): PhaseRow =>
    ({ phase: "cruise", indicator: "lymphAbs", expected, maxChangePct, note: SRC, source: SRC });
  const range = { indicator: "lymphAbs" as const, low: { value: 50, inclusive: true }, high: { value: 3900, inclusive: true }, unit: "u", label: "lab range", source: SRC };
  const h = [...pre("lymphAbs"), mk("lymphAbs", 10, 70)]; // -30%: beyond -24.6
  const run = (t: Tables, hist = h) => evaluate(hist[hist.length - 1], hist, cruise, t);
  const base = { variation: [variation("lymphAbs", "down")], ranges: [range] };

  it("noEvidence leaves the status equal to the you-answer", () => {
    const v = run(tables({ ...base, phases: [phaseRow("noEvidence")] }));
    expect(v.answers[2]).toMatchObject({ status: "watch", compareTo: "no known change for this phase, so the change from your normal stands" });
    expect(v.overall).toBe("watch");
  });

  it("an expected fall within the expected size lowers watch to nominal", () => {
    const v = run(tables({ ...base, phases: [phaseRow("down", 40)] }));
    expect(v.answers[0].status).toBe("nominal");
    expect(v.answers[1].status).toBe("watch");
    expect(v.answers[2]).toMatchObject({ status: "nominal", compareTo: "expected for cruise" });
    expect(v.overall).toBe("nominal");
    expect(v.action.kind).toBe("expected");
  });

  it("a fall bigger than the expected size stays watch", () => {
    const v = run(tables({ ...base, phases: [phaseRow("down", 20)] }));
    expect(v.answers[2].status).toBe("watch");
    expect(v.overall).toBe("watch");
  });

  it("the exception does not apply when the people-answer is watch", () => {
    const high = { ...range, low: { value: 80, inclusive: true } }; // 70 is below this lab range
    const v = run(tables({ variation: base.variation, ranges: [high], phases: [phaseRow("down", 40)] }));
    expect(v.answers[0].status).toBe("watch");
    expect(v.answers[2].status).toBe("nominal");
    expect(v.overall).toBe("watch");
  });

  it("the exception does not apply when the change is opposite to what is expected", () => {
    const v = run(tables({ ...base, phases: [phaseRow("up")] }));
    expect(v.answers[2].status).toBe("watch");
    expect(v.overall).toBe("watch");
  });

  it("expected 'none' follows the RCV", () => {
    const t = tables({ ...base, phases: [phaseRow("none")] });
    expect(run(t).answers[2]).toMatchObject({ status: "watch", compareTo: "no change expected in cruise" });
    const flat = [...pre("lymphAbs"), mk("lymphAbs", 10, 100)];
    expect(run(t, flat).answers[2].status).toBe("nominal");
  });

  it("without a baseline the today-answer says it needs one", () => {
    const lone = [mk("lymphAbs", 10, 70)];
    expect(run(tables({ ...base, phases: [phaseRow("down")] }), lone).answers[2]).toMatchObject({ status: "notMeasured", compareTo: "needs a baseline" });
  });
});

describe("statusFor", () => {
  it("is notMeasured when there is no reading in the window", () => {
    const r = statusFor(A, "lymphAbs", pre("lymphAbs"), cruise, lymphTables);
    expect(r.status).toBe("notMeasured");
    expect(r.reason).toBe("No lymphocytes reading for 7 days");
    const old = [...pre("lymphAbs"), mk("lymphAbs", 2, 100)];
    expect(statusFor(A, "lymphAbs", old, cruise, lymphTables).status).toBe("notMeasured");
  });

  it("evaluates the latest reading inside the window", () => {
    const h = [...pre("lymphAbs"), mk("lymphAbs", 5, 60), mk("lymphAbs", 9, 100)];
    const r = statusFor(A, "lymphAbs", h, cruise, lymphTables);
    expect(r.verdict?.reading.missionDay).toBe(9);
    expect(r.status).toBe("nominal");
  });
});

describe("regionStatus", () => {
  const t = tables({ variation: [variation("sleepHours", "down"), variation("fatigueSP", "up"), variation("moodPHQ2", "up"), variation("pvtLapses", "up")] });
  const rcv = rcvLogNormal(10.9, 5.45, 1.645);
  const drifted = (i: Indicator, frac: number) => mk(i, 9, 100 * (1 + (frac * (i === "sleepHours" ? rcv.downPct : rcv.upPct)) / 100));
  const flat = (i: Indicator) => mk(i, 9, 100);
  const hist = (...today: Reading[]) => [...pre("sleepHours"), ...pre("fatigueSP"), ...pre("moodPHQ2"), ...pre("pvtLapses"), ...today];

  it("three members at ~0.6 of RCV the bad way make the region watch though each is nominal", () => {
    const h = hist(drifted("sleepHours", 0.6), drifted("fatigueSP", 0.6), drifted("moodPHQ2", 0.6), flat("pvtLapses"));
    for (const i of ["sleepHours", "fatigueSP", "moodPHQ2"] as const) expect(statusFor(A, i, h, cruise, t).status).toBe("nominal");
    const r = regionStatus("brainSleepMood", A, h, cruise, t);
    expect(r.status).toBe("watch");
    expect(r.reasons.join(" ")).toContain("Combined drift: 3 readings moved the wrong way since pre-flight");
  });

  it("two drifting members are not enough", () => {
    const h = hist(drifted("sleepHours", 0.6), drifted("fatigueSP", 0.6), flat("moodPHQ2"), flat("pvtLapses"));
    expect(regionStatus("brainSleepMood", A, h, cruise, t)).toMatchObject({ status: "nominal", reasons: [] });
  });

  it("movement the good way does not count", () => {
    const good = mk("sleepHours", 9, 100 * (1 + (0.6 * rcv.upPct) / 100));
    const h = hist(good, drifted("fatigueSP", 0.6), drifted("moodPHQ2", 0.6), flat("pvtLapses"));
    expect(regionStatus("brainSleepMood", A, h, cruise, t).status).toBe("nominal");
  });

  it("a member with no reading is listed and the region is not called normal", () => {
    const h = hist(flat("sleepHours"), flat("fatigueSP"), flat("moodPHQ2"));
    const r = regionStatus("brainSleepMood", A, h, cruise, t);
    expect(r.status).toBe("notMeasured");
    expect(r.reasons).toContain("reaction-test lapses not measured");
  });

  it("a missing equipment-dependent member (HRV) is listed but does not grey out the region", () => {
    const heart = ["restingHR", "sbp", "dbp", "spo2"] as const;
    const th = tables({ variation: heart.map((i) => variation(i, "both")) });
    const h = heart.flatMap((i) => [...pre(i), mk(i, 9, 100)]);
    const r = regionStatus("heart", A, h, cruise, th);
    expect(r.status).toBe("nominal");
    expect(r.reasons.some((s) => s.includes("not measured"))).toBe(true);
  });

  it("eyes is notMeasured until the vision self-check is built", () => {
    expect(regionStatus("eyes", A, [], cruise, t)).toEqual({ region: "eyes", status: "notMeasured", reasons: ["vision self-check not built"] });
  });
});
