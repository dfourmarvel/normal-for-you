// Shapes of the sourced reference tables. Every row names its source; nothing is typed in without one.
import type { Indicator, Phase } from "@/lib/types";

// Which way a change is bad for the person.
// "down"/"up": the literature (or the scale's own definition) names the risky direction in advance → one-sided RCV, Z = 1.645.
// "both": either direction is bad → two-sided RCV, Z = 1.96.
export type BadDirection = "up" | "down" | "both";

export interface VariationRow {
  indicator: Indicator;
  cviPct: number;          // within-person CV, %
  cvaPct: number;          // analytical CV, %; 0 when the study's figure already includes device error
  badDirection: BadDirection;
  directionSource: string; // why that direction (citation, or "scale definition: higher = worse")
  status: "eflm" | "single-study" | "unverified";
  source: string;
}

export interface RangeRow {
  indicator: Indicator;
  low?: number;            // inclusive lower edge of normal
  high?: number;           // inclusive upper edge of normal
  critLow?: number;        // at or below → act
  critHigh?: number;       // at or above → act
  unit: string;
  label: string;           // shown on screen, e.g. "NEWS2 band 51–90 bpm"
  note?: string;
  source: string;
}

export interface LimitRow {
  indicator: Indicator;
  limit: number;
  breachedWhen: "above" | "below";
  unit: string;
  requirementNo: string;   // e.g. "V2 6004"
  label: string;
  source: string;
}

export interface PhaseRow {
  phase: Phase;
  indicator: Indicator;
  expected: "up" | "down" | "none" | "noEvidence";
  maxChangePct?: number;   // largest expected change (absolute %), when the source gives a size
  note: string;
  source: string;
}

export interface Tables {
  variation: VariationRow[];
  ranges: RangeRow[];
  limits: LimitRow[];
  phases: PhaseRow[];
}
