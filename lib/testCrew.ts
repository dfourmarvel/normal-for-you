// Three simulated test astronauts (spec 02 §7): made-up people whose readings carry published day-to-day noise,
// drawn from a fixed seed so every run, test and screen sees the same numbers.
import { youAnswer } from "@/lib/engine/answers";
import { defaultTables } from "@/lib/engine/defaults";
import type { Astronaut, BuddyCheck, Indicator, Phase, Reading } from "@/lib/types";

export const SIMULATED_LABEL = "Simulated astronaut: made-up person, realistic noise; sleep is a 3-night average";

export const MISSION_DAYS = 180;
const PRE_LANDING_START = 159; // the last 21 days before landing on day 180, as the ticket sets them
const PRE_DAYS = [-60, -45, -30, -14, -7]; // 5 pre-flight readings: the own-SD band needs at least 5
const LAUNCH_MS = Date.UTC(2031, 2, 3, 7, 30); // made-up launch date, a Monday
const DAY_MS = 86_400_000;

export function phaseForDay(day: number): Phase {
  if (day < 0) return "preflight";
  if (day <= 3) return "first72h";
  if (day < PRE_LANDING_START) return "cruise";
  return day <= MISSION_DAYS ? "preLanding" : "postflight";
}

const takenAt = (day: number): string => new Date(LAUNCH_MS + day * DAY_MS).toISOString();

// Every non-occasional region member, so no region reads "not measured" (HRV and blood counts are occasional).
export const CREW_INDICATORS = [
  "restingHR", "sbp", "dbp", "spo2", "sleepHours", "fatigueSP", "moodPHQ2", "pvtLapses", "bodyMass", "tempC", "glucose", "co2", "radDose",
] as const satisfies readonly Indicator[];
type CrewIndicator = (typeof CREW_INDICATORS)[number];

const DEMO = "demo noise: no published within-person figure found (searched 14 Nov 2026)";
const CABIN = "simulated cabin reading";
const OHASAMA = "Ohasama study, JAHA 2019 (PMC6761623): morning home blood pressure over at least 5 days, 1,665 adults";

// Within-person day-to-day noise: sd in the reading's unit, or cvPct as % of the centre value.
export const NOISE: Record<CrewIndicator, { sd?: number; cvPct?: number; source: string }> = {
  restingHR: { sd: 3.03, source: "Quer et al. 2020, PLOS ONE: Fitbit daily resting heart rate, 92,457 adults, within-person SD (full text)" },
  sbp: { cvPct: 6.8, source: OHASAMA },
  dbp: { cvPct: 8.7, source: OHASAMA },
  // Closest published figure (Chest 1987) is a 1.2-point change needed to count as real: a threshold, not an SD.
  spo2: { sd: 0.8, source: DEMO },
  sleepHours: {
    sd: 77.41 / 60,
    source: "Messman et al. 2022, J Sleep Res 31(6):e13680: actigraphy, 2,404 healthy sleepers, 26,121 nights, SD 77.41 min per night; each reading is the mean of the last 3 nights",
  },
  fatigueSP: { sd: 0.6, source: DEMO },
  moodPHQ2: { sd: 0.5, source: DEMO },
  pvtLapses: { sd: 1, source: DEMO },
  bodyMass: { cvPct: 0.66, source: "Cheuvront et al. 2004, Int J Sport Nutr Exerc Metab: first-morning body mass, 65 active men (abstract)" },
  tempC: { sd: 0.31, source: "Diamond et al. 2021, PLOS ONE (PMC7857558): oral temperature, 96 adults, 14 readings each" },
  glucose: { cvPct: 4.9, source: "EFLM Biological Variation Database, fasting glucose CVI 4.9% (as in lib/data/variation.ts)" },
  co2: { cvPct: 4, source: CABIN },
  radDose: { cvPct: 10, source: CABIN }, // on the daily increment
};

// Cadence in days: every 3 days for mood (PHQ-2 asks about 2 weeks), glucose and body mass; daily for the rest.
// The engine only looks back 7 days, so nothing may go 7 days without a reading.
const SCALE: Record<CrewIndicator, { unit: string; dp: number; every: number; min?: number; max?: number }> = {
  restingHR: { unit: "bpm", dp: 0, every: 1 },
  sbp: { unit: "mmHg", dp: 0, every: 1 },
  dbp: { unit: "mmHg", dp: 0, every: 1 },
  spo2: { unit: "%", dp: 0, every: 1, max: 100 },
  sleepHours: { unit: "h (3-night average)", dp: 2, every: 1 },
  fatigueSP: { unit: "Samn-Perelli 1–7", dp: 0, every: 1, min: 1, max: 7 },
  moodPHQ2: { unit: "PHQ-2 0–6", dp: 0, every: 3, min: 0, max: 6 },
  pvtLapses: { unit: "lapses", dp: 0, every: 1, min: 0 },
  bodyMass: { unit: "kg", dp: 1, every: 3 },
  tempC: { unit: "°C", dp: 1, every: 1 },
  glucose: { unit: "mg/dL", dp: 0, every: 3 },
  co2: { unit: "mmHg", dp: 2, every: 1 },
  radDose: { unit: "mSv (career, from spaceflight)", dp: 2, every: 1 },
};

const GROUND_CO2 = 0.3; // outdoor air, about 400 ppm
const DAILY_DOSE = 0.5; // mSv per day, simulated

// A plan for one reading: how far to move the centre the bad way (absolute units, given the size of the
// person's own band on that side), and which band fractions to keep (f > 0 = the bad direction, 1 = band edge).
interface Plan { shift: (side: number) => number; ok: (f: number) => boolean }

// Construction from the spec ("wobble within ½ RCV"): draws from the real noise, redrawn when the change from the
// person's own baseline reaches 0.45 of their own band on that side (the band the app shows).
const NOMINAL: Plan = { shift: () => 0, ok: (f) => Math.abs(f) < 0.45 };
// The story windows below are the same construction: the drawn value is kept only inside the stated band fraction.
const within = (lo: number, hi: number) => (f: number) => f >= lo && f < hi;

interface Profile {
  astronaut: Astronaut;
  seed: number;
  story: string;
  base: Partial<Record<CrewIndicator, number>>; // made-up true values; pre-flight draws scatter round them
  pre: Partial<Record<CrewIndicator, number[]>>; // integer scales: chosen pre-flight values (need spread)
  cabinCo2: number;
  priorDose: number;
  plan?: (indicator: CrewIndicator, day: number) => Plan | undefined;
}

const C_DRIFT = new Set<CrewIndicator>(["restingHR", "sleepHours", "moodPHQ2", "fatigueSP"]);

const PROFILES: Profile[] = [
  {
    astronaut: { id: "A", name: "Test astronaut A", simulated: true },
    seed: 101,
    story: "Nominal: every reading wobbles inside half of A's own band for the whole mission.",
    base: { restingHR: 58, sbp: 102, dbp: 64, sleepHours: 8.1, bodyMass: 71.4, tempC: 36.6, glucose: 88 },
    pre: { spo2: [97, 99, 98, 97, 99], fatigueSP: [2, 3, 2, 4, 3], moodPHQ2: [0, 1, 0, 2, 1], pvtLapses: [1, 2, 0, 3, 1] },
    cabinCo2: 2.2,
    priorDose: 0,
  },
  {
    astronaut: { id: "B", name: "Test astronaut B", simulated: true },
    seed: 202,
    story: "Sleep debt: from day 40, 1.5 h less sleep a night, fatigue and reaction-test lapses up, mood steady.",
    base: { restingHR: 62, sbp: 98, dbp: 62, sleepHours: 8.8, bodyMass: 78.2, tempC: 36.5, glucose: 90 },
    pre: { spo2: [98, 97, 99, 98, 96], fatigueSP: [3, 2, 2, 3, 4], moodPHQ2: [1, 0, 0, 1, 2], pvtLapses: [2, 1, 0, 1, 3] },
    cabinCo2: 2.4,
    priorDose: 35,
    plan: (ind, day) => {
      if (day < 40) return undefined;
      // The 3-night average holds the full drop from day 42; until then it only must not pass the band.
      if (ind === "sleepHours") return { shift: () => 1.5, ok: day < 42 ? (f) => Math.abs(f) < 1 : within(0.5, 1) };
      if (ind === "fatigueSP" || ind === "pvtLapses") return { shift: (side) => 0.6 * side, ok: within(0.5, 1) };
      return undefined;
    },
  },
  {
    astronaut: { id: "C", name: "Test astronaut C", simulated: true },
    seed: 303,
    story:
      "Combined drift: from day 159, three weeks before landing, resting heart rate, sleep, mood and fatigue each slide about 0.6 of C's own band the wrong way over 7 days, all inside NASA limits. A crewmate's buddy check says \"seems withdrawn\".",
    base: { restingHR: 56, sbp: 100, dbp: 66, sleepHours: 8.6, bodyMass: 64.5, tempC: 36.7, glucose: 86 },
    pre: { spo2: [98, 99, 97, 98, 99], fatigueSP: [2, 3, 3, 2, 4], moodPHQ2: [0, 0, 1, 1, 2], pvtLapses: [0, 1, 2, 1, 2] },
    cabinCo2: 2.3,
    priorDose: 12,
    plan: (ind, day) => {
      if (day < PRE_LANDING_START || !C_DRIFT.has(ind)) return undefined;
      const frac = 0.6 * Math.min(1, (day - 158) / 7);
      return { shift: (side) => frac * side, ok: day < 165 ? (f) => f > -0.45 && f < 0.75 : within(0.5, 0.75) };
    },
  },
];

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

const round = (v: number, dp: number): number => Math.round(v * 10 ** dp) / 10 ** dp;
const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
const missionDays = (every: number): number[] => Array.from({ length: Math.floor(MISSION_DAYS / every) + 1 }, (_, i) => i * every);

function generate(p: Profile): Reading[] {
  const rand = mulberry32(p.seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand()); // Box–Muller
  const id = p.astronaut.id;
  const out: Reading[] = [];
  const mk = (indicator: CrewIndicator, missionDay: number, value: number): Reading => ({
    id: `${id}-${indicator}-${missionDay}`, astronautId: id, indicator, value, unit: SCALE[indicator].unit,
    takenAt: takenAt(missionDay), missionDay, phase: phaseForDay(missionDay), source: "simulated",
  });
  const draw = (ind: CrewIndicator, centre: number): number => {
    const { sd, cvPct = 0 } = NOISE[ind];
    const s = SCALE[ind];
    const v = round(centre + (sd ?? (cvPct / 100) * centre) * gauss(), s.dp);
    return Math.min(s.max ?? Infinity, Math.max(s.min ?? -Infinity, v));
  };

  const nights = new Map<number, number>();
  const night = (n: number, centre: number) => nights.set(n, centre + NOISE.sleepHours.sd! * gauss());
  const sleepAt = (day: number) => round(mean([day - 2, day - 1, day].map((n) => nights.get(n)!)), 2);

  for (const ind of CREW_INDICATORS) {
    const days = missionDays(SCALE[ind].every);
    if (ind === "co2") {
      out.push(...PRE_DAYS.map((d) => mk(ind, d, draw(ind, GROUND_CO2))), ...days.map((d) => mk(ind, d, draw(ind, p.cabinCo2))));
      continue;
    }
    if (ind === "radDose") {
      let dose = p.priorDose; // career dose from spaceflight does not change on the ground
      out.push(...PRE_DAYS.map((d) => mk(ind, d, dose)));
      for (const d of days) out.push(mk(ind, d, (dose = round(dose + draw(ind, DAILY_DOSE), 2))));
      continue;
    }

    const preValues = p.pre[ind] ?? PRE_DAYS.map((d) => {
      if (ind !== "sleepHours") return draw(ind, p.base[ind]!);
      for (const n of [d - 2, d - 1, d]) night(n, p.base.sleepHours!);
      return sleepAt(d);
    });
    const pre = PRE_DAYS.map((d, i) => mk(ind, d, preValues[i]));
    out.push(...pre);

    // The engine's own baseline and band, so the construction matches what the app shows.
    const { base, limits } = youAnswer(pre[0], pre, defaultTables);
    if (base === undefined || !limits) throw new Error(`${id} ${ind}: no personal band`);
    const dir = ind === "sleepHours" ? -1 : 1; // the bad direction the stories push (two-sided rows: up)
    const side = ((dir > 0 ? limits.upPct : -limits.downPct) / 100) * base;
    const fraction = (v: number) => {
      const c = ((v - base) / base) * 100;
      return (dir * c) / (c >= 0 ? limits.upPct : -limits.downPct);
    };

    if (ind === "sleepHours") [-2, -1].forEach((n) => night(n, base));
    for (const day of days) {
      const plan = p.plan?.(ind, day) ?? NOMINAL;
      const centre = base + dir * plan.shift(side);
      for (let tries = 0; ; tries++) {
        if (tries === 1000) throw new Error(`${id} ${ind} day ${day}: no draw inside the plan`);
        if (ind === "sleepHours") night(day, centre);
        const value = ind === "sleepHours" ? sleepAt(day) : draw(ind, centre);
        if (plan.ok(fraction(value))) {
          out.push(mk(ind, day, value));
          break;
        }
      }
    }
  }
  return out;
}

export const TEST_CREW: Astronaut[] = PROFILES.map((p) => p.astronaut);
export const TEST_STORIES: Record<string, string> = Object.fromEntries(PROFILES.map((p) => [p.astronaut.id, p.story]));
export const TEST_READINGS: Reading[] = PROFILES.flatMap(generate);

// Launch is a Monday and 161 = 23 weeks, so day 161 is the Monday of its week. Data only: the engine does not read buddy checks yet.
export const TEST_BUDDY_CHECKS: BuddyCheck[] = [
  { fromId: "A", aboutId: "C", weekOf: takenAt(161).slice(0, 10), mood: 2, sleep: 0, confusion: 0, conflict: 0, note: "seems withdrawn" },
];
