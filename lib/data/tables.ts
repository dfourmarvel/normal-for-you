// Shapes of the sourced reference tables. Every row names its source; nothing is typed in without one.
import type { Indicator, Phase } from "@/lib/types";

// Which way a change is bad for the person.
// "down"/"up": the literature (or the scale's own definition) names the risky direction in advance → one-sided RCV, Z = 1.645.
// "both": either direction is bad → two-sided RCV, Z = 1.96.
export type BadDirection = "up" | "down" | "both";

interface VariationBase {
  indicator: Indicator;
  badDirection: BadDirection;
  directionSource: string; // why that direction (citation, or "scale definition: higher = worse")
  source: string;
}

// "populationCV": published within-person CV → log-normal RCV against the median of ≥3 pre-flight readings.
// "ownSD": no usable published CV → the astronaut's own pre-flight SD (Coskun 2022 model 2, 01a), needs ≥5 readings.
export type VariationRow =
  | (VariationBase & {
      method: "populationCV";
      cviPct: number;      // within-person CV, %
      cvaPct: number;      // analytical CV, %; 0 when the study's figure already includes device error
      status: "eflm" | "single-study" | "unverified";
    })
  | (VariationBase & { method: "ownSD" });

// An edge stored as the guideline words it: "<120" → { value: 120, inclusive: false }.
// For low/high, inclusive = the edge value itself is still normal. For critLow/critHigh, inclusive = the edge value itself is act.
export interface Edge { value: number; inclusive: boolean }

export interface RangeRow {
  indicator: Indicator;
  low?: Edge;
  high?: Edge;
  critLow?: Edge;
  critHigh?: Edge;
  unit: string;
  label: string;           // shown on screen, e.g. "NEWS2 band 50–90 bpm"
  note?: string;
  source: string;
}

export interface LimitRow {
  indicator: Indicator;
  limit: number;
  breachedWhen: "above" | "atOrAbove" | "below" | "atOrBelow"; // "no more than 3" → above; "less than 600" → atOrAbove
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
