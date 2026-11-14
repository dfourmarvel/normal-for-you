import type { RangeRow, Tables } from "@/lib/data/tables";
import { baseline, evaluate, rcvForRow, zFor, type PopulationCvRow } from "@/lib/engine";
import type { Indicator, Reading, Verdict } from "@/lib/types";

export const MARKERS: { indicator: Indicator; label: string }[] = [
  { indicator: "lymphAbs", label: "Lymphocytes" },
  { indicator: "neutAbs", label: "Neutrophils" },
  { indicator: "wbc", label: "White cells" },
  { indicator: "hb", label: "Haemoglobin" },
  { indicator: "plt", label: "Platelets" },
];

export interface Draw { label: string; missionDay: number; value: number; phase: Reading["phase"] }

export interface CrewView {
  id: string;
  unit: string;
  draws: Draw[];
  base: number | null;
  band?: { low: number; high: number };
  post: { label: string; verdict: Verdict }[];
}

export interface MarkerView {
  indicator: Indicator;
  row: PopulationCvRow;
  z: number;
  rcv: { upPct: number; downPct: number };
  range?: RangeRow;
  crew: CrewView[];
  peopleNormal: number;
  peopleJudged: number;
  youChanged: number;
  youJudged: number;
}

// The draw label ("L-92", "R+1") is read from the sample name the parser keeps in the reading id.
export function drawLabel(r: Reading): string {
  const m = /_([LR][+-]\d+)_cbc_/.exec(r.id);
  if (!m) throw new Error(`OSD-569: no draw label in "${r.id}"`);
  return m[1];
}

export function buildMarker(indicator: Indicator, readings: readonly Reading[], tables: Tables): MarkerView {
  const row = tables.variation.find((v) => v.indicator === indicator);
  if (!row || row.method !== "populationCV") throw new Error(`No published within-person CV for ${indicator}`);
  const rcv = rcvForRow(row);
  const range = tables.ranges.find((r) => r.indicator === indicator);

  const mine = readings.filter((r) => r.indicator === indicator);
  const ids = [...new Set(mine.map((r) => r.astronautId))].sort();
  if (ids.length === 0) throw new Error(`No ${indicator} readings in the file`);

  const crew = ids.map((id): CrewView => {
    const history = mine.filter((r) => r.astronautId === id).sort((a, b) => a.missionDay - b.missionDay);
    const base = baseline(history, id, indicator);
    const post = history
      .filter((r) => r.phase === "postflight")
      .map((r) => ({ label: drawLabel(r), verdict: evaluate(r, history, { phase: "postflight", missionDay: r.missionDay }, tables) }));
    return {
      id,
      unit: history[0].unit,
      draws: history.map((r) => ({ label: drawLabel(r), missionDay: r.missionDay, value: r.value, phase: r.phase })),
      base,
      band: base === null ? undefined : { low: base * (1 + rcv.downPct / 100), high: base * (1 + rcv.upPct / 100) },
      post,
    };
  });

  const peopleAnswers = crew.flatMap((c) => c.post.map((p) => p.verdict.answers[0])).filter((a) => a.status !== "notMeasured");
  const firstYou = crew.map((c) => c.post[0]?.verdict.answers[1]).filter((a) => a !== undefined && a.status !== "notMeasured");

  return {
    indicator,
    row,
    z: zFor(row.badDirection),
    rcv,
    range,
    crew,
    peopleNormal: peopleAnswers.filter((a) => a.status === "nominal").length,
    peopleJudged: peopleAnswers.length,
    youChanged: firstYou.filter((a) => a?.status === "watch" || a?.status === "act").length,
    youJudged: firstYou.length,
  };
}

export function fmtValue(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 1 });
}

export function fmtPct(n: number, dp = 0): string {
  const s = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: dp, minimumFractionDigits: dp });
  return Number(n.toFixed(dp)) === 0 ? `${s}%` : `${n < 0 ? "−" : "+"}${s}%`;
}

const countOf = (n: number, total: number, noun: string): string =>
  n === 0 ? `none of the ${total} ${noun}` : n === total ? `all ${total} ${noun}` : `${n} of ${total} ${noun}`;

export function summarySentence(m: MarkerView, firstLabel: string): string {
  if (m.peopleJudged === 0) return "No post-flight results for this marker could be judged against the lab range.";
  const people = `The lab range called ${countOf(m.peopleNormal, m.peopleJudged, "post-flight results")} normal.`;
  const when = firstLabel === "R+1" ? "the day after landing" : `at the first draw after landing (${firstLabel})`;
  const you = m.youJudged === 0
    ? "No crew member had enough pre-flight draws for a personal baseline."
    : `Against their own pre-flight baseline, ${countOf(m.youChanged, m.youJudged, "crew")} changed beyond their reference change value ${when}.`;
  return `${people} ${you}`;
}
