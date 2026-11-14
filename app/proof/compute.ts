import type { Correction } from "@/lib/data/osd569";
import type { RangeRow, Tables } from "@/lib/data/tables";
import { baseline, evaluate, rcvForRow, zFor, type PopulationCvRow } from "@/lib/engine";
import { INDICATOR_LABEL, capitalize } from "@/lib/engine/format";
import type { Indicator, Reading, Verdict } from "@/lib/types";

export const MARKERS: { indicator: Indicator; label: string }[] = [
  { indicator: "lymphAbs", label: "Lymphocytes" },
  { indicator: "neutAbs", label: "Neutrophils" },
  { indicator: "wbc", label: "White cells" },
  { indicator: "hb", label: "Haemoglobin" },
  { indicator: "plt", label: "Platelets" },
];

export interface Draw { label: string; missionDay: number; value: number; phase: Reading["phase"]; rebuilt: boolean }

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
  /** Distinct labels of the first post-flight draw behind youChanged/youJudged. */
  firstLabels: string[];
  /** Crew with a post-flight draw but no personal baseline, and why. */
  noBaseline: { id: string; reason: string }[];
}

// The draw label ("L-92", "R+1") is read from the sample name the parser keeps in the reading id.
export function drawLabel(r: Reading): string {
  const m = /_([LR][+-]\d+)_cbc_/.exec(r.id);
  if (!m) throw new Error(`OSD-569: no draw label in "${r.id}"`);
  return m[1];
}

export function buildMarker(indicator: Indicator, readings: readonly Reading[], tables: Tables, corrections: readonly Correction[] = []): MarkerView {
  const row = tables.variation.find((v) => v.indicator === indicator);
  if (!row || row.method !== "populationCV") throw new Error(`No published within-person CV for ${indicator}`);
  const rcv = rcvForRow(row);
  const range = tables.ranges.find((r) => r.indicator === indicator);

  // Reading ids are `${sample}_${indicator}` (see the parser).
  const rebuiltIds = new Set(
    corrections.filter((c) => c.changes.some((ch) => ch.indicator === indicator && ch.usedValue !== null)).map((c) => `${c.sample}_${indicator}`),
  );
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
      draws: history.map((r) => ({ label: drawLabel(r), missionDay: r.missionDay, value: r.value, phase: r.phase, rebuilt: rebuiltIds.has(r.id) })),
      base,
      band: base === null ? undefined : { low: base * (1 + rcv.downPct / 100), high: base * (1 + rcv.upPct / 100) },
      post,
    };
  });

  const peopleAnswers = crew.flatMap((c) => c.post.map((p) => p.verdict.answers[0])).filter((a) => a.status !== "notMeasured");
  const firsts = crew.flatMap((c) => (c.post[0] ? [{ id: c.id, label: c.post[0].label, you: c.post[0].verdict.answers[1] }] : []));
  const judged = firsts.filter((f) => f.you.status !== "notMeasured");

  return {
    indicator,
    row,
    z: zFor(row.badDirection),
    rcv,
    range,
    crew,
    peopleNormal: peopleAnswers.filter((a) => a.status === "nominal").length,
    peopleJudged: peopleAnswers.length,
    youChanged: judged.filter((f) => f.you.status === "watch" || f.you.status === "act").length,
    youJudged: judged.length,
    firstLabels: [...new Set(judged.map((f) => f.label))],
    noBaseline: firsts.filter((f) => f.you.status === "notMeasured").map((f) => ({ id: f.id, reason: f.you.compareTo })),
  };
}

export function fmtValue(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 1 });
}

// Variation inputs keep their published precision (CVA 5.45%, not 5.5%).
export const fmtCv = (n: number): string => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;

export function fmtPct(n: number, dp = 0): string {
  const s = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: dp, minimumFractionDigits: dp });
  return Number(n.toFixed(dp)) === 0 ? `${s}%` : `${n < 0 ? "−" : "+"}${s}%`;
}

const countOf = (n: number, total: number, noun: string): string =>
  n === 0 ? `none of the ${total} ${noun}` : n === total ? `all ${total} ${noun}` : `${n} of ${total} ${noun}`;

export function summarySentence(m: MarkerView): string {
  if (m.peopleJudged === 0) return "No post-flight results for this marker could be judged against the lab range.";
  const people = `The lab range called ${countOf(m.peopleNormal, m.peopleJudged, "post-flight results")} normal.`;
  if (m.youJudged === 0) return `${people} No crew member had enough pre-flight draws for a personal baseline.`;
  const [only] = m.firstLabels;
  const when = m.firstLabels.length > 1
    ? "at each one's first draw after landing"
    : only === "R+1" ? "the day after landing" : `at the first draw after landing (${only})`;
  const noun = m.noBaseline.length ? "crew with a baseline" : "crew";
  const you = `Against their own pre-flight baseline, ${countOf(m.youChanged, m.youJudged, noun)} changed beyond their reference change value ${when}.`;
  const left = m.noBaseline.map((c) => `${c.id} is left out: ${c.reason}.`);
  return [people, you, ...left].join(" ");
}

/** Crew count and draws per crew member, counted from the sample names in the file. */
export function studyShape(readings: readonly Reading[]): { crew: number; draws: string } {
  const per = new Map<string, Set<string>>();
  for (const r of readings) per.set(r.astronautId, (per.get(r.astronautId) ?? new Set()).add(drawLabel(r)));
  const counts = [...per.values()].map((s) => s.size);
  const lo = Math.min(...counts);
  const hi = Math.max(...counts);
  return { crew: per.size, draws: lo === hi ? `${lo}` : `${lo}–${hi}` };
}

export function describeDraw(draw: string): string {
  const m = /^([LR])([+-])(\d+)$/.exec(draw);
  if (!m) return draw;
  const days = `${m[3]} day${m[3] === "1" ? "" : "s"}`;
  return m[1] === "L" ? `${days} before launch` : `${days} after landing`;
}

const listOf = (xs: string[]): string => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** One plain sentence per corrected row, built from what the parser changed. */
export function correctionSentence(c: Correction): string {
  const names = (keep: boolean) => listOf(c.changes.filter((ch) => (ch.usedValue !== null) === keep).map((ch) => INDICATOR_LABEL[ch.indicator]));
  const rebuilt = names(true);
  const dropped = names(false);
  const parts = [
    rebuilt && `rebuilt ${rebuilt} from the percentages and total white count in the same row`,
    dropped && `left out ${dropped}, which can't be rebuilt`,
  ].filter(Boolean);
  return `Crew ${c.astronautId}, ${describeDraw(c.draw)} (${c.draw}): its white-cell counts don't match its own percentages × total white count, so its cells are in the wrong columns. We ${parts.join(", and ")}. Its other values are used as filed.`;
}

export const changeLabel = (ch: Correction["changes"][number]): string => capitalize(INDICATOR_LABEL[ch.indicator]);
