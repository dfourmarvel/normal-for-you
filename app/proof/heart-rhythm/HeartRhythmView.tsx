"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CartesianGrid, ReferenceLine, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { loadFantasia, type Fantasia, type FantasiaGroup } from "@/lib/data/fantasia";
import { sampleEntropy } from "@/lib/engine";
import { GROUP_LABEL, chanceSentence, fmt, headline, summarise, type Person, type Summary } from "./summary";

// Fixed by the science lead before the final run; see "Honest limits".
const M = 2;
const R_FRACTION = 0.2;

const FANTASIA_URL = "https://physionet.org/content/fantasia/1.0.0/";
const GROUPS: FantasiaGroup[] = ["young", "elderly"];
const ROW: Record<FantasiaGroup, number> = { young: 1, elderly: 0 };
const COLOUR: Record<FantasiaGroup, string> = { young: "var(--teal-dark)", elderly: "var(--primary)" };
const AXIS = { fontSize: 11, fill: "var(--text-secondary)" };
const CARD = "rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(44,44,44,0.04)]";

type Meta = Omit<Fantasia, "records">;
type Load =
  | { state: "loading" }
  | { state: "computing"; current: number; total: number }
  | { state: "error"; message: string }
  | { state: "ready"; people: Person[]; meta: Meta; seconds: number };

export function HeartRhythmView() {
  const [load, setLoad] = useState<Load>({ state: "loading" });

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { records, ...meta } = await loadFantasia();
        const start = performance.now();
        const people: Person[] = [];
        for (const [i, r] of records.entries()) {
          if (!live) return;
          setLoad({ state: "computing", current: i + 1, total: records.length });
          // Hand the page back to the browser between records so it stays responsive.
          await new Promise((done) => setTimeout(done, 0));
          people.push({ id: r.id, group: r.group, age: r.age, sex: r.sex, intervals: r.nn.length, value: sampleEntropy(r.nn, M, R_FRACTION).value });
        }
        if (live) setLoad({ state: "ready", people, meta, seconds: (performance.now() - start) / 1000 });
      } catch (e) {
        if (live) setLoad({ state: "error", message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const summary = useMemo((): Summary | Error | null => {
    if (load.state !== "ready") return null;
    try {
      return summarise(load.people);
    } catch (e) {
      return e instanceof Error ? e : new Error(String(e));
    }
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-chip-nominal">
          <svg aria-hidden="true" viewBox="0 0 8 8" className="h-2 w-2"><circle cx="4" cy="4" r="4" fill="currentColor" /></svg>
          Real data
        </span>
        <h1 className="mt-3 text-[28px] leading-tight font-bold">Heart rhythm predictability</h1>
        <p className="mt-2 text-secondary">
          A healthy heart does not tick like a clock: the gap between beats changes all the time. This page measures how
          regular those changes are for 40 healthy adults, worked out in your browser.
        </p>
        <p className="mt-2 text-sm text-secondary">
          Real data:{" "}
          <a href={FANTASIA_URL} className="text-charcoal underline underline-offset-2 hover:text-chip-act" target="_blank" rel="noreferrer">
            PhysioNet Fantasia database, 2-hour resting heart recordings
          </a>
        </p>
      </header>

      <div aria-live="polite" aria-atomic="true">
        {load.state === "loading" && <Notice>Loading the heart recordings…</Notice>}
        {load.state === "computing" && <Notice>Computing {load.current} of {load.total}…</Notice>}
        {load.state === "error" && <Notice error>Could not load the heart recordings. {load.message}</Notice>}
        {summary instanceof Error && <Notice error>Could not compare the groups. {summary.message}</Notice>}
        {load.state === "ready" && summary && !(summary instanceof Error) && (
          <p className="mt-6 text-xs text-secondary">
            Worked out in your browser in {load.seconds.toFixed(1)} s from {load.people.reduce((n, p) => n + p.intervals, 0).toLocaleString("en")} heartbeat gaps.
          </p>
        )}
      </div>

      {load.state === "ready" && summary && !(summary instanceof Error) && <Results people={load.people} summary={summary} />}

      <section aria-labelledby="what" className={`mt-6 ${CARD}`}>
        <SectionLabel id="what">What this measures</SectionLabel>
        <p className="mt-2 text-sm">
          The number is sample entropy. It looks at short runs of heartbeat gaps and asks how often a pattern that repeats
          for {M} beats still repeats on the next one. A more regular, predictable rhythm gives a lower number; a less
          predictable one gives a higher number. Higher is not always healthier: an irregular heartbeat such as atrial
          fibrillation scores high too (Costa, Goldberger &amp; Peng 2002).
        </p>
        <p className="mt-2 text-sm">
          In healthy people, the rhythm tends to become more regular with age (Lipsitz &amp; Goldberger 1992).
        </p>
        <p className="mt-2 text-xs text-secondary">
          Method: gaps between normal heartbeats over the whole recording; pattern length {M} beats; two gaps count as alike
          when they differ by at most {R_FRACTION} × that person&apos;s standard deviation (the usual spread of their gaps).
          Richman &amp; Moorman 2000.
        </p>
      </section>

      <section aria-labelledby="limits" className={`mt-6 ${CARD}`}>
        <SectionLabel id="limits">Honest limits</SectionLabel>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            The groups overlap a lot
            {summary && !(summary instanceof Error)
              ? `: in ${summary.test.pairs - summary.test.u} of ${summary.test.pairs} pairs the older person scored higher. One person's number says little about their age.`
              : ". One person's number says little about their age."}
          </li>
          <li>One 2-hour resting recording per person, at one point in time.</li>
          <li>
            The number depends on recording length and settings. We tried four record lengths (the first 1,000, 2,000 and
            4,000 beats, and the whole recording) before settling on whole recordings, with pattern length {M} and tolerance{" "}
            {R_FRACTION} × the person&apos;s standard deviation. The three shorter windows gave p = 0.07, 0.29 and 0.007, so
            the two shortest showed a weaker age gap. The p-value above is not adjusted for trying four lengths.
          </li>
          <li>These are healthy adults on Earth, not astronauts.</li>
          <li>
            In space this would need a beat-to-beat recording, such as a chest-strap heart monitor. The simulated crew in this
            app have none, so for them it reads &ldquo;Not measured&rdquo;.
          </li>
          <li className="font-semibold">Screening, not a diagnosis.</li>
          <li>Not clinically validated, and not a replacement for NASA medical personnel.</li>
        </ul>
      </section>

      <section aria-labelledby="sources" className={`mt-6 ${CARD}`}>
        <SectionLabel id="sources">Sources</SectionLabel>
        <ul className="mt-2 space-y-2 text-xs text-secondary [overflow-wrap:anywhere]">
          {load.state === "ready" && (
            <>
              <li><span className="font-medium text-charcoal">Data:</span> {load.meta.source}. Licence: {load.meta.licence}.</li>
              <li><span className="font-medium text-charcoal">Processing:</span> {load.meta.method}</li>
            </>
          )}
          <li>Iyengar N, Peng C-K, Morin R, Goldberger AL, Lipsitz LA. Age-related alterations in the fractal scaling of cardiac interbeat interval dynamics. Am J Physiol 1996;271:R1078-R1084.</li>
          <li>Goldberger AL et al. PhysioBank, PhysioToolkit, and PhysioNet. Circulation 2000;101(23):e215-e220.</li>
          <li>Richman JS, Moorman JR. Physiological time-series analysis using approximate entropy and sample entropy. Am J Physiol Heart Circ Physiol 2000;278:H2039–H2049.</li>
          <li>Costa M, Goldberger AL, Peng C-K. Multiscale entropy analysis of complex physiologic time series. Phys Rev Lett 2002;89:068102.</li>
          <li>Lipsitz LA, Goldberger AL. Loss of &lsquo;complexity&rsquo; and aging. JAMA 1992;267:1806–1809.</li>
        </ul>
      </section>
    </div>
  );
}

interface Dot { x: number; y: number; id: string; age: number | null; group: FantasiaGroup }

function Results({ people, summary }: { people: Person[]; summary: Summary }) {
  const scored = people.filter((p) => p.value !== undefined);
  const dots = (g: FantasiaGroup): Dot[] =>
    scored
      .filter((p) => p.group === g)
      // A small fixed vertical spread so dots with close values don't hide each other.
      .map((p, i) => ({ x: p.value!, y: ROW[g] + ((i % 5) - 2) * 0.07, id: p.id, age: p.age, group: g }));
  const values = scored.map((p) => p.value!);
  const domain: [number, number] = [Math.floor(Math.min(...values) * 10) / 10, Math.ceil(Math.max(...values) * 10) / 10];
  const groupText = (g: FantasiaGroup) => {
    const s = summary[g];
    return `${GROUP_LABEL[g]} (${s.ageMin}–${s.ageMax} years): ${s.n} people, median ${fmt(s.median)}, range ${fmt(s.min, 2)} to ${fmt(s.max, 2)}`;
  };

  return (
    <>
      <p className="mt-6 max-w-2xl text-lg font-medium">{headline(summary)}</p>
      <p className="mt-2 max-w-2xl text-sm text-secondary">{chanceSentence(summary)}</p>
      <p className="mt-1 max-w-2xl text-xs text-secondary">
        We tried four record lengths before choosing whole recordings, so this p-value is not adjusted for that. See Honest limits below.
      </p>
      {summary.failed.length > 0 && (
        <p className="mt-2 max-w-2xl text-sm">
          Left out, because the number can&apos;t be computed for them: {summary.failed.map((p) => p.id).join(", ")}.
        </p>
      )}

      <section aria-labelledby="plot" className={`mt-6 ${CARD}`}>
        <SectionLabel id="plot">Sample entropy per person</SectionLabel>
        <figure className="mt-3">
          <div aria-hidden="true">
            <ScatterChart responsive style={{ width: "100%", height: 220 }} margin={{ top: 8, right: 12, bottom: 8, left: 0 }} accessibilityLayer={false}>
              <CartesianGrid horizontal={false} stroke="var(--border-soft)" />
              <XAxis type="number" dataKey="x" domain={domain} tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--border)" }} tickFormatter={(v: number) => v.toFixed(1)} />
              <YAxis
                type="number"
                dataKey="y"
                domain={[-0.6, 1.6]}
                ticks={[0, 1]}
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v: number) => (v === ROW.young ? GROUP_LABEL.young : GROUP_LABEL.elderly)}
              />
              <Tooltip cursor={false} content={DotTip} />
              {GROUPS.map((g) => (
                <Scatter key={g} data={dots(g)} fill={COLOUR[g]} shape={g === "young" ? "circle" : "diamond"} isAnimationActive={false} />
              ))}
              {GROUPS.map((g) => (
                <ReferenceLine
                  key={g}
                  segment={[{ x: summary[g].median, y: ROW[g] - 0.4 }, { x: summary[g].median, y: ROW[g] + 0.4 }]}
                  stroke="var(--charcoal)"
                  strokeWidth={2}
                />
              ))}
            </ScatterChart>
          </div>
          <figcaption className="mt-2 text-xs text-secondary">
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <svg aria-hidden="true" viewBox="0 0 10 10" className="h-2.5 w-2.5"><circle cx="5" cy="5" r="5" fill={COLOUR.young} /></svg> Young
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg aria-hidden="true" viewBox="0 0 10 10" className="h-2.5 w-2.5"><path d="M5 0l5 5-5 5-5-5z" fill={COLOUR.elderly} /></svg> Older
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block h-3 w-0.5 bg-charcoal" /> Group median
              </span>
            </span>
            <span className="mt-1 block">
              Each mark is one person; further right means a less predictable rhythm. {groupText("young")}. {groupText("elderly")}.
              Every number is in the tables below.
            </span>
          </figcaption>
        </figure>
      </section>

      <section aria-labelledby="people" className="mt-6">
        <SectionLabel id="people">Each person</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {GROUPS.map((g) => (
            <PeopleTable key={g} group={g} people={people.filter((p) => p.group === g)} />
          ))}
        </div>
      </section>
    </>
  );
}

function DotTip({ active, payload }: { active?: boolean; payload?: readonly { payload?: Dot }[] }) {
  const d = active ? payload?.[0]?.payload : undefined;
  if (!d) return null;
  return (
    <div className="rounded-[10px] border border-border bg-card px-2.5 py-1.5 text-xs shadow-card">
      <div className="font-semibold">{d.id}</div>
      <div>{GROUP_LABEL[d.group]}{d.age !== null ? `, age ${d.age}` : ""}</div>
      <div>Sample entropy {fmt(d.x)}</div>
    </div>
  );
}

function PeopleTable({ group, people }: { group: FantasiaGroup; people: Person[] }) {
  const rows = [...people].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  return (
    <div className={`${CARD} p-4`}>
      <table className="w-full text-sm tabular-nums">
        <caption className="mb-2 text-left font-semibold">{GROUP_LABEL[group]} adults, highest number first</caption>
        <thead className="text-xs text-secondary">
          <tr>
            <th scope="col" className="py-1 text-left font-medium">Person</th>
            <th scope="col" className="py-1 text-right font-medium">Age</th>
            <th scope="col" className="py-1 text-right font-medium">Sex</th>
            <th scope="col" className="py-1 text-right font-medium">Gaps used</th>
            <th scope="col" className="py-1 text-right font-medium">Entropy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border-soft">
              <th scope="row" className="py-1 text-left font-normal">{p.id}</th>
              <td className="py-1 text-right">{p.age ?? "–"}</td>
              <td className="py-1 text-right">{p.sex ?? "–"}</td>
              <td className="py-1 text-right">{p.intervals.toLocaleString("en")}</td>
              <td className="py-1 text-right font-semibold">{p.value === undefined ? "Can't be computed" : fmt(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
