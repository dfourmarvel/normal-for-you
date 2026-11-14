import type { LimitRow } from "@/lib/data/tables";
import type { ActionCard, Answer, Reading, Status } from "@/lib/types";
import { capitalize, fmtNum, INDICATOR_LABEL } from "./format";
import type { EvalCtx, TodayResult, YouResult } from "./answers";
import { describeChange } from "./answers";

const NONE: ActionCard = { kind: "none", saw: "", why: "", source: "", doNow: "", recheckWhen: "next check-in" };

export interface ActionInput {
  reading: Reading;
  answers: [Answer, Answer, Answer];
  overall: Status;
  ctx: EvalCtx;
  limit?: LimitRow;
  you: YouResult;
  today: TodayResult;
  expectedApplied: boolean;
}

export function buildAction(i: ActionInput): ActionCard {
  const { reading, answers, overall, ctx, limit, you, today } = i;
  const [people, youA] = answers;
  const label = INDICATOR_LABEL[reading.indicator];
  const val = `${fmtNum(reading.value)} ${reading.unit}`;
  const finite = Number.isFinite(reading.value);

  if (i.expectedApplied) {
    return {
      kind: "expected",
      saw: `${capitalize(label)} ${val}: ${describeChange(youA.changePct ?? 0)}.`,
      why: `This change is expected on day ${ctx.missionDay} (${ctx.phase}).`,
      source: today.phaseRow?.source ?? "",
      doNow: "No action.",
      recheckWhen: "at your next scheduled reading",
    };
  }
  if (overall === "nominal") return NONE;

  if (overall === "notMeasured") {
    const unknown = answers.find((a) => a.status === "notMeasured");
    return {
      kind: "notMeasured",
      saw: finite ? `${capitalize(label)} ${val}, but it cannot be judged: ${unknown?.compareTo ?? "no data"}.` : `No valid ${label} reading.`,
      why: "This counts as unknown, not normal.",
      source: "",
      doNow: `Measure ${label} again and keep logging readings until a personal baseline exists.`,
      recheckWhen: "at your next scheduled reading",
    };
  }

  if (people.status === "act") {
    const past = limit ? `past the NASA limit of ${fmtNum(limit.limit)} (${limit.requirementNo})` : `past the critical value (${people.compareTo})`;
    // The message delay to the ground is deliberately left out: spec section 6 wants it cited before it is shown.
    return {
      kind: "actLimit",
      saw: `${capitalize(label)} is ${val}, ${past}.`,
      why: people.compareTo,
      source: people.source,
      doNow: "Follow the response for this limit and report it to the flight surgeon now",
      recheckWhen: "within 24 hours",
      callGroundWhen: "now",
    };
  }

  if (youA.status === "act" || youA.status === "watch") {
    const peopleClause = people.status === "nominal" ? "inside the normal range for people" : "outside the normal range for people";
    const rcv = youA.rcvPct === undefined ? "" : ` (a real change is more than ${fmtNum(Math.abs(youA.rcvPct))}%)`;
    const act = youA.status === "act";
    return {
      kind: "watchDrift",
      saw: `Your ${label} is ${val}: ${peopleClause}, but ${describeChange(youA.changePct ?? 0)}${rcv}${act ? ", and the previous reading was also past that" : ""}.`,
      why: `A change this size is beyond everyday variation plus measurement noise. ${you.row?.directionSource ?? ""}`.trim(),
      source: youA.source,
      doNow: act ? "Tell the flight surgeon now" : "Re-check at your next scheduled reading; tell the flight surgeon if it moves further",
      recheckWhen: act ? "within 24 hours" : "at your next scheduled reading",
      callGroundWhen: act ? "now" : "if it moves further",
    };
  }

  if (people.status === "watch") {
    return {
      kind: "watchDrift",
      saw: `Your ${label} is ${val}: outside the normal range for people (${people.compareTo}).`,
      why: "Outside the reference range.",
      source: people.source,
      doNow: "Re-check at your next scheduled reading; tell the flight surgeon if it stays outside",
      recheckWhen: "at your next scheduled reading",
      callGroundWhen: "if it stays outside the range",
    };
  }

  return {
    kind: "watchDrift",
    saw: `Your ${label} is ${val}: ${describeChange(you.changePct ?? 0)}, which does not match what is expected in ${ctx.phase}.`,
    why: today.answer.compareTo,
    source: today.answer.source,
    doNow: "Re-check at your next scheduled reading; tell the flight surgeon if it moves further",
    recheckWhen: "at your next scheduled reading",
    callGroundWhen: "if it moves further",
  };
}
