import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseOsd569 } from "@/lib/data/osd569";
import { defaultTables, median, withLabRanges } from "@/lib/engine";
import { MIN_BASELINE_READINGS } from "@/lib/engine/baseline";
import type { Indicator } from "@/lib/types";
import {
  buildCheck, checkReport, createStore, FIELDS, fullHistory, parseDay, parseForm, parseStored, runCheck, SAMPLE_LYMPH_CENTRE,
  sampleValues, seedHistory, serialise, STORAGE_KEY, type Check,
} from "./check";

const csv = readFileSync(path.resolve(__dirname, "../../public/data/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv"), "utf-8");
const osd = parseOsd569(csv);
const tables = withLabRanges(defaultTables, osd.ranges);
const sample = () => parseForm(sampleValues()).values;
const answers = (c: ReturnType<typeof runCheck>, i: Indicator) => c.verdicts.find((v) => v.reading.indicator === i)!;

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}
const asStorage = (s: object) => s as unknown as Storage;
const throwing = asStorage({
  getItem: () => { throw new Error("SecurityError"); },
  setItem: () => { throw new Error("QuotaExceededError"); },
  removeItem: () => { throw new Error("SecurityError"); },
});

describe("sample history", () => {
  it("is A's simulated pre-flight only, with enough readings for every field's baseline", () => {
    const h = seedHistory();
    expect(h.every((r) => r.astronautId === "A" && r.missionDay < 0 && r.phase === "preflight" && r.source === "simulated")).toBe(true);
    for (const f of FIELDS) expect(h.filter((r) => r.indicator === f.indicator).length).toBeGreaterThanOrEqual(Math.max(MIN_BASELINE_READINGS, 5));
  });

  it("lymphocyte centre sits near the real OSD-569 pre-flight median", () => {
    const pre = osd.readings.filter((r) => r.indicator === "lymphAbs" && r.phase === "preflight").map((r) => r.value);
    expect(Math.abs(SAMPLE_LYMPH_CENTRE - median(pre))).toBeLessThan(50);
  });
});

describe("sample values", () => {
  const result = runCheck(buildCheck(sample(), 100, "t1", "2031-06-11T08:00:00.000Z"), seedHistory(), tables);

  it("lymphocytes: normal for people (lab range), not normal for you", () => {
    const v = answers(result, "lymphAbs");
    const [people, you] = v.answers;
    expect(people.status).toBe("nominal");
    expect(people.compareTo).toBe("lab range 850–3,900 cells/µL");
    expect(["watch", "act"]).toContain(you.status);
    expect(you.changePct).toBeCloseTo(-30, 0);
    expect(v.reading.value).toBeGreaterThanOrEqual(850);
    expect(result.verdicts[0].reading.indicator).toBe("lymphAbs"); // flagged first
    expect(v.action.saw).toMatch(/^Your lymphocytes are /);
  });

  it("every other reading is nominal on all three questions", () => {
    for (const v of result.verdicts.filter((x) => x.reading.indicator !== "lymphAbs")) {
      expect([v.reading.indicator, v.answers.map((a) => a.status)]).toEqual([v.reading.indicator, ["nominal", "nominal", "nominal"]]);
    }
    expect(result.verdicts).toHaveLength(FIELDS.length);
    expect(result.next).toBe("recheck");
  });
});

describe("validation", () => {
  it.each([
    ["restingHR", "19"], ["restingHR", "251"], ["tempC", "29.9"], ["tempC", "46"], ["spo2", "101"], ["spo2", "49"],
    ["sleepHours", "25"], ["moodPHQ2", "7"], ["moodPHQ2", "1.5"], ["fatigueSP", "0"], ["fatigueSP", "8"],
    ["glucose", "5"], ["lymphAbs", "30000"], ["restingHR", "abc"], ["restingHR", "-60"], ["restingHR", "NaN"],
  ] as [Indicator, string][])("rejects %s = %s", (indicator, raw) => {
    const { values, errors } = parseForm({ [indicator]: raw });
    expect(errors[indicator]).toMatch(/^Enter /);
    expect(values[indicator]).toBeUndefined();
  });

  it("skips empty fields, accepts decimal and thousands commas", () => {
    expect(parseForm({ restingHR: "  ", tempC: "36,6", lymphAbs: "1,470" })).toEqual({ values: { tempC: 36.6, lymphAbs: 1470 }, errors: {} });
  });

  it("diastolic must be below systolic", () => {
    expect(parseForm({ sbp: "80", dbp: "90" }).errors.dbp).toMatch(/lower than the top/);
  });

  it("mission day 0–180 whole numbers only", () => {
    expect([parseDay("0"), parseDay("180"), parseDay("181"), parseDay("-1"), parseDay("1.5"), parseDay("")]).toEqual([0, 180, undefined, undefined, undefined, undefined]);
  });
});

describe("stored history", () => {
  it("malformed JSON falls back to the sample history alone", () => {
    const s = new MemoryStorage();
    s.setItem(STORAGE_KEY, "{not json");
    const checks = createStore(() => asStorage(s)).load();
    expect(checks).toEqual([]);
    expect(fullHistory(checks)).toEqual(seedHistory());
  });

  it("drops malformed checks and readings, keeps valid ones", () => {
    const good = buildCheck({ restingHR: 60 }, 100, "ok", "2031-06-11T08:00:00.000Z");
    const raw = JSON.stringify({ v: 1, checks: [
      good,
      { ...good, id: "ok" }, // duplicate id
      { id: "badday", missionDay: 999, takenAt: good.takenAt, readings: good.readings },
      { id: "mixed", missionDay: 120, takenAt: good.takenAt, readings: [{ indicator: "restingHR", value: 9999 }, { indicator: "spo2", value: 98 }, { indicator: "evil", value: 1 }, null] },
      "nonsense",
    ] });
    const checks = parseStored(raw);
    expect(checks.map((c) => [c.id, c.readings.map((r) => [r.indicator, r.value, r.missionDay, r.phase, r.source])])).toEqual([
      ["ok", [["restingHR", 60, 100, "cruise", "checkin"]]],
      ["mixed", [["spo2", 98, 120, "cruise", "checkin"]]],
    ]);
    expect(parseStored(JSON.stringify({ v: 2, checks: [good] }))).toEqual([]);
  });

  it("works in memory when storage throws", () => {
    const store = createStore(() => throwing);
    expect(store.load()).toEqual([]);
    const c = buildCheck({ restingHR: 60 }, 100, "m1", "2031-06-11T08:00:00.000Z");
    expect(() => store.save([c])).not.toThrow();
    expect(store.load()).toEqual([c]);
    expect(() => store.clear()).not.toThrow();
    expect(store.load()).toEqual([]);
    expect(createStore(() => { throw new Error("no window"); }).load()).toEqual([]);
  });

  it("round-trips through real storage", () => {
    const s = new MemoryStorage();
    const c = buildCheck(sample(), 100, "r1", "2031-06-11T08:00:00.000Z");
    createStore(() => asStorage(s)).save([c]);
    expect(s.getItem(STORAGE_KEY)).toBe(serialise([c]));
    expect(createStore(() => asStorage(s)).load()).toEqual([c]);
  });
});

describe("a second check uses the first", () => {
  it("day 100 then day 120: the stored day-100 lymph reading makes the second one Act", () => {
    const s = new MemoryStorage();
    const store = createStore(() => asStorage(s));
    const first = buildCheck(sample(), 100, "d100", "2031-06-11T08:00:00.000Z");
    const r1 = runCheck(first, fullHistory(store.load()), tables);
    expect(answers(r1, "lymphAbs").answers[1].status).toBe("watch");
    store.save([...store.load(), first]);

    const reloaded: Check[] = createStore(() => asStorage(s)).load();
    const before = fullHistory(reloaded);
    expect(before.some((r) => r.id === "check-d100-lymphAbs" && r.missionDay === 100)).toBe(true);
    const r2 = runCheck(buildCheck(sample(), 120, "d120", "2031-07-01T08:00:00.000Z"), before, tables);
    const lymph = answers(r2, "lymphAbs");
    expect(lymph.answers[1].status).toBe("act");
    expect(lymph.action.saw).toContain("the previous reading was also past that");
    expect(r2.next).toBe("act");

    const report = checkReport(r2);
    expect(report).toContain("Mission day 120, phase: Cruise");
    expect(report).toContain("Lymphocytes");
    expect(report.match(/up to 20 min one way/g)).toHaveLength(1);
    expect(report).toContain("simulated");
  });
});
