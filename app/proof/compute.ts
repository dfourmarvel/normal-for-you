import type { Correction } from "@/lib/data/osd569";
import type { RangeRow, Tables } from "@/lib/data/tables";
import { baseline, evaluate, rcvForRow, zFor, type PopulationCvRow } from "@/lib/engine";
import { MIN_BASELINE_READINGS } from "@/lib/engine/baseline";
import { INDICATOR_LABEL, capitalize } from "@/lib/engine/format";
import type { Answer, Indicator, Reading, Verdict } from "@/lib/types";

export const DATA_NOTE_ID = "data-note-section";
export const DATA_NOTE_WORDS = "data note"; // the page turns these words into a link to DATA_NOTE_ID

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
  /** Why there is no baseline, when a pre-flight draw was left out of the file's data. */
  baseNote?: string;
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
      baseNote: base === null ? droppedBaselineText(corrections, id, indicator) ?? undefined : undefined,
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

/** Says why a crew member has no baseline when pre-flight draws of this marker were left out of the file's data; null otherwise. */
export function droppedBaselineText(corrections: readonly Correction[], crewId: string, indicator: Indicator): string | null {
  const draws = corrections
    .filter((c) => c.astronautId === crewId && c.draw.startsWith("L") && c.changes.some((ch) => ch.indicator === indicator && ch.usedValue === null))
    .map((c) => c.draw);
  if (draws.length === 0) return null;
  return `Not enough pre-flight draws: the ${listOf(draws)} ${draws.length === 1 ? "draw was" : "draws were"} left out (see the ${DATA_NOTE_WORDS})`;
}

/** The "honest limits" line about how many pre-flight draws each personal band rests on, counted from the data. */
export function preflightDrawsSentence(m: MarkerView): string {
  const counts = m.crew.map((c) => ({ id: c.id, n: c.draws.filter((d) => d.phase === "preflight").length }));
  const most = Math.max(...counts.map((c) => c.n));
  const fewer = counts.filter((c) => c.n !== most);
  const note = fewer.length
    ? ` (${fewer.map((c) => `${c.id}: ${c.n}`).join(", ")}${fewer.some((c) => c.n < MIN_BASELINE_READINGS) ? ", too few for a band" : ""})`
    : "";
  return `Personal bands use ${most} pre-flight draws each${note}; the method papers recommend 5 for a trend check.`;
}

/** A plain line when the first post-flight change sits within 1 percentage point of its limit, either side; null otherwise. */
export function closeCall({ changePct, rcvPct }: Pick<Answer, "changePct" | "rcvPct">): string | null {
  if (changePct === undefined || rcvPct === undefined || Math.abs(changePct - rcvPct) >= 1) return null;
  const gap = Math.abs(Number(changePct.toFixed(1)) - Number(rcvPct.toFixed(1))).toFixed(1);
  const inside = Math.abs(changePct) <= Math.abs(rcvPct);
  return `Close call: ${fmtPct(changePct, 1)} against a limit of ${fmtPct(rcvPct, 1)}, ${gap} points ${inside ? "inside the band" : "past the limit"}.`;
}

/** The data-note opening, worded for the kinds of corrected rows present. */
export function dataNoteIntro(corrections: readonly Correction[]): string {
  const shifted = corrections.filter((c) => c.kind === "shifted").length;
  const unverifiable = corrections.length - shifted;
  const rows = (n: number) => (n === 1 ? "One row" : `${n} rows`);
  return [
    shifted > 0 && `${rows(shifted)} in NASA's file ${shifted === 1 ? "has" : "have"} cell counts in the wrong columns. Charts mark rebuilt points with a hollow dot.`,
    unverifiable > 0 && `${rows(unverifiable)} in NASA's file can't be checked against its own white-cell totals, so ${unverifiable === 1 ? "its" : "their"} white-cell values are left out.`,
  ].filter(Boolean).join(" ");
}

/** One plain sentence per corrected row, built from what the parser changed. */
export function correctionSentence(c: Correction): string {
  const names = (keep: boolean) => listOf(c.changes.filter((ch) => (ch.usedValue !== null) === keep).map((ch) => INDICATOR_LABEL[ch.indicator]));
  const rebuilt = names(true);
  const dropped = names(false);
  if (c.kind === "unverifiable") {
    return `Crew ${c.astronautId}, ${describeDraw(c.draw)} (${c.draw}): its white-cell counts can't be checked against its own percentages and total white count. We left out ${dropped}. Its other values are used as filed.`;
  }
  const parts = [
    rebuilt && `rebuilt ${rebuilt} from the percentages and total white count in the same row`,
    dropped && `left out ${dropped}, which can't be rebuilt`,
  ].filter(Boolean);
  return `Crew ${c.astronautId}, ${describeDraw(c.draw)} (${c.draw}): its white-cell counts don't match its own percentages × total white count, so its cells are in the wrong columns. We ${parts.join(", and ")}. Its other values are used as filed.`;
}

export const changeLabel = (ch: Correction["changes"][number]): string => capitalize(INDICATOR_LABEL[ch.indicator]);
