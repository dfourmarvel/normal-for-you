"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendView } from "@/app/astronaut/model";
import { fmtNum } from "@/lib/engine/format";

const AXIS = { fontSize: 11, fill: "var(--text-secondary)" };

export function TrendChart({ trend, day }: { trend: TrendView; day: number }) {
  const { points, band, range, unit, label } = trend;
  const last = points.at(-1);
  const hasRange = range && (range.low !== undefined || range.high !== undefined);
  return (
    <figure className="mt-3">
      <div aria-hidden="true">
        <LineChart responsive style={{ width: "100%", height: 220 }} data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} stroke="var(--border-soft)" />
          {hasRange && (
            <ReferenceArea y1={range.low} y2={range.high} fill="var(--border-soft)" fillOpacity={0.9} stroke="var(--text-muted)" strokeDasharray="4 3" ifOverflow="extendDomain" />
          )}
          {band && (
            <ReferenceArea y1={band.low} y2={band.high} fill="var(--teal-soft)" fillOpacity={0.8} stroke="var(--teal-dark)" ifOverflow="extendDomain" />
          )}
          <XAxis dataKey="day" type="number" domain={[0, Math.max(day, 1)]} tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis domain={["auto", "auto"]} tick={AXIS} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => fmtNum(v)} />
          <Tooltip
            labelFormatter={(d) => `Day ${d}`}
            formatter={(v) => [`${fmtNum(Number(v))} ${unit}`, label]}
            contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, background: "var(--bg-card)" }}
          />
          <Line type="linear" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-0.5 w-4 rounded bg-primary" /> {label}, {unit}
        </span>
        {band && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-3 w-4 rounded-sm border border-teal-dark bg-teal-soft" /> Your band {fmtNum(band.low)}–{fmtNum(band.high)}
          </span>
        )}
        {hasRange && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-3 w-4 rounded-sm border border-dashed border-muted bg-border-soft" /> Range for people: {range.label}
          </span>
        )}
        {!hasRange && <span>No range for people for this reading.</span>}
      </figcaption>
      <p className="sr-only">
        {label} from day {points[0]?.day ?? 0} to day {day}
        {last ? `; latest ${fmtNum(last.value)} ${unit} on day ${last.day}` : "; no readings yet"}
        {band ? `; your band ${fmtNum(band.low)} to ${fmtNum(band.high)}` : ""}
        {hasRange ? `; range for people: ${range.label}` : ""}.
      </p>
    </figure>
  );
}
