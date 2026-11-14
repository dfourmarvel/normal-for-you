import type { Tables } from "@/lib/data/tables";
import type { Indicator, Reading, Region, RegionStatus, Status, Verdict } from "@/lib/types";
import type { EvalCtx, TodayResult } from "./answers";
import { evaluateDetailed, worst } from "./evaluate";
import { capitalize, fmtNum, INDICATOR_LABEL } from "./format";
import { isBadDirection } from "./rcv";
import { inFlightSeries } from "./series";

export const REGION_MEMBERS: Record<Region, Indicator[]> = {
  heart: ["restingHR", "sbp", "dbp", "spo2", "hrvRMSSD"],
  brainSleepMood: ["sleepHours", "fatigueSP", "moodPHQ2", "pvtLapses"],
  bonesMuscles: ["bodyMass"],
  eyes: [],
  bloodImmune: ["lymphAbs", "neutAbs", "wbc", "hb", "plt", "tempC", "glucose"],
  environment: ["co2", "radDose"],
};

export interface StatusResult { status: Status; reason?: string; verdict?: Verdict; today?: TodayResult }

export function statusFor(
  astronautId: string, indicator: Indicator, history: readonly Reading[], ctx: EvalCtx, tables: Tables, maxAgeDays = 7,
): StatusResult {
  const latest = inFlightSeries(history, astronautId, indicator)
    .filter((r) => r.missionDay <= ctx.missionDay && r.missionDay > ctx.missionDay - maxAgeDays)
    .at(-1);
  if (!latest) return { status: "notMeasured", reason: `No ${INDICATOR_LABEL[indicator]} reading for ${maxAgeDays} days` };
  const { verdict, today } = evaluateDetailed(latest, history, ctx, tables);
  return { status: verdict.overall, verdict, today };
}

const COMBINED_DRIFT_MIN = 3;

// Need a chest strap (HRV) or an onboard analyser run (blood counts), so they are often absent for a week.
export const OCCASIONAL_MEMBERS: ReadonlySet<Indicator> = new Set(["hrvRMSSD", "lymphAbs", "neutAbs", "wbc", "hb", "plt"]);

export function regionStatus(region: Region, astronautId: string, history: readonly Reading[], ctx: EvalCtx, tables: Tables): RegionStatus {
  const members = REGION_MEMBERS[region];
  if (members.length === 0) return { region, status: "notMeasured", reasons: ["vision self-check not built"] };

  const statuses: Status[] = [];
  const reasons: string[] = [];
  const drifting: string[] = [];
  for (const indicator of members) {
    const label = INDICATOR_LABEL[indicator];
    const res = statusFor(astronautId, indicator, history, ctx, tables);
    if (!res.verdict) {
      reasons.push(`${label} not measured`);
      // Equipment-dependent members are listed but not ranked, or heart and blood would read "not measured" forever.
      if (!OCCASIONAL_MEMBERS.has(indicator)) statuses.push("notMeasured");
      continue;
    }
    statuses.push(res.status);
    if (res.status !== "nominal") reasons.push(`${capitalize(label)}: ${res.verdict.action.saw || res.status}`);

    // The you-answer carries changePct and the RCV on the side the change went, so half-RCV is |rcvPct| / 2.
    // A change the phase table expects is not drift, but only when the row gives a size: with none, any fall would pass (as in evaluate.ts).
    const you = res.verdict.answers[1];
    const row = tables.variation.find((v) => v.indicator === indicator);
    const size = res.today?.phaseRow?.maxChangePct;
    const expected = res.today?.expectedMatch === true && size !== undefined
      && you.changePct !== undefined && Math.abs(you.changePct) <= size;
    if (row && !expected && you.changePct !== undefined && you.rcvPct !== undefined
      && isBadDirection(row.badDirection, you.changePct) && Math.abs(you.changePct) >= Math.abs(you.rcvPct) / 2) {
      drifting.push(`${label} ${you.changePct > 0 ? "+" : "-"}${fmtNum(Math.abs(you.changePct))}%`);
    }
  }

  let status: Status = statuses.length === 0 ? "notMeasured" : worst(statuses);

  if (drifting.length >= COMBINED_DRIFT_MIN) {
    reasons.push(`Combined drift: ${drifting.length} readings moved the wrong way this week: ${drifting.join(", ")}`);
    if (status === "nominal" || status === "notMeasured") status = "watch";
  }
  return { region, status, reasons };
}
