"use client";

import type { Ref } from "react";
import { CARD, FOCUS, StatusChip } from "@/components/astronaut/StatusChip";
import { actionLines, humanPhases, QUESTION_LABEL, valueText } from "@/app/astronaut/model";
import { NEXT_LABEL, nextStepText, phaseLabel, readingLabel, type CheckResult } from "@/lib/check/check";
import { describeChange } from "@/lib/engine/answers";
import type { Verdict } from "@/lib/types";

const allNominal = (v: Verdict): boolean => v.answers.every((a) => a.status === "nominal");

const OVERALL_BOX: Record<CheckResult["next"], string> = {
  carryOn: "border-teal bg-teal-soft",
  recheck: "border-yellow bg-yellow-soft",
  act: "border-primary bg-primary-soft",
};

export function CheckResults({ result, headingRef, onReport }: { result: CheckResult; headingRef: Ref<HTMLHeadingElement>; onReport: () => void }) {
  const full = result.verdicts.filter((v) => !allNominal(v));
  const quiet = result.verdicts.filter(allNominal);
  return (
    <section aria-labelledby="results-title">
      <h2 id="results-title" ref={headingRef} tabIndex={-1} className={`scroll-mt-4 text-lg font-semibold ${FOCUS}`}>
        Results for day {result.day} <span className="font-normal text-secondary">· {phaseLabel(result.day)}</span>
      </h2>

      <div className={`mt-3 rounded-2xl border p-4 sm:p-5 ${OVERALL_BOX[result.next]}`}>
        <p className="text-2xl font-bold">{NEXT_LABEL[result.next]}</p>
        <p className="mt-1 text-sm">{nextStepText(result.overall)}</p>
        {full.length > 0 && (
          <p className="mt-1 text-sm text-secondary">
            {full.length} of {result.verdicts.length} readings {full.length === 1 ? "needs" : "need"} a look, listed first.
          </p>
        )}
        {result.next === "act" && (
          <button type="button" onClick={onReport} className={`mt-3 min-h-[44px] rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover ${FOCUS}`}>
            Send report to flight surgeon
          </button>
        )}
      </div>

      {full.length > 0 && (
        <ul className="mt-4 space-y-4">
          {full.map((v) => <li key={v.reading.id}><ReadingCard v={v} /></li>)}
        </ul>
      )}

      {quiet.length > 0 && (
        <div className={`mt-4 ${CARD}`}>
          <h3 className="text-base font-semibold">Normal on all three questions</h3>
          <ul className="mt-2 divide-y divide-border-soft">
            {quiet.map((v) => (
              <li key={v.reading.id}>
                <details className="group">
                  <summary className={`flex min-h-[44px] cursor-pointer list-none flex-wrap items-center justify-between gap-2 rounded-lg py-2 text-sm [&::-webkit-details-marker]:hidden ${FOCUS}`}>
                    <span>
                      <span aria-hidden="true" className="mr-1.5 inline-block text-secondary transition-transform group-open:rotate-90 motion-reduce:transition-none">›</span>
                      <span className="font-medium">{readingLabel(v)}</span> <span className="text-secondary">{valueText(v.reading)}</span>
                    </span>
                    <StatusChip status={v.overall} />
                  </summary>
                  <Answers v={v} />
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ReadingCard({ v }: { v: Verdict }) {
  const lines = v.action.kind === "none" ? [] : actionLines(v);
  const sources = [...new Set([...v.answers.map((a) => a.source), v.action.source].filter(Boolean))];
  return (
    <article className={CARD} aria-labelledby={`h-${v.reading.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id={`h-${v.reading.id}`} className="text-base font-semibold">{readingLabel(v)}</h3>
          <p className="text-sm text-secondary">{valueText(v.reading)}</p>
        </div>
        <StatusChip status={v.overall} />
      </div>
      <Answers v={v} />
      {lines.length > 0 && (
        <dl className="mt-3 space-y-2 rounded-xl bg-card-muted p-3 text-sm">
          {lines.map(([k, text]) => (
            <div key={k}>
              <dt className="text-xs font-semibold text-secondary">{k}</dt>
              <dd className="[overflow-wrap:anywhere]">{text}</dd>
            </div>
          ))}
        </dl>
      )}
      {sources.length > 0 && (
        <details className="mt-2 text-xs text-secondary">
          <summary className={`min-h-[44px] cursor-pointer content-center rounded-lg ${FOCUS}`}>Where these numbers come from</summary>
          <ul className="list-disc space-y-1 pl-5 [overflow-wrap:anywhere]">
            {sources.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </details>
      )}
    </article>
  );
}

function Answers({ v }: { v: Verdict }) {
  return (
    <ul className="mt-2 divide-y divide-border-soft">
      {v.answers.map((a) => (
        <li key={a.question} className="flex items-start justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">{QUESTION_LABEL[a.question]}</p>
            <p className="text-xs text-secondary [overflow-wrap:anywhere]">
              {humanPhases(a.compareTo)}
              {a.question === "you" && a.changePct !== undefined && ` · ${describeChange(a.changePct)}`}
            </p>
          </div>
          <StatusChip status={a.status} />
        </li>
      ))}
    </ul>
  );
}
