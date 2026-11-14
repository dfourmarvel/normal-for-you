import { describe, expect, it } from "vitest";
import { chanceSentence, fmtP, headline, summarise, type Person } from "./summary";

const person = (id: string, group: Person["group"], age: number, value: number | undefined): Person => ({ id, group, age, sex: "F", intervals: 7000, value });

describe("heart-rhythm summary", () => {
  const people = [
    person("y1", "young", 21, 1.5),
    person("y2", "young", 30, 1.4),
    person("y3", "young", 34, undefined),
    person("o1", "elderly", 70, 1.3),
    person("o2", "elderly", 85, 1.45),
  ];
  const s = summarise(people);

  it("leaves out records with no number and reports them", () => {
    expect(s.failed.map((p) => p.id)).toEqual(["y3"]);
    expect(s.young).toMatchObject({ n: 2, median: 1.45, min: 1.4, max: 1.5, ageMin: 21, ageMax: 30 }); // ages of the people with a number only
    expect(s.elderly).toMatchObject({ n: 2, ageMin: 70, ageMax: 85 });
    expect(s.test).toMatchObject({ u: 3, pairs: 4 });
  });

  it("builds the headline from the numbers", () => {
    expect(headline(s)).toBe(
      "Young adults' heart rhythms were less predictable: median 1.450 against 1.375 for older adults. In 3 of 4 young–older pairs, the young person scored higher.",
    );
    const flipped = summarise([person("y", "young", 25, 1), person("o", "elderly", 75, 2)]);
    expect(headline(flipped)).toContain("were more predictable");
  });

  it("states the chance in plain words", () => {
    expect(fmtP(0.00742)).toBe("0.0074");
    expect(fmtP(0.0002)).toBe("below 0.001");
    expect(chanceSentence({ ...s, test: { u: 299, pairs: 400, p: 0.00742 } })).toBe(
      "If age made no difference, a split at least this uneven, either way, would happen by chance about 7 times in 1,000 (Mann–Whitney test, p = 0.0074).",
    );
  });

  it("refuses to compare when a group has no numbers", () => {
    expect(() => summarise([person("y", "young", 25, 1), person("o", "elderly", 75, undefined)])).toThrow();
  });
});
