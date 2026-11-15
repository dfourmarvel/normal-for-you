// Daily self-check logic: form fields, validation, sample values, stored history and the overall decision. No React here.
import { actionLines, answerLines, PHASE_LABEL, SCREENING, SEND_DELAY, STATUS_LABEL, valueText } from "@/app/astronaut/model";
import type { Tables } from "@/lib/data/tables";
import { variation } from "@/lib/data/variation";
import { evaluate, median, worst } from "@/lib/engine";
import { capitalize, INDICATOR_LABEL } from "@/lib/engine/format";
import { phaseForDay, simulateAstronaut } from "@/lib/testCrew";
import type { Indicator, Phase, Reading, Status, Verdict } from "@/lib/types";

export const ASTRONAUT_ID = "A"; // the sample history is test astronaut A's, so every check-in is filed under A
export const FIRST_DAY = 0;
export const LAST_DAY = 180;
export const DEFAULT_DAY = 100;
export const STORAGE_KEY = "biotensor-check:v1";
export const SAMPLE_HISTORY_LABEL = "Your sample history is simulated. Readings stay in this browser. Screening, not a diagnosis.";

export type GroupId = "heart" | "body" | "brain" | "blood";
export const GROUPS: { id: GroupId; label: string; hint?: string }[] = [
  { id: "heart", label: "Heart and blood pressure" },
  { id: "body", label: "Temperature, oxygen and glucose" },
  { id: "brain", label: "Sleep, fatigue and mood" },
  { id: "blood", label: "Blood test today", hint: "Only if you had a blood count today." },
];

export interface Field {
  indicator: Indicator;
  group: GroupId;
  label: string;
  unit: string;   // stored on the Reading, as the engine and the sample history write it
  suffix: string; // shown next to the input
  min: number;
  max: number;
  dp: number;     // decimals the sample values are rounded to
  whole?: boolean; // scores: whole numbers only
  hint?: string;
}

// Bounds reject typing slips and impossible values, not unusual ones: the engine judges anything inside them.
export const FIELDS: Field[] = [
  { indicator: "restingHR", group: "heart", label: "Resting heart rate", unit: "bpm", suffix: "bpm", min: 20, max: 250, dp: 0, hint: "Seated, after a few minutes still." },
  { indicator: "sbp", group: "heart", label: "Systolic (top number)", unit: "mmHg", suffix: "mmHg", min: 50, max: 260, dp: 0 },
  { indicator: "dbp", group: "heart", label: "Diastolic (bottom number)", unit: "mmHg", suffix: "mmHg", min: 20, max: 160, dp: 0 },
  { indicator: "tempC", group: "body", label: "Temperature (oral)", unit: "°C", suffix: "°C", min: 30, max: 45, dp: 1 },
  { indicator: "spo2", group: "body", label: "Blood oxygen (SpO2)", unit: "%", suffix: "%", min: 50, max: 100, dp: 0 },
  { indicator: "glucose", group: "body", label: "Glucose (fasting)", unit: "mg/dL", suffix: "mg/dL", min: 20, max: 600, dp: 0 },
  { indicator: "sleepHours", group: "brain", label: "Sleep (3-night average)", unit: "h (3-night average)", suffix: "h", min: 0, max: 24, dp: 2 },
  { indicator: "fatigueSP", group: "brain", label: "Fatigue (Samn-Perelli)", unit: "Samn-Perelli 1–7", suffix: "1–7", min: 1, max: 7, dp: 0, whole: true, hint: "1 = fully alert, 7 = completely exhausted." },
  { indicator: "moodPHQ2", group: "brain", label: "Mood (PHQ-2)", unit: "PHQ-2 0–6", suffix: "0–6", min: 0, max: 6, dp: 0, whole: true, hint: "Sum of the two PHQ-2 questions; higher = lower mood." },
  { indicator: "lymphAbs", group: "blood", label: "Lymphocytes (absolute)", unit: "cells/µL", suffix: "cells/µL", min: 50, max: 20000, dp: 0 },
];

const FIELD = new Map(FIELDS.map((f) => [f.indicator, f]));
export type FormValues = Partial<Record<Indicator, string>>;
export type FormErrors = Partial<Record<Indicator, string>>;

const fmtBound = (n: number): string => n.toLocaleString("en-US");

// "1,470" is a thousands comma; "36,6" is a decimal comma.
const normalise = (raw: string): string => raw.trim().replace(/\s/g, "").replace(/,(?=\d{3}$)/, "").replace(",", ".");

export function parseField(f: Field, raw: string): { value?: number; error?: string } {
  const s = normalise(raw);
  if (s === "") return {};
  const range = `from ${fmtBound(f.min)} to ${fmtBound(f.max)}${f.whole ? "" : ` ${f.suffix}`}`;
  if (!/^\d+(\.\d+)?$/.test(s)) return { error: `Enter a number ${range}.` };
  const value = Number(s);
  if (f.whole && !Number.isInteger(value)) return { error: `Enter a whole number ${range}.` };
  if (!Number.isFinite(value) || value < f.min || value > f.max) return { error: `Enter a value ${range}.` };
  return { value };
}

export interface Parsed { values: Partial<Record<Indicator, number>>; errors: FormErrors }

export function parseForm(input: FormValues): Parsed {
  const values: Parsed["values"] = {};
  const errors: FormErrors = {};
  for (const f of FIELDS) {
    const { value, error } = parseField(f, input[f.indicator] ?? "");
    if (error) errors[f.indicator] = error;
    else if (value !== undefined) values[f.indicator] = value;
  }
  if (values.sbp !== undefined && values.dbp !== undefined && values.dbp >= values.sbp) {
    errors.dbp = "The bottom number must be lower than the top number.";
    delete values.dbp;
  }
  return { values, errors };
}

export function parseDay(raw: string): number | undefined {
  const s = raw.trim();
  if (!/^\d+$/.test(s)) return undefined;
  const n = Number(s);
  return n >= FIRST_DAY && n <= LAST_DAY ? n : undefined;
}

export const phaseLabel = (day: number): string => PHASE_LABEL[phaseForDay(day)];

// ---- Sample history: test astronaut A's simulated pre-flight readings ----

// A has no simulated blood counts, so its pre-flight lymphocytes are drawn here the way lib/testCrew.ts draws the rest:
// a made-up true value plus the published within-person noise (EFLM CVI, lib/data/variation.ts), from a fixed seed.
// The centre is near the median pre-flight count of the four real OSD-569 crew (2,101 cells/µL; checked in check.test.ts).
export const SAMPLE_LYMPH_CENTRE = 2100;
const LYMPH_SEED = 404;
const LYMPH_CVI = variation.find((v) => v.indicator === "lymphAbs" && v.method === "populationCV");

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let seedCache: Reading[] | undefined;

export function seedHistory(): Reading[] {
  if (seedCache) return seedCache;
  const pre = simulateAstronaut(ASTRONAUT_ID).filter((r) => r.missionDay < 0);
  const days = [...new Set(pre.map((r) => r.missionDay))].sort((a, b) => a - b);
  const rand = mulberry32(LYMPH_SEED);
  const cvi = LYMPH_CVI && "cviPct" in LYMPH_CVI ? LYMPH_CVI.cviPct / 100 : 0;
  const lymph = days.map((d): Reading => {
    const g = Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand()); // Box–Muller
    return {
      id: `${ASTRONAUT_ID}-lymphAbs-${d}`, astronautId: ASTRONAUT_ID, indicator: "lymphAbs",
      value: Math.round(SAMPLE_LYMPH_CENTRE * (1 + cvi * g)), unit: "cells/µL",
      takenAt: pre.find((r) => r.missionDay === d)!.takenAt, missionDay: d, phase: "preflight", source: "simulated",
    };
  });
  return (seedCache = [...pre, ...lymph]);
}

const preflight = (indicator: Indicator): number[] =>
  seedHistory().filter((r) => r.indicator === indicator).map((r) => r.value);

const toInput = (f: Field, v: number): string => String(Math.round(v * 10 ** f.dp) / 10 ** f.dp);

// Every reading at the sample person's own pre-flight median, except lymphocytes 30% below it: inside the lab range for
// people (850–3,900 cells/µL), outside the person's own band. That split is the point of the app.
export const SAMPLE_LYMPH_DROP = 0.3;

export function sampleValues(): FormValues {
  const out: FormValues = {};
  for (const f of FIELDS) {
    const base = median(preflight(f.indicator));
    out[f.indicator] = toInput(f, f.indicator === "lymphAbs" ? base * (1 - SAMPLE_LYMPH_DROP) : base);
  }
  return out;
}

// ---- Check-ins and stored history ----

export interface Check { id: string; missionDay: number; takenAt: string; readings: Reading[] }

function reading(f: Field, value: number, day: number, checkId: string, takenAt: string): Reading {
  return {
    id: `check-${checkId}-${f.indicator}`, astronautId: ASTRONAUT_ID, indicator: f.indicator, value, unit: f.unit,
    takenAt, missionDay: day, phase: phaseForDay(day), source: "checkin",
  };
}

export function buildCheck(values: Parsed["values"], day: number, id: string, takenAt: string): Check {
  const readings = FIELDS.flatMap((f) => (values[f.indicator] === undefined ? [] : [reading(f, values[f.indicator]!, day, id, takenAt)]));
  return { id, missionDay: day, takenAt, readings };
}

export const fullHistory = (checks: readonly Check[]): Reading[] => [...seedHistory(), ...checks.flatMap((c) => c.readings)];

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

// Rebuilds each check from the few fields that matter; anything malformed is dropped, never passed to the engine.
export function parseStored(raw: string | null): Check[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!isObj(data) || data.v !== 1 || !Array.isArray(data.checks)) return [];
  const seen = new Set<string>();
  const out: Check[] = [];
  for (const c of data.checks) {
    if (!isObj(c) || typeof c.id !== "string" || !/^[\w-]{1,64}$/.test(c.id) || seen.has(c.id)) continue;
    const day = c.missionDay;
    if (typeof day !== "number" || !Number.isInteger(day) || day < FIRST_DAY || day > LAST_DAY) continue;
    if (typeof c.takenAt !== "string" || !Number.isFinite(Date.parse(c.takenAt)) || !Array.isArray(c.readings)) continue;
    const values: Parsed["values"] = {};
    for (const r of c.readings) {
      if (!isObj(r) || typeof r.indicator !== "string" || typeof r.value !== "number") continue;
      const f = FIELD.get(r.indicator as Indicator);
      if (f && parseField(f, String(r.value)).value !== undefined) values[f.indicator] = r.value;
    }
    const check = buildCheck(values, day, c.id, c.takenAt);
    if (!check.readings.length) continue;
    seen.add(c.id);
    out.push(check);
  }
  return out;
}

export const serialise = (checks: readonly Check[]): string => JSON.stringify({ v: 1, checks });

export interface HistoryStore {
  load(): Check[];
  save(checks: Check[]): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

// localStorage can be missing, blocked or full; every access is guarded and the in-memory copy carries on regardless.
export function createStore(getStorage: () => Storage | undefined, key = STORAGE_KEY): HistoryStore {
  let memory: Check[] | undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const write = (fn: (s: Storage) => void) => {
    try {
      const s = getStorage();
      if (s) fn(s);
    } catch {
      // storage blocked or full: memory already holds the new state
    }
  };
  return {
    load() {
      if (memory) return memory;
      try {
        memory = parseStored(getStorage()?.getItem(key) ?? null);
      } catch {
        memory = [];
      }
      return memory;
    },
    save(checks) {
      memory = checks;
      write((s) => s.setItem(key, serialise(checks)));
      emit();
    },
    clear() {
      memory = [];
      write((s) => s.removeItem(key));
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// ---- Results ----

export type NextStep = "carryOn" | "recheck" | "act";
export const NEXT_LABEL: Record<NextStep, string> = { carryOn: "Carry on", recheck: "Re-check", act: "Act" };

export function nextStep(overall: Status): NextStep {
  if (overall === "act") return "act";
  return overall === "nominal" ? "carryOn" : "recheck";
}

export function nextStepText(overall: Status): string {
  if (overall === "act") return "At least one reading needs action now. Follow the steps on its card and send the report to the flight surgeon.";
  if (overall === "watch") return "At least one reading has moved further than everyday variation. Follow the steps on its card.";
  if (overall === "notMeasured") return "Some readings could not be judged yet. Their cards say why.";
  return "Every reading is normal on all three questions.";
}

export interface CheckResult { day: number; phase: Phase; verdicts: Verdict[]; overall: Status; next: NextStep }

const RANK: Record<Status, number> = { act: 0, watch: 1, notMeasured: 2, nominal: 3 };

// Judged against the history from before this check, so a reading is never its own baseline or predecessor.
export function runCheck(check: Check, historyBefore: readonly Reading[], tables: Tables): CheckResult {
  const ctx = { phase: phaseForDay(check.missionDay), missionDay: check.missionDay };
  const verdicts = check.readings
    .map((r) => evaluate(r, historyBefore, ctx, tables))
    .map((v, i) => ({ v, i }))
    .sort((a, b) => RANK[a.v.overall] - RANK[b.v.overall] || a.i - b.i)
    .map(({ v }) => v);
  const overall = worst(verdicts.map((v) => v.overall));
  return { day: check.missionDay, phase: ctx.phase, verdicts, overall, next: nextStep(overall) };
}

export const readingLabel = (v: Verdict): string => capitalize(INDICATOR_LABEL[v.reading.indicator]);

// Plain text for the flight surgeon. Nothing is sent: the dialog offers "Copy report" only.
export function checkReport(result: CheckResult): string {
  const flagged = result.verdicts.filter((v) => v.overall === "act" || v.overall === "watch");
  const out = [
    "Report to flight surgeon (draft, not sent)",
    "Sample history is simulated: test astronaut A's pre-flight readings.",
    `Mission day ${result.day}, phase: ${PHASE_LABEL[result.phase]}`,
    `Overall: ${NEXT_LABEL[result.next]}`,
  ];
  if (flagged.length) out.push("", "Flagged readings:");
  for (const v of flagged) {
    out.push(`- ${capitalize(INDICATOR_LABEL[v.reading.indicator])} ${valueText(v.reading)}: ${STATUS_LABEL[v.overall]}`, ...answerLines(v));
    for (const [k, text] of actionLines(v)) out.push(`  ${k}: ${text}`);
  }
  out.push("", `${SEND_DELAY}.`, SCREENING);
  return out.join("\n");
}
