// Pure view-model builders for the astronaut self-check. No React here, so the story results are testable.
import { defaultTables, regionStatus, REGION_MEMBERS, statusFor, worst, type StatusResult } from "@/lib/engine";
import { youAnswer } from "@/lib/engine/answers";
import { capitalize, fmtNum, INDICATOR_LABEL } from "@/lib/engine/format";
import { inFlightSeries } from "@/lib/engine/series";
import {
  DETECTION_SUMMARY, MISSION_DAYS, phaseForDay, SIMULATED_LABEL, TEST_BUDDY_CHECKS, TEST_CREW, TEST_READINGS, TEST_STORIES,
} from "@/lib/testCrew";
import type { Answer, Astronaut, BuddyCheck, Indicator, Phase, Reading, Region, Status, Verdict } from "@/lib/types";

export const CREW_IDS = ["A", "B", "C"] as const;
export type CrewId = (typeof CREW_IDS)[number];
export const isCrewId = (id: string): id is CrewId => (CREW_IDS as readonly string[]).includes(id);

export const FIRST_DAY = 0;
export const LAST_DAY = MISSION_DAYS;
export const clampDay = (d: number): number => Math.min(LAST_DAY, Math.max(FIRST_DAY, Math.round(d)));

// The story days the demo jumps to. A has no story, so any cruise day shows the same result.
export const STORY_DAYS: Record<CrewId, { day: number; label: string }[]> = {
  A: [{ day: 100, label: "Day 100 (any cruise day)" }],
  B: [{ day: 43, label: "Day 43 (sleep debt)" }],
  C: [{ day: 165, label: "Day 165 (pre-landing drift)" }],
};

export const PHASE_LABEL: Record<Phase, string> = {
  preflight: "Pre-flight", first72h: "First 72 hours", cruise: "Cruise", preEVA: "Pre-spacewalk",
  preLanding: "Pre-landing", surface: "Surface", postflight: "Post-flight",
};

export const REGION_LABEL: Record<Region, string> = {
  heart: "Heart and circulation", brainSleepMood: "Brain, sleep and mood", bonesMuscles: "Bones and muscles",
  eyes: "Eyes", bloodImmune: "Blood and immune", environment: "Environment",
};

export const STATUS_LABEL: Record<Status, string> = { nominal: "Nominal", watch: "Watch", act: "Act", notMeasured: "Not measured" };

export const QUESTION_LABEL: Record<Answer["question"], string> = {
  people: "Normal for people?", you: "Normal for you?", today: "Normal for this mission day?",
};

// 01c cites no signal delay, so the demo shows an assumption and says so (spec §6).
export const SEND_DELAY = "demo assumption: Mars transit, 12 min one way (not a NASA figure)";
export const SCREENING = "Screening, not a diagnosis.";
export { SIMULATED_LABEL };

export const isFlagged = (s: Status): boolean => s === "watch" || s === "act";

export interface CrewCard { astronaut: Astronaut; story: string; oneLine: string; storyDays: { day: number; label: string }[] }

export function crewCards(): CrewCard[] {
  return TEST_CREW.map((astronaut) => {
    const story = TEST_STORIES[astronaut.id];
    return { astronaut, story, oneLine: story.split(/(?<=\.) /)[0], storyDays: STORY_DAYS[astronaut.id as CrewId] };
  });
}

export const crewCard = (id: CrewId): CrewCard => crewCards().find((c) => c.astronaut.id === id)!;

const history = (id: CrewId): Reading[] => TEST_READINGS.filter((r) => r.astronautId === id);
const ctxFor = (day: number) => ({ phase: phaseForDay(day), missionDay: day });

export interface IndicatorRow { indicator: Indicator; label: string; result: StatusResult }

export interface CombinedDrift { n: number; items: string[]; flaggedAlone: number; text: string }

export interface RegionView {
  region: Region;
  label: string;
  status: Status;
  reasons: string[];
  rows: IndicatorRow[];
  combined?: CombinedDrift;
}

export interface DayView { id: CrewId; name: string; day: number; phase: Phase; phaseLabel: string; overall: Status; regions: RegionView[] }

// The engine's reason reads "Combined drift: {n} readings moved the wrong way this week: {list}".
const DRIFT_RE = /^Combined drift: (\d+) readings moved the wrong way this week: (.+)$/;

export function combinedDrift(regionLabel: string, reasons: readonly string[], rows: readonly IndicatorRow[]): CombinedDrift | undefined {
  const m = reasons.map((r) => DRIFT_RE.exec(r)).find(Boolean);
  if (!m) return undefined;
  const n = Number(m[1]);
  const items = m[2].split(", ");
  const list = items.join(", ");
  const region = regionLabel.toLowerCase();
  // Spec §6 says "none far enough alone"; that is only true when no drifting reading is flagged by itself.
  const flaggedAlone = items.filter((item) => rows.some((r) => item.startsWith(`${r.label} `) && isFlagged(r.result.status))).length;
  const text = flaggedAlone === 0
    ? `${n} readings in ${region} moved the wrong way this week, none far enough alone. Together they're worth a check: ${list}.`
    : `${n} readings in ${region} moved the wrong way this week; ${flaggedAlone} of them ${flaggedAlone === 1 ? "is" : "are"} flagged on ${flaggedAlone === 1 ? "its" : "their"} own too. Together they're worth a check: ${list}.`;
  return { n, items, flaggedAlone, text };
}

export function dayView(id: CrewId, rawDay: number): DayView {
  const day = clampDay(rawDay);
  const h = history(id);
  const ctx = ctxFor(day);
  const regions = (Object.keys(REGION_MEMBERS) as Region[]).map((region): RegionView => {
    const { status, reasons } = regionStatus(region, id, h, ctx, defaultTables);
    const rows = REGION_MEMBERS[region].map((indicator) => ({
      indicator, label: INDICATOR_LABEL[indicator], result: statusFor(id, indicator, h, ctx, defaultTables),
    }));
    const label = REGION_LABEL[region];
    return { region, label, status, reasons, rows, combined: combinedDrift(label, reasons, rows) };
  });
  const name = TEST_CREW.find((a) => a.id === id)!.name;
  return { id, name, day, phase: ctx.phase, phaseLabel: PHASE_LABEL[ctx.phase], overall: worst(regions.map((r) => r.status)), regions };
}

export const valueText = (r: Reading): string => `${fmtNum(r.value)} ${r.unit}`;

function answerLines(v: Verdict): string[] {
  return v.answers.map((a) => `  ${QUESTION_LABEL[a.question]} ${STATUS_LABEL[a.status]} (${a.compareTo})`);
}

export function actionLines(v: Verdict): [string, string][] {
  const a = v.action;
  const lines: [string, string][] = [["What we saw", a.saw], ["Why it matters", a.why], ["Do now", a.doNow], ["Re-check", a.recheckWhen]];
  if (a.callGroundWhen) lines.push(["Call the ground", a.callGroundWhen]);
  return lines.filter(([, text]) => text);
}

// Plain text for the flight surgeon. Nothing is sent: the screen offers "Copy report" only.
export function surgeonReport(view: DayView, region: RegionView): string {
  const flagged = region.rows.filter((r) => r.result.verdict && isFlagged(r.result.status));
  const out = [
    "Report to flight surgeon (draft, not sent)",
    SIMULATED_LABEL,
    `Astronaut: ${view.name}`,
    `Mission day ${view.day}, phase: ${view.phaseLabel}`,
    `${region.label}: ${STATUS_LABEL[region.status]}`,
  ];
  if (region.combined) out.push(region.combined.text);
  if (flagged.length) out.push("", "Flagged readings:");
  for (const { label, result } of flagged) {
    const v = result.verdict!;
    out.push(`- ${capitalize(label)} ${valueText(v.reading)} on day ${v.reading.missionDay}: ${STATUS_LABEL[v.overall]}`, ...answerLines(v));
    for (const [k, text] of actionLines(v)) out.push(`  ${k}: ${text}`);
  }
  out.push("", `Send delay: ${SEND_DELAY}.`, SCREENING);
  return out.join("\n");
}

export interface BuddyNote { check: BuddyCheck; fromName: string; firstDay: number; lastDay: number }

// Launch is a Monday, so a check's week is the 7 mission days from the day whose date is its weekOf.
export function buddyNotes(id: CrewId, day: number): BuddyNote[] {
  return TEST_BUDDY_CHECKS.filter((c) => c.aboutId === id).flatMap((check) => {
    const start = TEST_READINGS.find((r) => r.astronautId === id && r.takenAt.slice(0, 10) === check.weekOf)?.missionDay;
    if (start === undefined || day < start || day > start + 6) return [];
    return [{ check, fromName: TEST_CREW.find((a) => a.id === check.fromId)?.name ?? check.fromId, firstDay: start, lastDay: start + 6 }];
  });
}

export interface TrendView {
  label: string;
  unit: string;
  points: { day: number; value: number }[];
  band?: { low: number; high: number };
  range?: { low?: number; high?: number; label: string };
}

export function trendView(id: CrewId, indicator: Indicator, day: number): TrendView {
  const h = history(id);
  const series = inFlightSeries(h, id, indicator).filter((r) => r.missionDay <= day);
  const pre = h.find((r) => r.indicator === indicator && r.phase === "preflight");
  const you = pre && youAnswer(pre, h, defaultTables);
  const band = you?.base !== undefined && you.limits
    ? { low: you.base * (1 + you.limits.downPct / 100), high: you.base * (1 + you.limits.upPct / 100) }
    : undefined;
  const row = defaultTables.ranges.find((r) => r.indicator === indicator);
  return {
    label: INDICATOR_LABEL[indicator],
    unit: series[0]?.unit ?? pre?.unit ?? "",
    points: series.map((r) => ({ day: r.missionDay, value: r.value })),
    band,
    range: row && { low: row.low?.value, high: row.high?.value, label: row.label },
  };
}

// The indicator the chart opens on: the first flagged reading of the day, else resting heart rate.
export function defaultTrendIndicator(view: DayView): Indicator {
  for (const r of view.regions) for (const row of r.rows) if (isFlagged(row.result.status)) return row.indicator;
  return "restingHR";
}

export const CHARTABLE: Indicator[] = (Object.values(REGION_MEMBERS).flat() as Indicator[])
  .filter((i) => TEST_READINGS.some((r) => r.indicator === i));

export const detectionFacts = (id: CrewId): string[] => Object.entries(DETECTION_SUMMARY)
  .filter(([k]) => k.startsWith(id.toLowerCase()) || k.startsWith(`seeds${id}`))
  .map(([, f]) => f.text);
