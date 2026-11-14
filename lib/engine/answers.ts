import type { LimitRow, PhaseRow, Tables, VariationRow } from "@/lib/data/tables";
import type { Answer, Phase, Reading } from "@/lib/types";
import { baseline, countPreflight, MIN_BASELINE_READINGS } from "./baseline";
import { fmtNum } from "./format";
import { isBadDirection, rcvForRow, type RcvLimits } from "./rcv";

export interface EvalCtx { phase: Phase; missionDay: number }

const ENVIRONMENT = new Set<Reading["indicator"]>(["co2", "radDose"]);
export const isEnvironment = (r: Reading): boolean => ENVIRONMENT.has(r.indicator);

const ENV_COMPARE = "not applicable (cabin reading)";
const NO_VALUE = "no valid reading";

function notMeasured(question: Answer["question"], reading: Reading, compareTo: string, extra: Partial<Answer> = {}): Answer {
  return { question, status: "notMeasured", value: reading.value, compareTo, source: "", ...extra };
}

export interface PeopleResult { answer: Answer; limit?: LimitRow }

export function peopleAnswer(reading: Reading, tables: Tables): PeopleResult {
  const { value, indicator } = reading;
  if (!Number.isFinite(value)) return { answer: notMeasured("people", reading, NO_VALUE) };

  const limit = tables.limits.find((l) => l.indicator === indicator);
  if (limit && (limit.breachedWhen === "above" ? value > limit.limit : value < limit.limit)) {
    return { limit, answer: { question: "people", status: "act", value, compareTo: limit.label, source: limit.source } };
  }
  const range = tables.ranges.find((r) => r.indicator === indicator);
  if (range) {
    const { low, high, critLow, critHigh } = range;
    const act = (critLow !== undefined && value <= critLow) || (critHigh !== undefined && value >= critHigh);
    const watch = (low !== undefined && value < low) || (high !== undefined && value > high);
    return { answer: { question: "people", status: act ? "act" : watch ? "watch" : "nominal", value, compareTo: range.label, source: range.source } };
  }
  if (limit) return { answer: { question: "people", status: "nominal", value, compareTo: limit.label, source: limit.source } };
  return { answer: { question: "people", status: "nominal", value, compareTo: "no population range; judged on your own baseline only", source: "" } };
}

export interface YouResult {
  answer: Answer;
  base?: number;
  changePct?: number;
  limits?: RcvLimits;
  row?: VariationRow;
}

function previousPostflightChange(history: readonly Reading[], reading: Reading, base: number): number | undefined {
  let prev: Reading | undefined;
  for (const r of history) {
    if (r.astronautId !== reading.astronautId || r.indicator !== reading.indicator) continue;
    if (r.phase === "preflight" || r.missionDay >= reading.missionDay || !Number.isFinite(r.value)) continue;
    if (!prev || r.missionDay > prev.missionDay) prev = r;
  }
  return prev ? ((prev.value - base) / base) * 100 : undefined;
}

export function youAnswer(reading: Reading, history: readonly Reading[], tables: Tables): YouResult {
  const { value, indicator, astronautId } = reading;
  if (isEnvironment(reading)) return { answer: { question: "you", status: "nominal", value, compareTo: ENV_COMPARE, source: "" } };
  if (!Number.isFinite(value)) return { answer: notMeasured("you", reading, NO_VALUE) };

  const base = baseline(history, astronautId, indicator);
  if (base === null) {
    const n = countPreflight(history, astronautId, indicator);
    return { answer: notMeasured("you", reading, `baseline too thin (${n} pre-flight readings, need ${MIN_BASELINE_READINGS})`) };
  }
  if (base === 0) return { answer: notMeasured("you", reading, "baseline is zero; percentage change undefined") };
  const changePct = ((value - base) / base) * 100;

  const row = tables.variation.find((v) => v.indicator === indicator);
  if (!row) return { base, changePct, answer: notMeasured("you", reading, "no biological-variation data", { changePct }) };

  const limits = rcvForRow(row);
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
      const prev = previousPostflightChange(history, reading, base);
      const prevOutsideSameWay = prev !== undefined && (dirUp ? prev > limits.upPct : prev < limits.downPct);
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

  if (!phaseRow || phaseRow.expected === "noEvidence") return make(youStatus, "no clear evidence for this phase");
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
