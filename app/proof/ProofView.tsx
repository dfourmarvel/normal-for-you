"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FLIGHT_DAYS, loadOsd569, type Correction } from "@/lib/data/osd569";
import { defaultTables, withLabRanges } from "@/lib/engine";
import type { Answer, Indicator, Reading, Status } from "@/lib/types";
import type { Tables } from "@/lib/data/tables";
import { CrewChart } from "./CrewChart";
import {
  DATA_NOTE_ID, DATA_NOTE_WORDS, MARKERS, buildMarker, changeLabel, closeCall, correctionSentence, dataNoteIntro, fmtCv, fmtPct, fmtValue, preflightDrawsSentence, studyShape,
  summarySentence, type CrewView, type MarkerView,
} from "./compute";

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; readings: Reading[]; tables: Tables; corrections: Correction[] };

const OSDR_URL = "https://osdr.nasa.gov/bio/repo/data/studies/OSD-569";

export function ProofView() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [indicator, setIndicator] = useState<Indicator>("lymphAbs");

  useEffect(() => {
    let live = true;
    loadOsd569()
      .then(({ readings, ranges, corrections }) => live && setLoad({ state: "ready", readings, corrections, tables: withLabRanges(defaultTables, ranges) }))
      .catch((e: unknown) => live && setLoad({ state: "error", message: e instanceof Error ? e.message : String(e) }));
    return () => {
      live = false;
    };
  }, []);

  const view = useMemo((): MarkerView | Error | null => {
    if (load.state !== "ready") return null;
    try {
      return buildMarker(indicator, load.readings, load.tables, load.corrections);
    } catch (e) {
      return e instanceof Error ? e : new Error(String(e));
    }
  }, [load, indicator]);

  const markerName = MARKERS.find((m) => m.indicator === indicator)?.label ?? indicator;
  const shape = useMemo(() => (load.state === "ready" ? studyShape(load.readings) : null), [load]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-chip-nominal">
          <svg aria-hidden="true" viewBox="0 0 8 8" className="h-2 w-2"><circle cx="4" cy="4" r="4" fill="currentColor" /></svg>
          Real data
        </span>
        <h1 className="mt-3 text-[28px] leading-tight font-bold">Normal for people, not normal for you</h1>
        <p className="mt-2 text-secondary">
          A lab range covers the middle 95% of healthy people. One person&apos;s own normal is much narrower.
        </p>
        <p className="mt-2 text-sm text-secondary">
          Real NASA data:{" "}
          <a href={OSDR_URL} className="text-charcoal underline underline-offset-2 hover:text-chip-act" target="_blank" rel="noreferrer">
            Inspiration4 crew blood counts, NASA OSDR study OSD-569
          </a>
        </p>
      </header>

      <div role="group" aria-label="Blood marker" className="mt-6 flex flex-wrap gap-2">
        {MARKERS.map((m) => {
          const on = m.indicator === indicator;
          return (
            <button
              key={m.indicator}
              type="button"
              aria-pressed={on}
              onClick={() => setIndicator(m.indicator)}
              className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                on ? "border-primary bg-primary-soft text-chip-act" : "border-border bg-card text-secondary hover:border-primary hover:text-charcoal"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {load.state === "loading" && <Notice>Loading the OSD-569 blood counts…</Notice>}
        {load.state === "error" && <Notice error>Could not load the NASA data file. {load.message}</Notice>}
        {view instanceof Error && <Notice error>Could not work out this marker. {view.message}</Notice>}
      </div>

      {view && !(view instanceof Error) && load.state === "ready" && <MarkerSection view={view} markerName={markerName} corrections={load.corrections} />}

      <section aria-labelledby="limits" className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(44,44,44,0.04)]">
        <SectionLabel id="limits">Honest limits</SectionLabel>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            {shape ? `${shape.crew} people, one ${FLIGHT_DAYS}-day flight (Inspiration4), ${shape.draws} draws each.` : `One ${FLIGHT_DAYS}-day flight (Inspiration4).`}{" "}
            This shows the method on real data; it is not a medical finding.
          </li>
          <li>
            {view && !(view instanceof Error)
              ? preflightDrawsSentence(view)
              : "Personal bands need at least 3 pre-flight draws; the method papers recommend 5 for a trend check."}
          </li>
          <li className="font-semibold">Screening, not a diagnosis.</li>
        </ul>
      </section>
    </main>
  );
}

function MarkerSection({ view, markerName, corrections }: { view: MarkerView; markerName: string; corrections: Correction[] }) {
  return (
    <>
      <p className="mt-6 max-w-2xl text-lg font-medium">{summarySentence(view)}</p>
      {view.range?.note && <p className="mt-2 max-w-2xl text-sm text-secondary">{view.range.note}</p>}
      {corrections.length > 0 && <DataNote corrections={corrections} />}

      <section aria-labelledby="crew" className="mt-6">
        <SectionLabel id="crew">{markerName} vs own baseline</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {view.crew.map((c) => (
            <CrewCard key={c.id} crew={c} view={view} markerName={markerName} />
          ))}
        </div>
      </section>

      <RcvCard view={view} markerName={markerName} />
    </>
  );
}

function CrewCard({ crew, view, markerName }: { crew: CrewView; view: MarkerView; markerName: string }) {
  const first = crew.post[0];
  const [people, you] = first ? first.verdict.answers : [undefined, undefined];
  const when = first?.label === "R+1" ? "Day after landing (R+1)" : `First draw after landing (${first?.label ?? "none"})`;
  const close = you ? closeCall(you) : null;
  const [noteBefore, noteAfter] = crew.baseNote?.split(DATA_NOTE_WORDS) ?? [];
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(44,44,44,0.04)]">
      <h3 className="text-lg font-semibold">Crew {crew.id}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-secondary">Baseline (median of pre-flight draws)</dt>
          <dd className="mt-0.5 text-base font-semibold">
            {crew.base !== null ? (
              <span className="whitespace-nowrap">{fmtValue(crew.base)} {crew.unit}</span>
            ) : noteAfter !== undefined ? (
              <>
                {noteBefore}
                <a href={`#${DATA_NOTE_ID}`} className="underline underline-offset-2 hover:text-chip-act">{DATA_NOTE_WORDS}</a>
                {noteAfter}
              </>
            ) : (
              "Not enough pre-flight draws"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-secondary">{when}</dt>
          <dd className="mt-0.5 text-base font-semibold">
            {first ? <span className="whitespace-nowrap">{fmtValue(first.verdict.reading.value)} {crew.unit}</span> : "No post-flight draw"}
            {you?.changePct !== undefined && <span className="ml-1.5 inline-block font-medium text-secondary">({fmtPct(you.changePct, close ? 1 : 0)})</span>}
          </dd>
        </div>
      </dl>
      {close && <p className="mt-3 text-sm font-medium">{close}</p>}
      {people && you && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
          <AnswerBox question="Normal for people?" answer={people} />
          <AnswerBox question="Normal for you?" answer={you} />
        </div>
      )}
      <CrewChart crew={crew} range={view.range} markerName={markerName} />
    </article>
  );
}

function DataNote({ corrections }: { corrections: Correction[] }) {
  return (
    <section id={DATA_NOTE_ID} aria-labelledby="data-note" className="mt-4 max-w-2xl scroll-mt-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(44,44,44,0.04)]">
      <SectionLabel id="data-note">Data note</SectionLabel>
      <p className="mt-2 text-sm">{dataNoteIntro(corrections)}</p>
      {corrections.map((c) => (
        <div key={c.sample} className="mt-3">
          <p className="text-sm">{correctionSentence(c)}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-secondary">
            {c.changes.map((ch) => (
              <li key={ch.indicator}>
                <span className="font-medium text-charcoal">{changeLabel(ch)}</span>: file {ch.fileValue === null ? "empty" : fmtValue(ch.fileValue)}, used{" "}
                {ch.usedValue === null ? "none" : fmtValue(ch.usedValue)}. {ch.reason}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function AnswerBox({ question, answer }: { question: string; answer: Answer }) {
  return (
    <div className="rounded-xl border border-border-soft bg-card-muted p-3">
      <p className="text-sm font-medium">{question}</p>
      <div className="mt-1.5">
        <StatusChip status={answer.status} />
      </div>
      <p className="mt-1.5 text-xs text-secondary">{answer.compareTo}</p>
    </div>
  );
}

const CHIP: Record<Status, { label: string; cls: string; icon: ReactNode }> = {
  nominal: {
    label: "Nominal",
    cls: "bg-teal-soft text-chip-nominal",
    icon: <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  watch: {
    label: "Watch",
    cls: "bg-yellow-soft text-chip-watch",
    icon: (
      <>
        <path d="M8 1.5l7 13H1z" fill="currentColor" />
        <path d="M8 6v4M8 12v.5" stroke="var(--yellow-soft)" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  act: {
    label: "Act",
    cls: "bg-primary-soft text-chip-act",
    icon: (
      <>
        <path d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" fill="currentColor" />
        <path d="M8 4.5v4.5M8 11.2v.3" stroke="var(--primary-soft)" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  notMeasured: {
    label: "Not measured",
    cls: "bg-border-soft text-chip-none",
    icon: <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  },
};

function StatusChip({ status }: { status: Status }) {
  const c = CHIP[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.cls}`}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">{c.icon}</svg>
      {c.label}
    </span>
  );
}

function RcvCard({ view, markerName }: { view: MarkerView; markerName: string }) {
  const { row, z, rcv } = view;
  const direction =
    row.badDirection === "both"
      ? "Two-sided: either direction counts."
      : row.indicator === "lymphAbs" && row.badDirection === "down"
        ? "One-sided: a fall in lymphocytes after flight was named in advance from the literature. We first saw these drops on 5 Nov 2026 and say so."
        : `One-sided: only a ${row.badDirection === "down" ? "fall" : "rise"} counts, named in advance from the literature.`;
  const items: [string, string][] = [
    ["Within-person variation (CVI)", fmtCv(row.cviPct)],
    ["Lab measurement variation (CVA)", fmtCv(row.cvaPct)],
    ["Z", z.toFixed(3)],
    ["Change that counts: down", fmtPct(rcv.downPct, 1)],
    ["Change that counts: up", fmtPct(rcv.upPct, 1)],
  ];
  return (
    <section aria-labelledby="rcv" className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(44,44,44,0.04)]">
      <SectionLabel id="rcv">How the reference change value is worked out</SectionLabel>
      <p className="mt-2 text-sm">
        For {markerName.toLowerCase()}, a change from the personal baseline counts only if it is bigger than normal
        day-to-day variation plus lab error. The band on each chart is the baseline moved by these limits
        (log-normal reference change value, Fokkema 2006).
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border-soft bg-card-muted p-3">
            <dt className="text-xs text-secondary">{k}</dt>
            <dd className="mt-1 text-lg font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm font-medium">{direction}</p>
      <p className="mt-1 text-xs text-secondary">Direction source: {row.directionSource}</p>
      <p className="mt-1 text-xs text-secondary">Variation source: {row.source}</p>
    </section>
  );
}

function SectionLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-xs font-semibold tracking-[0.08em] text-secondary uppercase">
      {children}
    </h2>
  );
}

function Notice({ children, error }: { children: ReactNode; error?: boolean }) {
  return (
    <p
      role={error ? "alert" : undefined}
      className={`mt-6 rounded-2xl border p-5 text-sm [overflow-wrap:anywhere] ${error ? "border-primary bg-primary-soft text-chip-act" : "border-border bg-card text-secondary"}`}
    >
      {children}
    </p>
  );
}
