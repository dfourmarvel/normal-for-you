import type { Indicator, Reading } from "@/lib/types";

// A missing or unparseable takenAt ties, so the order falls through to position in history.
function byTime(a: Reading, b: Reading): number {
  const ta = Date.parse(a.takenAt);
  const tb = Date.parse(b.takenAt);
  return Number.isFinite(ta) && Number.isFinite(tb) ? ta - tb : 0;
}

// One person's valid non-preflight readings of one indicator, oldest first: mission day, then takenAt, then position in history.
// `extra` (a reading being judged that is not in history) is placed after everything already logged.
export function inFlightSeries(history: readonly Reading[], astronautId: string, indicator: Indicator, extra?: Reading): Reading[] {
  const all = extra && !history.includes(extra) ? [...history, extra] : history;
  return all
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.astronautId === astronautId && r.indicator === indicator && r.phase !== "preflight" && Number.isFinite(r.value))
    .sort((a, b) => a.r.missionDay - b.r.missionDay || byTime(a.r, b.r) || a.i - b.i)
    .map(({ r }) => r);
}

export function previousReading(history: readonly Reading[], reading: Reading): Reading | undefined {
  const series = inFlightSeries(history, reading.astronautId, reading.indicator, reading);
  const at = series.indexOf(reading);
  return at > 0 ? series[at - 1] : undefined;
}
