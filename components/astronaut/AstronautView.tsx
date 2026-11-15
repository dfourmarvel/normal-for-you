"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  actionLines, buddyNotes, CHARTABLE, clampDay, crewCard, dayView, defaultTrendIndicator, detectionFacts, FIRST_DAY, humanPhases, isFlagged, LAST_DAY,
  QUESTION_LABEL, SCREENING, SIMULATED_LABEL, surgeonReport, trendView, valueText, type CrewId, type IndicatorRow, type RegionView,
} from "@/app/astronaut/model";
import { capitalize, INDICATOR_LABEL } from "@/lib/engine/format";
import type { Indicator } from "@/lib/types";
import { ReportDialog, type Report } from "./ReportDialog";
import { CARD, FOCUS, SectionLabel, SimulatedBadge, StatusChip } from "./StatusChip";
import { TrendChart } from "./TrendChart";

export function AstronautView({ id }: { id: CrewId }) {
  const card = crewCard(id);
  const [day, setDay] = useState(card.storyDays[0].day);
  const [draft, setDraft] = useState(String(day));
  const [picked, setPicked] = useState<Indicator | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const view = useMemo(() => dayView(id, day), [id, day]);
  const trendIndicator = picked ?? defaultTrendIndicator(view);
  const trend = useMemo(() => trendView(id, trendIndicator, day), [id, trendIndicator, day]);
  const buddies = buddyNotes(id, day);
  const facts = detectionFacts(id);

  // Screen readers hear the day line only after the slider has rested for 400 ms, not on every step of a drag.
  const dayLine = `Day ${view.day} of ${LAST_DAY}: ${view.phaseLabel}`;
  const [spoken, setSpoken] = useState(dayLine);
  useEffect(() => {
    const t = setTimeout(() => setSpoken(dayLine), 400);
    return () => clearTimeout(t);
  }, [dayLine]);

  const go = (d: number) => {
    const next = clampDay(d);
    setDay(next);
    setDraft(String(next));
  };
  const openReport = (region: RegionView) => {
    setReport({ title: `${region.label}, day ${view.day}`, text: surgeonReport(view, region) });
    dialog.current?.showModal();
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <Link href="/astronaut" className={`text-sm text-secondary underline underline-offset-2 hover:text-charcoal ${FOCUS}`}>
        All test astronauts
      </Link>
      <header className="mt-3 max-w-2xl">
        <SimulatedBadge text={SIMULATED_LABEL} />
        <h1 className="mt-3 text-[28px] leading-tight font-bold">{card.astronaut.name}: self-check</h1>
        <p className="mt-2 text-sm text-secondary">{card.story}</p>
      </header>

      <section aria-labelledby="day" className={`mt-6 ${CARD}`}>
        <SectionLabel id="day">Mission day</SectionLabel>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="range" min={FIRST_DAY} max={LAST_DAY} value={day} aria-label="Mission day"
            onChange={(e) => go(Number(e.target.value))}
            className={`min-h-11 min-w-0 flex-1 basis-56 accent-[var(--primary)] ${FOCUS}`}
          />
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            Day
            <input
              type="number" inputMode="numeric" min={FIRST_DAY} max={LAST_DAY} value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                const n = Number(e.target.value);
                if (e.target.value !== "" && Number.isInteger(n) && n >= FIRST_DAY && n <= LAST_DAY) setDay(n);
              }}
              onBlur={() => setDraft(String(day))}
              className={`min-h-11 w-20 rounded-lg border border-border bg-card px-2 text-base ${FOCUS}`}
            />
          </label>
        </div>
        <p className="mt-2 text-base font-semibold">{dayLine}</p>
        <p className="sr-only" aria-live="polite">{spoken}</p>
        <div role="group" aria-label="Story days" className="mt-3 flex flex-wrap gap-2">
          {card.storyDays.map((s) => (
            <button
              key={s.day} type="button" aria-pressed={day === s.day} onClick={() => go(s.day)}
              className={`min-h-11 rounded-full border px-4 text-sm font-medium ${FOCUS} ${
                day === s.day ? "border-primary bg-primary-soft text-chip-act" : "border-border bg-card text-secondary hover:border-primary hover:text-charcoal"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {buddies.map((b) => (
        <section key={b.check.weekOf + b.check.fromId} aria-label="Buddy check" className={`mt-4 ${CARD}`}>
          <p className="text-sm font-semibold">
            Buddy check from {b.fromName}, days {b.firstDay}–{b.lastDay}
            {b.check.note ? `: "${b.check.note}"` : ""}
          </p>
          <p className="mt-1 text-sm text-secondary">
            Concern from 0 (none) to 3 (serious): mood {b.check.mood}, sleep {b.check.sleep}, confusion {b.check.confusion}, conflict {b.check.conflict}.
            Not counted by the engine yet.
          </p>
        </section>
      ))}

      <section aria-labelledby="regions" className="mt-6">
        <SectionLabel id="regions">Body regions on day {view.day}</SectionLabel>
        <p className="mt-1 text-sm text-secondary">Each reading is the latest one in the last 7 days. {SCREENING}</p>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {view.regions.map((r) => (
            <RegionCard key={r.region} region={r} onReport={() => openReport(r)} />
          ))}
        </div>
      </section>

      <section aria-labelledby="trend" className={`mt-6 ${CARD}`}>
        <SectionLabel id="trend">Trend up to day {view.day}</SectionLabel>
        <label className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium">
          Reading
          <select
            value={trendIndicator} onChange={(e) => setPicked(e.target.value as Indicator)}
            className={`min-h-11 max-w-full rounded-lg border border-border bg-card px-2 text-base ${FOCUS}`}
          >
            {CHARTABLE.map((i) => <option key={i} value={i}>{capitalize(INDICATOR_LABEL[i])}</option>)}
          </select>
        </label>
        <TrendChart trend={trend} day={view.day} />
      </section>

      <section aria-labelledby="reliable" className={`mt-6 ${CARD}`}>
        <SectionLabel id="reliable">How reliable is this?</SectionLabel>
        {facts.length > 0 ? (
          <>
            <p className="mt-2 text-sm">Measured by running the engine on the simulated data, brain, sleep and mood region only. Flagged means Watch or Act.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {facts.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <p className="mt-2 text-sm text-secondary">These rates come from simulated astronauts, not real crews.</p>
          </>
        ) : (
          <p className="mt-2 text-sm">A has no story, so there is nothing to detect. The test suite checks that A stays Nominal on every cruise day, except eyes, which has no self-check yet.</p>
        )}
      </section>

      <section aria-labelledby="limits" className={`mt-6 ${CARD}`}>
        <SectionLabel id="limits">Honest limits</SectionLabel>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>{SIMULATED_LABEL}.</li>
          <li>Buddy checks are shown but not counted by the engine yet. Eyes have no self-check yet.</li>
          <li>Nothing on this page is sent anywhere. The report button only builds text you can copy.</li>
          <li className="font-semibold">{SCREENING}</li>
        </ul>
      </section>

      <ReportDialog ref={dialog} report={report} />
    </div>
  );
}

function RegionCard({ region, onReport }: { region: RegionView; onReport: () => void }) {
  const flagged = isFlagged(region.status);
  return (
    <article className={CARD} aria-labelledby={`r-${region.region}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`r-${region.region}`} className="text-lg font-semibold">{region.label}</h3>
        <StatusChip status={region.status} />
      </div>
      {region.reasons.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm [overflow-wrap:anywhere]">
          {region.reasons.map((r) => <li key={r}>{r}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-secondary">No reading flagged.</p>
      )}
      {region.combined && (
        <div className="mt-3 rounded-xl border border-yellow bg-yellow-soft p-3">
          <p className="text-sm font-semibold text-chip-watch">Combined drift</p>
          <p className="mt-1 text-sm">{region.combined.text}</p>
        </div>
      )}
      {region.rows.length > 0 && (
        <ul className="mt-3 divide-y divide-border-soft border-t border-border-soft">
          {region.rows.map((row) => <IndicatorItem key={row.indicator} row={row} />)}
        </ul>
      )}
      {flagged && (
        <button
          type="button" onClick={onReport}
          className={`mt-4 min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover ${FOCUS}`}
        >
          Report to flight surgeon
        </button>
      )}
    </article>
  );
}

function IndicatorItem({ row }: { row: IndicatorRow }) {
  const { result, label } = row;
  const v = result.verdict;
  if (!v) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
        <span>
          <span className="font-medium">{capitalize(label)}</span>
          <span className="block text-xs text-secondary">{result.reason}</span>
        </span>
        <StatusChip status={result.status} />
      </li>
    );
  }
  const flagged = isFlagged(v.overall);
  return (
    <li className="py-1">
      <details open={flagged} className="group">
        <summary className={`flex min-h-11 cursor-pointer list-none [&::-webkit-details-marker]:hidden flex-wrap items-center justify-between gap-2 rounded-lg py-1.5 text-sm ${FOCUS}`}>
          <span>
            <span aria-hidden="true" className="mr-1.5 inline-block text-secondary transition-transform group-open:rotate-90">›</span>
            <span className="font-medium">{capitalize(label)}</span>{" "}
            <span className="text-secondary">{valueText(v.reading)}, day {v.reading.missionDay}</span>
          </span>
          <StatusChip status={v.overall} />
        </summary>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {v.answers.map((a) => (
            <div key={a.question} className="rounded-xl border border-border-soft bg-card-muted p-3">
              <p className="text-xs font-medium">{QUESTION_LABEL[a.question]}</p>
              <div className="mt-1.5"><StatusChip status={a.status} /></div>
              <p className="mt-1.5 text-xs text-secondary [overflow-wrap:anywhere]">{humanPhases(a.compareTo)}</p>
              {a.source && <p className="mt-1 text-xs text-secondary [overflow-wrap:anywhere]">{a.source}</p>}
            </div>
          ))}
        </div>
        {flagged && (
          <dl className="mt-2 space-y-1.5 rounded-xl border border-border p-3 text-sm">
            {actionLines(v).map(([k, text]) => (
              <div key={k}>
                <dt className="text-xs font-semibold text-secondary">{k}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        )}
      </details>
    </li>
  );
}
