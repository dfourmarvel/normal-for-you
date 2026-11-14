import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseFantasia } from "@/lib/data/fantasia";
import { median } from "./baseline";
import { mannWhitney, populationSd, sampleEntropy } from "./sampen";

describe("sampleEntropy", () => {
  it("counts A and B by hand on a tiny series", () => {
    // m = 2 templates (first N − m = 4): [1,2] [2,1] [1,2] [2,1] → B = 2 pairs (0,2) and (1,3).
    // Next points: (0,2) → 1 vs 1 match, (1,3) → 2 vs 3 no → A = 1. SampEn = −ln(1/2).
    const res = sampleEntropy([1, 2, 1, 2, 1, 3], 2, 0.2);
    expect(res).toMatchObject({ a: 1, b: 2 });
    expect(res.value).toBeCloseTo(Math.LN2, 12);
  });

  it("uses the population SD (divide by N) for r", () => {
    const x = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(populationSd(x)).toBe(2);
    expect(sampleEntropy(x, 2, 0.2).r).toBeCloseTo(0.4, 12);
  });

  it("matches a plain all-pairs count (the sorted speed-up must not change A or B)", () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    const noisy = Array.from({ length: 300 }, () => 700 + Math.round(rand() * 40)); // integers: many ties
    // Equal counts of −7, −1, 1, 7 give SD exactly 5, so r = 0.4 × 5 = 2 and some distances equal r exactly.
    const exactR = [-7, -1, 1, 7].flatMap((v) => Array<number>(60).fill(v)).sort(() => rand() - 0.5);
    expect(0.4 * populationSd(exactR)).toBe(2);
    for (const [x, rf, m] of [[noisy, 0.2, 1], [noisy, 0.2, 2], [noisy, 0.2, 3], [exactR, 0.4, 1], [exactR, 0.4, 2], [exactR, 0.4, 3]] as const) {
      const r = rf * populationSd(x);
      let a = 0;
      let b = 0;
      for (let i = 0; i < x.length - m; i++) {
        for (let j = i + 1; j < x.length - m; j++) {
          let d = 0;
          for (let k = 0; k < m; k++) d = Math.max(d, Math.abs(x[i + k] - x[j + k]));
          if (d > r) continue;
          b++;
          if (Math.abs(x[i + m] - x[j + m]) <= r) a++;
        }
      }
      expect(sampleEntropy(x, m, rf)).toMatchObject({ a, b });
    }
  });

  it("returns undefined, without crashing, when it can't be computed", () => {
    expect(sampleEntropy([800, 800, 800, 800, 800]).value).toBeUndefined(); // flat: SD 0
    expect(sampleEntropy([800, 810]).value).toBeUndefined(); // too short
    expect(sampleEntropy([1, 5, 9, 2, 7, 3]).value).toBeUndefined(); // no template pairs match
    expect(sampleEntropy([]).value).toBeUndefined();
  });
});

describe("mannWhitney", () => {
  it("counts wins as U and handles ties as half", () => {
    expect(mannWhitney([3, 4], [1, 2])).toMatchObject({ u: 4, pairs: 4 });
    expect(mannWhitney([2], [2]).u).toBe(0.5);
  });

  it("gives p = 1 for identical groups and a small p for separated ones", () => {
    expect(mannWhitney([1, 2, 3], [1, 2, 3]).p).toBeCloseTo(1, 6);
    expect(mannWhitney([11, 12, 13, 14, 15, 16, 17, 18, 19, 20], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).p).toBeLessThan(0.001);
  });
});

describe("Fantasia: whole recording, m = 2, r = 0.2 SD (lead's numpy reference)", () => {
  it(
    "reproduces the group medians, ranges, pair count and p-value",
    () => {
      const raw = JSON.parse(readFileSync(path.resolve(__dirname, "../../public/data/fantasia-nn.json"), "utf-8"));
      const { records } = parseFantasia(raw);
      const byGroup = (g: string) => records.filter((r) => r.group === g).map((r) => sampleEntropy(r.nn, 2, 0.2).value!);
      const young = byGroup("young");
      const elderly = byGroup("elderly");
      expect([young.length, elderly.length]).toEqual([20, 20]);
      expect([...young, ...elderly].every(Number.isFinite)).toBe(true);
      expect(median(young).toFixed(3)).toBe("1.406");
      expect(median(elderly).toFixed(3)).toBe("1.277");
      expect([Math.min(...young), Math.max(...young)].map((v) => v.toFixed(2))).toEqual(["1.20", "1.69"]);
      expect([Math.min(...elderly), Math.max(...elderly)].map((v) => v.toFixed(2))).toEqual(["0.70", "1.63"]);
      const mw = mannWhitney(young, elderly);
      expect(mw).toMatchObject({ u: 299, pairs: 400 });
      expect(mw.p.toPrecision(2)).toBe("0.0074");
    },
    60_000,
  );
});
