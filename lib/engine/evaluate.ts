import type { Tables } from "@/lib/data/tables";
import type { Answer, Reading, Status, Verdict } from "@/lib/types";
import { buildAction } from "./actions";
import { peopleAnswer, todayAnswer, youAnswer, type EvalCtx, type TodayResult, type YouResult } from "./answers";

const RANK: Record<Status, number> = { nominal: 0, notMeasured: 1, watch: 2, act: 3 };

export const worst = (statuses: readonly Status[]): Status =>
  statuses.reduce<Status>((w, s) => (RANK[s] > RANK[w] ? s : w), "nominal");

export interface Detailed { verdict: Verdict; you: YouResult; today: TodayResult }

export function evaluateDetailed(reading: Reading, history: readonly Reading[], ctx: EvalCtx, tables: Tables): Detailed {
  const { answer: people, limit } = peopleAnswer(reading, tables);
  const you = youAnswer(reading, history, tables);
  const today = todayAnswer(reading, you, ctx, tables);
  const answers: [Answer, Answer, Answer] = [people, you.answer, today.answer];

  // A phase row with no size can say "expected", but cannot cancel a warning: any fall would pass.
  const size = today.phaseRow?.maxChangePct;
  const expectedApplied = people.status === "nominal" && you.answer.status === "watch"
    && today.answer.status === "nominal" && today.expectedMatch
    && size !== undefined && you.changePct !== undefined && Math.abs(you.changePct) <= size;
  const overall = expectedApplied ? "nominal" : worst(answers.map((a) => a.status));

  const verdict = { reading, answers, overall, action: buildAction({ reading, answers, overall, ctx, limit, you, today, expectedApplied }) };
  return { verdict, you, today };
}

export const evaluate = (reading: Reading, history: readonly Reading[], ctx: EvalCtx, tables: Tables): Verdict =>
  evaluateDetailed(reading, history, ctx, tables).verdict;
