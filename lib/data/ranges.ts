// Population vital-sign ranges for the "normal for people?" answer; CBC ranges come from the OSD-569 file itself.
// Edges are stored as the guideline words them ("<120" → { value: 120, inclusive: false }); see Edge in tables.ts.
import type { RangeRow } from "@/lib/data/tables";

export const ranges: RangeRow[] = [
  {
    indicator: "restingHR",
    low: { value: 50, inclusive: true },
    high: { value: 90, inclusive: true },
    critLow: { value: 40, inclusive: true },
    critHigh: { value: 131, inclusive: true },
    unit: "bpm",
    label: "NEWS2 band 50–90 bpm (textbook 60–100)",
    note: "Normal band 50–90 is the science lead's choice (02 §3): Spodick 1996 proposes 50–90; NEWS2 scores 0 for 51–90. Act edges are the NEWS2 score-3 bands (≤40, ≥131). Resting readings only (seated, after a few minutes still).",
    source: "Spodick 1996, South Med J, abstract; RCP NEWS2 Chart 1 (2017) (01d §1–2); science lead decision, 14 Nov (02 §3)",
  },
  {
    indicator: "sbp",
    high: { value: 120, inclusive: false },
    critHigh: { value: 180, inclusive: false },
    unit: "mmHg",
    label: "US scale: normal <120 mmHg",
    note: "Normal <120; elevated 120–129, stage 1 130–139, stage 2 ≥140; severe >180. ESC 2024: hypertension ≥140/90. Grade from a cuff, not a smartwatch.",
    source:
      "ACC/AHA 2017, kept in AHA/ACC 2025 (CDC page, reviewed 13 Oct 2026); severe threshold from the 2025 Guideline-at-a-Glance (01d §1–2)",
  },
  {
    indicator: "dbp",
    high: { value: 80, inclusive: false },
    critHigh: { value: 120, inclusive: false },
    unit: "mmHg",
    label: "US scale: normal <80 mmHg",
    note: "Normal <80; stage 1 80–89, stage 2 ≥90; severe >120. ESC 2024: hypertension ≥140/90. Grade from a cuff, not a smartwatch.",
    source:
      "ACC/AHA 2017, kept in AHA/ACC 2025 (CDC page, reviewed 13 Oct 2026); severe threshold from the 2025 Guideline-at-a-Glance (01d §1–2)",
  },
  {
    indicator: "spo2",
    low: { value: 96, inclusive: true },
    critLow: { value: 91, inclusive: true },
    unit: "%",
    label: "NEWS2 Scale 1: normal ≥96%",
    note: "Act edge is the NEWS2 score-3 band (≤91). BTS: any sudden fall of more than 3% needs assessment. Assumes sea-level pressure on room air; a reduced-pressure cabin needs its ppO2 (01c).",
    source: "RCP NEWS2 Chart 1 (2017); BTS oxygen guideline 2017, Web Appendices 3 and 5 (01d §1–2)",
  },
  {
    indicator: "tempC",
    low: { value: 35.7, inclusive: true },
    high: { value: 37.4, inclusive: true },
    critLow: { value: 35.0, inclusive: true },
    critHigh: { value: 38.0, inclusive: true },
    unit: "°C",
    label: "Oral 35.7–37.4 °C typical; fever ≥38.0 °C",
    note: "Above 37.4 and below 38.0 is 'above usual, not fever' (watch); ≥38.0 is fever by the CDC definition, so it is the act edge. Low act edge ≤35.0 is NEWS2 score 3. Tympanic typical 35.8–37.5. Daily swing about 0.5 °C, so log time of day. Resting core temperature rises about 1 °C in long flights (01b §3).",
    source:
      "Geneva et al. 2019 systematic review, Open Forum Infect Dis, abstract; CDC fever definition (15 May 2024); RCP NEWS2 Chart 1 (01d §1–2)",
  },
  {
    indicator: "glucose",
    low: { value: 70, inclusive: true },
    high: { value: 100, inclusive: false },
    critLow: { value: 54, inclusive: false },
    unit: "mg/dL",
    label: "US scale: fasting normal <100 mg/dL; low <70 mg/dL",
    note: "Fasting venous plasma. Prediabetes 100–125, diabetes ≥126 (needs two results). Low: Level 1 <70, Level 2 <54. WHO starts impaired fasting glucose at 110 mg/dL (6.1 mmol/L).",
    source:
      "ADA Standards of Care 2026, Section 2 Tables 2.1–2.2 and Section 6 Table 6.4; WHO/IDF 2006 (01d §1–2)",
  },
  {
    indicator: "sleepHours",
    low: { value: 7, inclusive: true },
    unit: "h",
    label: "AASM/SRS: at least 7 h per night",
    note: "Under 7 h regularly is linked to harm; the guideline is about regular sleep, not one night. Over 9 h may suit young adults, people catching up on sleep debt, or ill people; uncertain for others.",
    source: "Watson et al. 2015, AASM/SRS joint consensus statement, Sleep, adults 18–60 (01d §1)",
  },
];
