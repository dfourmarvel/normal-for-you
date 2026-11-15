import type { Indicator } from "@/lib/types";

export const INDICATOR_LABEL: Record<Indicator, string> = {
  restingHR: "resting heart rate", sbp: "systolic blood pressure", dbp: "diastolic blood pressure",
  spo2: "blood oxygen", tempC: "body temperature", glucose: "glucose", bodyMass: "body mass",
  sleepHours: "sleep", fatigueSP: "fatigue score", moodPHQ2: "mood score", pvtLapses: "reaction-test lapses",
  hrvRMSSD: "heart-rate variability", lymphAbs: "lymphocytes", neutAbs: "neutrophils",
  wbc: "white blood cells", hb: "haemoglobin", plt: "platelets", co2: "cabin CO2", radDose: "radiation dose",
};

const PLURAL = new Set<Indicator>(["lymphAbs", "neutAbs", "wbc", "plt", "pvtLapses"]);
export const isAre = (i: Indicator): "is" | "are" => (PLURAL.has(i) ? "are" : "is");

export function fmtNum(n: number): string {
  const dp = Math.abs(n) >= 100 ? 0 : 1;
  return n.toLocaleString("en-US", { maximumFractionDigits: dp });
}

export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
