import type { Indicator, Reading } from "@/lib/types";

export const MIN_BASELINE_READINGS = 3;

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function countPreflight(history: readonly Reading[], astronautId: string, indicator: Indicator): number {
  return history.filter((r) => isPreflightOf(r, astronautId, indicator)).length;
}

const isPreflightOf = (r: Reading, astronautId: string, indicator: Indicator): boolean =>
  r.astronautId === astronautId && r.indicator === indicator && r.phase === "preflight" && Number.isFinite(r.value);

export function baseline(history: readonly Reading[], astronautId: string, indicator: Indicator): number | null {
  const values = history.filter((r) => isPreflightOf(r, astronautId, indicator)).map((r) => r.value);
  return values.length < MIN_BASELINE_READINGS ? null : median(values);
}
