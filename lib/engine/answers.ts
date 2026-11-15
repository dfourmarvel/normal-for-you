import type { Edge, LimitRow, PhaseRow, Tables, VariationRow } from "@/lib/data/tables";
import type { Answer, Phase, Reading } from "@/lib/types";
import { MIN_BASELINE_READINGS, MIN_OWN_SD_READINGS, mean, median, preflightValues, sampleSD } from "./baseline";
import { fmtNum } from "./format";
import { isBadDirection, ownSdLimits, rcvForRow, type RcvLimits } from "./rcv";
import { previousReading } from "./series";

export interface EvalCtx { phase: Phase; missionDay: number }

const ENVIRONMENT = new Set<Reading["indicator"]>(["co2", "radDose"]);
export const isEnvironment = (r: Reading): boolean => ENVIRONMENT.has(r.indicator);

const ENV_COMPARE = "not applicable (cabin reading)";
const NO_VALUE = "no valid reading";

function notMeasured(question: Answer["question"], reading: Reading, compareTo: string, extra: Partial<Answer> = {}): Answer {
  return { question, status: "notMeasured", value: reading.value, compareTo, source: "", ...extra };
}

// "past" = on the far side of the edge; an inclusive edge also counts its own value.
const pastBelow = (v: number, e: Edge): boolean => v < e.value || (e.inclusive && v === e.value);
const pastAbove = (v: number, e: Edge): boolean => v > e.value || (e.inclusive && v === e.value);

const BREACH: Record<LimitRow["breachedWhen"], (v: number, limit: number) => boolean> = {
  above: (v, l) => v > l,
  atOrAbove: (v, l) => v >= l,
  below: (v, l) => v < l,
  atOrBelow: (v, l) => v <= l,
};

export interface PeopleResult { answer: Answer; limit?: LimitRow }

export function peopleAnswer(reading: Reading, tables: Tables): PeopleResult {
  const { value, indicator } = reading;
  if (!Number.isFinite(value)) return { answer: notMeasured("people", reading, NO_VALUE) };

  const rows = tables.limits.filter((l) => l.indicator === indicator);
  const limit = rows.find((l) => BREACH[l.breachedWhen](value, l.limit));
  if (limit) return { limit, answer: { question: "people", status: "act", value, compareTo: limit.label, source: limit.source } };

  const range = tables.ranges.find((r) => r.indicator === indicator);
  if (range) {
    const { low, high, critLow, critHigh } = range;
    const act = (critLow !== undefined && pastBelow(value, critLow)) || (critHigh !== undefined && pastAbove(value, critHigh));
    const normal = (low === undefined || pastAbove(value, low)) && (high === undefined || pastBelow(value, high));
    return { answer: { question: "people", status: act ? "act" : normal ? "nominal" : "watch", value, compareTo: range.label, source: range.source } };
  }
  if (rows.length) return { answer: { question: "people", status: "nominal", value, compareTo: rows[0].label, source: rows[0].source } };
  return { answer: { question: "people", status: "nominal", value, compareTo: "no population range; judged on your own baseline only", source: "" } };
}

export interface YouResult {
  answer: Answer;
  base?: number;
  changePct?: number;
  limits?: RcvLimits;
  row?: VariationRow;
}

const thin = (n: number, need: number) => `baseline too thin (${n} pre-flight readings, need ${need})`;

export function youAnswer(reading: Reading, history: readonly Reading[], tables: Tables): YouResult {
  const { value, indicator, astronautId } = reading;
  if (isEnvironment(reading)) return { answer: { question: "you", status: "nominal", value, compareTo: ENV_COMPARE, source: "" } };
  if (!Number.isFinite(value)) return { answer: notMeasured("you", reading, NO_VALUE) };

  const row = tables.variation.find((v) => v.indicator === indicator);
  const values = preflightValues(history, astronautId, indicator);
  const ownSD = row?.method === "ownSD";
  const need = ownSD ? MIN_OWN_SD_READINGS : MIN_BASELINE_READINGS;
  if (values.length < need) return { answer: notMeasured("you", reading, thin(values.length, need)) };
  // Compared value by value: a mean of identical readings can carry rounding error, which would fake a tiny spread.
  if (ownSD && values.every((v) => v === values[0])) {
    return { answer: notMeasured("you", reading, "baseline has no spread; need varied pre-flight readings") };
  }

  const base = ownSD ? mean(values) : median(values);
  if (base === 0) return { answer: notMeasured("you", reading, "baseline is zero; percentage change undefined") };
  const changePct = ((value - base) / base) * 100;
  if (!row) return { base, changePct, answer: notMeasured("you", reading, "no biological-variation data", { changePct }) };

  const limits = row.method === "ownSD"
    ? ownSdLimits(values.length, sampleSD(values), base, row.badDirection)
    : rcvForRow(row);
  const dp = base >= 100 ? 0 : 1;
  const fmtBand = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: dp });
  const compareTo = `your band ${fmtBand(base * (1 + limits.downPct / 100))}–${fmtBand(base * (1 + limits.upPct / 100))}`;
  const dirUp = changePct >= 0;
  const rcvPct = dirUp ? limits.upPct : limits.downPct;
  const outside = changePct < limits.downPct || changePct > limits.upPct;

  let status: Answer["status"] = "nominal";
  if (outside) {
    status = "watch";
    if (isBadDirection(row.badDirection, changePct)) {
      const prev = previousReading(history, reading);
      const prevChange = prev && ((prev.value - base) / base) * 100;
      const prevOutsideSameWay = prevChange !== undefined && (dirUp ? prevChange > limits.upPct : prevChange < limits.downPct);
      if (prevOutsideSameWay) status = "act";
    }
  }
  return { base, changePct, limits, row, answer: { question: "you", status, value, compareTo, changePct, rcvPct, source: row.source } };
}

export interface TodayResult { answer: Answer; expectedMatch: boolean; phaseRow?: PhaseRow }

export function todayAnswer(reading: Reading, you: YouResult, ctx: EvalCtx, tables: Tables): TodayResult {
  const { value, indicator } = reading;
  const asToday = (a: Answer): Answer => ({ ...a, question: "today" });
  if (isEnvironment(reading) || !Number.isFinite(value)) return { expectedMatch: false, answer: asToday(you.answer) };
  if (you.changePct === undefined) return { expectedMatch: false, answer: notMeasured("today", reading, "needs a baseline") };

  const { changePct } = you;
  const youStatus = you.answer.status;
  const carry = { changePct, rcvPct: you.answer.rcvPct };
  const phaseRow = tables.phases.find((p) => p.phase === ctx.phase && p.indicator === indicator);
  const make = (status: Answer["status"], compareTo: string, expectedMatch = false): TodayResult =>
    ({ expectedMatch, phaseRow, answer: { question: "today", status, value, compareTo, ...carry, source: phaseRow?.source ?? "" } });

  if (!phaseRow || phaseRow.expected === "noEvidence") return make(youStatus, "no known change for this phase, so the change from your normal stands");
  if (!you.limits) return make("notMeasured", "no biological-variation data");

  const within = changePct >= you.limits.downPct && changePct <= you.limits.upPct;
  if (phaseRow.expected === "none") return make(within ? "nominal" : "watch", `no change expected in ${ctx.phase}`);

  const wantUp = phaseRow.expected === "up";
  const inExpectedDirection = wantUp ? changePct > 0 : changePct < 0;
  const tooBig = phaseRow.maxChangePct !== undefined && Math.abs(changePct) > phaseRow.maxChangePct;
  if (inExpectedDirection) {
    return tooBig
      ? make("watch", `bigger than expected for ${ctx.phase}`)
      : make("nominal", `expected for ${ctx.phase}`, true);
  }
  return make(within ? "nominal" : "watch", within ? `no clear change for ${ctx.phase}` : `opposite to what is expected for ${ctx.phase}`);
}

export const describeChange = (changePct: number): string =>
  `${fmtNum(Math.abs(changePct))}% ${changePct < 0 ? "below" : "above"} your own normal`;
