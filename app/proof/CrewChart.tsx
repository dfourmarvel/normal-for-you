"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, Tooltip, XAxis, YAxis } from "recharts";
import type { RangeRow } from "@/lib/data/tables";
import { fmtValue, type CrewView } from "./compute";

const AXIS = { fontSize: 11, fill: "var(--text-secondary)" };

export function CrewChart({ crew, range, markerName }: { crew: CrewView; range?: RangeRow; markerName: string }) {
  const lab = range?.low && range?.high ? { low: range.low.value, high: range.high.value } : undefined;

  return (
    <figure className="mt-4">
      <div aria-hidden="true">
        <LineChart responsive style={{ width: "100%", height: 200 }} data={crew.draws} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} stroke="var(--border-soft)" />
          {lab && (
            <ReferenceArea y1={lab.low} y2={lab.high} fill="#efebe6" fillOpacity={1} stroke="var(--text-muted)" strokeDasharray="4 3" ifOverflow="extendDomain" />
          )}
          {crew.band && (
            <ReferenceArea y1={crew.band.low} y2={crew.band.high} fill="var(--teal-soft)" fillOpacity={1} stroke="var(--teal)" ifOverflow="extendDomain" />
          )}
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval={0} padding={{ left: 14, right: 14 }} />
          <YAxis domain={["auto", "auto"]} tick={AXIS} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => fmtValue(v)} />
          <Tooltip
            formatter={(v) => [`${fmtValue(Number(v))} ${crew.unit}`, markerName]}
            contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
          />
          <Line type="linear" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3.5, fill: "var(--primary)", strokeWidth: 0 }} isAnimationActive={false} />
        </LineChart>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-0.5 w-4 rounded bg-primary" /> {crew.id} values
        </span>
        {crew.band && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-3 w-4 rounded-sm border border-teal bg-teal-soft" /> Personal band
          </span>
        )}
        {lab && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-3 w-4 rounded-sm border border-dashed border-muted bg-[#efebe6]" /> Lab range
          </span>
        )}
      </figcaption>
      {/* sr-only on a wrapper: a <table> ignores the 1px width and would widen the page. */}
      <div className="sr-only">
        <table>
          <caption>
            {markerName} for {crew.id} at each draw, {crew.unit}
            {lab ? `; lab range ${fmtValue(lab.low)} to ${fmtValue(lab.high)}` : ""}
            {crew.band ? `; personal band ${fmtValue(crew.band.low)} to ${fmtValue(crew.band.high)}` : ""}
          </caption>
          <thead>
            <tr>
              <th scope="col">Draw</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {crew.draws.map((d) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>{fmtValue(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
