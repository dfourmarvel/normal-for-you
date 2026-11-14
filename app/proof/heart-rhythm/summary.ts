import { mannWhitney, median, type MannWhitneyResult } from "@/lib/engine";
import type { FantasiaGroup } from "@/lib/data/fantasia";

export interface Person {
  id: string;
  group: FantasiaGroup;
  age: number | null;
  sex: "M" | "F" | null;
  /** Normal-to-normal intervals the number was worked out from. */
  intervals: number;
  value: number | undefined;
}

export interface GroupStats { n: number; median: number; min: number; max: number; ageMin: number; ageMax: number }

export interface Summary {
  young: GroupStats;
  elderly: GroupStats;
  /** U is counted for the young group: pairs where the young person scored higher. */
  test: MannWhitneyResult;
  /** Records whose number could not be worked out (left out of the comparison). */
  failed: Person[];
}

export const GROUP_LABEL: Record<FantasiaGroup, string> = { young: "Young", elderly: "Older" };

export const fmt = (v: number, dp = 3) => v.toFixed(dp);

export const fmtP = (p: number) => (p < 0.001 ? "below 0.001" : p.toPrecision(2));

function stats(people: Person[]): GroupStats {
  const vals = people.map((p) => p.value!);
  const ages = people.flatMap((p) => (p.age === null ? [] : [p.age]));
  return { n: vals.length, median: median(vals), min: Math.min(...vals), max: Math.max(...vals), ageMin: Math.min(...ages), ageMax: Math.max(...ages) };
}

export function summarise(people: Person[]): Summary {
  const ok = people.filter((p) => p.value !== undefined);
  const young = ok.filter((p) => p.group === "young");
  const elderly = ok.filter((p) => p.group === "elderly");
  if (!young.length || !elderly.length) throw new Error("Need at least one young and one older recording with a number");
  return {
    young: stats(young),
    elderly: stats(elderly),
    test: mannWhitney(young.map((p) => p.value!), elderly.map((p) => p.value!)),
    failed: people.filter((p) => p.value === undefined),
  };
}

export function headline({ young, elderly, test }: Summary): string {
  const diff = young.median - elderly.median;
  const lead =
    Math.abs(diff) < 0.0005
      ? `Young and older adults had about the same heart rhythm predictability (median ${fmt(young.median)} and ${fmt(elderly.median)}).`
      : `Young adults' heart rhythms were ${diff > 0 ? "less" : "more"} predictable: median ${fmt(young.median)} against ${fmt(elderly.median)} for older adults.`;
  return `${lead} In ${test.u} of ${test.pairs} young–older pairs, the young person scored higher.`;
}

export function chanceSentence({ test }: Summary): string {
  const per1000 = Math.round(test.p * 1000);
  const odds = per1000 < 1 ? "less than once in 1,000" : `about ${per1000.toLocaleString("en")} times in 1,000`;
  return `If age made no difference, a split at least this uneven, either way, would happen by chance ${odds} (Mann–Whitney test, p = ${fmtP(test.p)}).`;
}
