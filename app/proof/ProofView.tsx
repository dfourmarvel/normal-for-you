"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ReportDialog, type Report } from "@/components/astronaut/ReportDialog";
import { CARD, FOCUS } from "@/components/astronaut/StatusChip";
import { QUESTION_LABEL } from "@/app/astronaut/model";
import {
  buildCheck, checkReport, createStore, DEFAULT_DAY, fullHistory, NEXT_LABEL, nextStepText, parseDay, parseForm, runCheck,
  SAMPLE_HISTORY_LABEL, sampleValues, type Check, type FormErrors, type FormValues,
} from "@/lib/check/check";
import { loadOsd569 } from "@/lib/data/osd569";
import { defaultTables, withLabRanges } from "@/lib/engine";
import type { Indicator, Reading } from "@/lib/types";
import { CheckForm, fieldId } from "./CheckForm";
import { CheckResults } from "./CheckResults";

// Read lazily inside the store's try/catch: touching window.localStorage itself throws when storage is blocked.
const store = createStore(() => (typeof window === "undefined" ? undefined : window.localStorage));
const NO_CHECKS: Check[] = [];

const HOW = [
  { q: QUESTION_LABEL.people, a: "Against published ranges for healthy adults, NASA limits and the lab's own reference range." },
  { q: QUESTION_LABEL.you, a: "Against your own pre-flight baseline, allowing for normal day-to-day variation and measurement noise." },
  { q: QUESTION_LABEL.today, a: "Against the changes expected in this phase of the mission, where there is evidence for one." },
];

export function CheckScreen() {
  const checks = useSyncExternalStore(store.subscribe, store.load, () => NO_CHECKS);
  const [day, setDay] = useState(DEFAULT_DAY);
  const [dayDraft, setDayDraft] = useState(String(DEFAULT_DAY));
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [run, setRun] = useState<{ check: Check; before: Reading[] } | null>(null);
  const [tables, setTables] = useState(defaultTables);
  const [report, setReport] = useState<Report | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);

  // Blood-count lab ranges live in the OSD-569 file. Until it loads (or if it fails), lymphocytes have no range for people.
  useEffect(() => {
    let live = true;
    loadOsd569().then(({ ranges }) => live && setTables(withLabRanges(defaultTables, ranges)), () => {});
    return () => { live = false; };
  }, []);

  const result = useMemo(() => run && runCheck(run.check, run.before, tables), [run, tables]);

  const onDay = (draft: string) => {
    setDayDraft(draft);
    const n = parseDay(draft);
    if (n !== undefined) setDay(n);
  };
  const onChange = (i: Indicator, raw: string) => {
    setValues((v) => ({ ...v, [i]: raw }));
    setErrors((e) => {
      const next = { ...e };
      delete next[i];
      return next;
    });
    setFormError("");
  };
  const onSample = () => {
    setValues(sampleValues());
    setErrors({});
    setFormError("");
  };

  const onCheck = () => {
    const parsed = parseForm(values);
    setErrors(parsed.errors);
    const bad = Object.keys(parsed.errors) as Indicator[];
    if (bad.length) {
      setFormError(`Fix ${bad.length === 1 ? "the highlighted field" : `the ${bad.length} highlighted fields`} first.`);
      document.getElementById(fieldId(bad[0]))?.focus();
      return;
    }
    if (!Object.keys(parsed.values).length) {
      setFormError("Enter at least one reading, or use the sample values.");
      return;
    }
    setFormError("");
    const now = new Date();
    const check = buildCheck(parsed.values, day, `${now.getTime().toString(36)}${checks.length}`, now.toISOString());
    setRun({ check, before: fullHistory(checks) });
    store.save([...checks, check]);
    requestAnimationFrame(() => {
      resultsHeading.current?.focus({ preventScroll: true });
      resultsHeading.current?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  };

  const reset = () => {
    store.clear();
    setRun(null);
  };

  const openReport = () => {
    if (!result) return;
    setReport({ title: `Mission day ${result.day}`, text: checkReport(result) });
    dialog.current?.showModal();
  };

  return (
    <div className="mx-auto w-full max-w-6xl py-2 sm:py-4">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold text-primary">BioTensor Q-Health</p>
        <h1 className="mt-1 text-[28px] leading-tight font-bold [text-wrap:balance]">Daily self-check</h1>
        <p className="mt-2 text-base">
          Enter today&apos;s readings and see, for each one, whether it is normal for people, normal for you, and normal for this day of the mission.
        </p>
        <p className="mt-2 text-sm text-secondary">{SAMPLE_HISTORY_LABEL}</p>
        <p className="mt-2 text-sm text-secondary">
          On real Inspiration4 blood counts the lab range called all 16 post-flight results normal; their own baselines flagged 2 of 4 crew. <Link href="/proof" className="font-medium text-primary underline underline-offset-2">See the data →</Link>
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm">
          <span>
            Your history: {checks.length} {checks.length === 1 ? "check" : "checks"}
            <span className="text-secondary"> on top of the sample pre-flight readings</span>
          </span>
          {checks.length > 0 && (
            <>
              <span aria-hidden="true" className="text-secondary">·</span>
              <button type="button" onClick={reset} className={`min-h-[44px] rounded-lg font-medium text-chip-act underline underline-offset-2 ${FOCUS}`}>
                Reset to sample history
              </button>
            </>
          )}
        </p>
        <p className="mt-3 text-xs text-secondary md:hidden">Press <strong>Use sample values</strong> to test the check on a real-style example.</p>
      </header>

      <p role="status" aria-live="polite" className="sr-only">
        {result ? `${NEXT_LABEL[result.next]}. ${nextStepText(result.overall)}` : ""}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <CheckForm
          day={day} dayDraft={dayDraft} onDay={onDay} onDayCommit={() => setDayDraft(String(day))}
          values={values} errors={errors} formError={formError} onChange={onChange} onSample={onSample} onCheck={onCheck}
        />
        {result ? (
          <CheckResults result={result} headingRef={resultsHeading} onReport={openReport} />
        ) : (
          <section aria-labelledby="how-title" className={CARD}>
            <h2 id="how-title" className="text-lg font-semibold">Three questions for every reading</h2>
            <dl className="mt-3 space-y-3">
              {HOW.map((h) => (
                <div key={h.q}>
                  <dt className="text-sm font-semibold">{h.q}</dt>
                  <dd className="text-sm text-secondary">{h.a}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm">
              Then one next step: <strong>Carry on</strong>, <strong>Re-check</strong> or <strong>Act</strong>. Try <strong>Use sample values</strong> to
              see a reading that is normal for people but not for you.
            </p>
          </section>
        )}
      </div>

      <section aria-labelledby="more-title" className="mt-8">
        <h2 id="more-title" className="sr-only">More about this app</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrustLink href="/proof" title="Why trust it">
            Tested on real NASA blood counts: the lab range said normal; their own baseline flagged 2 of 4 crew.
          </TrustLink>
          <TrustLink href="/crew" title="Crew view">
            Every crew member&apos;s status on one screen. Simulated crew.
          </TrustLink>
        </div>
      </section>

      <ReportDialog ref={dialog} report={report} />
    </div>
  );
}

function TrustLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`group block ${CARD} transition-colors hover:border-primary ${FOCUS}`}>
      <span className="flex items-center justify-between gap-2 text-base font-semibold">
        {title}
        <span aria-hidden="true" className="text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">→</span>
      </span>
      <span className="mt-1 block text-sm text-secondary">{children}</span>
    </Link>
  );
}

