import type { Indicator, Reading } from "@/lib/types";

export const MIN_BASELINE_READINGS = 3;
export const MIN_OWN_SD_READINGS = 5;

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export const mean = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0) / values.length;

export function sampleSD(values: readonly number[]): number {
  const m = mean(values);
  return Math.sqrt(values.reduce((a, v) => a + (v - m) ** 2, 0) / (values.length - 1));
}

export function preflightValues(history: readonly Reading[], astronautId: string, indicator: Indicator): number[] {
  return history
    .filter((r) => r.astronautId === astronautId && r.indicator === indicator && r.phase === "preflight" && Number.isFinite(r.value))
    .map((r) => r.value);
}

export const countPreflight = (history: readonly Reading[], astronautId: string, indicator: Indicator): number =>
  preflightValues(history, astronautId, indicator).length;

export function baseline(history: readonly Reading[], astronautId: string, indicator: Indicator): number | null {
  const values = preflightValues(history, astronautId, indicator);
  return values.length < MIN_BASELINE_READINGS ? null : median(values);
}
