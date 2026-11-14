// Population vital-sign ranges for the "normal for people?" answer; CBC ranges come from the OSD-569 file itself.
import type { RangeRow } from "@/lib/data/tables";

export const ranges: RangeRow[] = [
  {
    indicator: "restingHR",
    low: 51,
    high: 90,
    critLow: 40,
    critHigh: 131,
    unit: "bpm",
    label: "NEWS2 band 51–90 bpm",
    note: "Act edges are the NEWS2 score-3 bands (≤40, ≥131). Spodick 1996 proposes 50–90; textbook range 60–100 shown beside it. Resting readings only (seated, after a few minutes still).",
    source: "RCP NEWS2 Chart 1 (2017); Spodick 1996, South Med J, abstract (01d §1–2)",
  },
  {
    indicator: "sbp",
    high: 119,
    critHigh: 181,
    unit: "mmHg",
    label: "US scale: normal <120 mmHg",
    note: "Normal is <120; 119 and 181 are the whole-mmHg edges of '<120' and 'severe >180'. Elevated 120–129, stage 1 130–139, stage 2 ≥140. ESC 2024: hypertension ≥140/90. Grade from a cuff, not a smartwatch.",
    source:
      "ACC/AHA 2017, kept in AHA/ACC 2025 (CDC page, reviewed 13 Oct 2026); severe threshold from the 2025 Guideline-at-a-Glance (01d §1–2)",
  },
  {
    indicator: "dbp",
    high: 79,
    critHigh: 121,
    unit: "mmHg",
    label: "US scale: normal <80 mmHg",
    note: "Normal is <80; 79 and 121 are the whole-mmHg edges of '<80' and 'severe >120'. Stage 1 80–89, stage 2 ≥90. ESC 2024: hypertension ≥140/90. Grade from a cuff, not a smartwatch.",
    source:
      "ACC/AHA 2017, kept in AHA/ACC 2025 (CDC page, reviewed 13 Oct 2026); severe threshold from the 2025 Guideline-at-a-Glance (01d §1–2)",
  },
  {
    indicator: "spo2",
    low: 96,
    critLow: 91,
    unit: "%",
    label: "NEWS2 Scale 1: normal ≥96%",
    note: "Act edge is the NEWS2 score-3 band (≤91). BTS: any sudden fall of more than 3% needs assessment. Assumes sea-level pressure on room air; a reduced-pressure cabin needs its ppO2 (01c).",
    source: "RCP NEWS2 Chart 1 (2017); BTS oxygen guideline 2017, Web Appendices 3 and 5 (01d §1–2)",
  },
  {
    indicator: "tempC",
    low: 35.7,
    high: 37.4,
    critLow: 35.0,
    critHigh: 38.0,
    unit: "°C",
    label: "Oral 35.7–37.4 °C typical; fever ≥38.0 °C",
    note: "Above 37.4 and below 38.0 is 'above usual, not fever' (watch); ≥38.0 is fever by the CDC definition, so it is the act edge. Low act edge ≤35.0 is NEWS2 score 3. Tympanic typical 35.8–37.5. Daily swing about 0.5 °C, so log time of day. Resting core temperature rises about 1 °C in long flights (01b §3).",
    source:
      "Geneva et al. 2019 systematic review, Open Forum Infect Dis, abstract; CDC fever definition (15 May 2024); RCP NEWS2 Chart 1 (01d §1–2)",
  },
  {
    indicator: "glucose",
    low: 70,
    high: 99,
    critLow: 53,
    unit: "mg/dL",
    label: "US scale: fasting normal 70–99 mg/dL",
    note: "Fasting venous plasma. Normal is <100; 99 and 53 are the whole-mg/dL edges of '<100' and Level 2 '<54'. Prediabetes 100–125, diabetes ≥126 (needs two results). Low: Level 1 <70, Level 2 <54. WHO starts impaired fasting glucose at 110 mg/dL (6.1 mmol/L).",
    source:
      "ADA Standards of Care 2026, Section 2 Tables 2.1–2.2 and Section 6 Table 6.4; WHO/IDF 2006 (01d §1–2)",
  },
  {
    indicator: "sleepHours",
    low: 7,
    unit: "h",
    label: "AASM/SRS: at least 7 h per night",
    note: "Under 7 h regularly is linked to harm; the guideline is about regular sleep, not one night. Over 9 h may suit young adults, people catching up on sleep debt, or ill people; uncertain for others.",
    source: "Watson et al. 2015, AASM/SRS joint consensus statement, Sleep, adults 18–60 (01d §1)",
  },
];
