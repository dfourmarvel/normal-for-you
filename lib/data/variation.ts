// © EFLM, not covered by this repo's licence, used with citation, permission requested
import type { BadDirection, VariationRow } from "@/lib/data/tables";
import type { Indicator } from "@/lib/types";

const OWN_SD_SOURCE = "Personal band from own pre-flight SD: Coskun et al. 2022 model 2 (own variance, ≥5 results)";

// No usable published within-person CV (01a Table 2: SpO2 and temperature should not use a CV; the rest by science lead decision).
const ownSD = (indicator: Indicator, badDirection: BadDirection, directionSource: string): VariationRow =>
  ({ method: "ownSD", indicator, badDirection, directionSource, source: OWN_SD_SOURCE });

export const variation: VariationRow[] = [
  {
    indicator: "lymphAbs",
    method: "populationCV",
    cviPct: 10.9,
    cvaPct: 5.45,
    badDirection: "down",
    directionSource:
      "NASA HRP Immune Evidence Report 2021 (Crucian 2008): lymphocyte percentage fell after short flights; direction chosen in advance by the science lead, 14 Nov. The direction after long flights is not settled.",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, global meta-analysis (absolute count, ×10⁹/L), read 14 Nov 2026; CVA = desirable APS 0.5 × CVI",
  },
  {
    indicator: "neutAbs",
    method: "populationCV",
    cviPct: 14.6,
    cvaPct: 7.3,
    badDirection: "both",
    directionSource: "No risky direction named in advance in the evidence: two-sided",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, global meta-analysis, read 14 Nov 2026; CVI 95% CI 6.3–26.0%, so this RCV is rough; CVA = desirable APS 0.5 × CVI",
  },
  {
    indicator: "wbc",
    method: "populationCV",
    cviPct: 11.1,
    cvaPct: 5.6,
    badDirection: "both",
    directionSource: "No risky direction named in advance in the evidence: two-sided",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, global meta-analysis (leukocytes), read 14 Nov 2026; CVA = desirable APS 0.5 × CVI as listed there",
  },
  {
    indicator: "hb",
    method: "populationCV",
    cviPct: 2.7,
    cvaPct: 1.4,
    badDirection: "both",
    directionSource: "No risky direction named in advance in the evidence: two-sided",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, full meta-analysis list (haemoglobin; dataset counts not read), read 14 Nov 2026; CVA = desirable APS 0.5 × CVI as listed there",
  },
  {
    indicator: "plt",
    method: "populationCV",
    cviPct: 7.2,
    cvaPct: 3.6,
    badDirection: "both",
    directionSource: "No risky direction named in advance in the evidence: two-sided",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, global meta-analysis (thrombocytes), read 14 Nov 2026; CVA = desirable APS 0.5 × CVI",
  },
  {
    indicator: "glucose",
    method: "populationCV",
    cviPct: 4.9,
    cvaPct: 2.45,
    badDirection: "both",
    directionSource:
      "Both directions clinically bad: ADA 2026 high (≥100 mg/dL) and low (<70 mg/dL) bands; the in-flight direction is mixed in the evidence",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, fasting glucose, 15 datasets / 13 papers, read 14 Nov 2026; CVA = desirable APS 0.5 × CVI. EuBIVAS gives CVI 4.7%",
  },
  {
    indicator: "restingHR",
    method: "populationCV",
    cviPct: 4.6,
    cvaPct: 0,
    badDirection: "both",
    directionSource:
      "Both directions clinically bad: NEWS2 scores both low and high bands; science lead rule, 14 Nov",
    status: "single-study",
    source:
      "Quer et al. 2020, PLOS ONE: Fitbit daily resting HR, 92,457 adults, SD 3.03 bpm at mean 65.5 bpm; the % is SD ÷ mean; device error included, so CVA 0",
  },
  {
    indicator: "sbp",
    method: "populationCV",
    cviPct: 8.6,
    cvaPct: 0,
    badDirection: "both",
    directionSource:
      "Both directions clinically bad: ACC/AHA high bands; low blood pressure and fainting at landing (NASA HRP cardiovascular risk page)",
    status: "single-study",
    source:
      "Warren et al. 2010, Br J Gen Pract: single office readings 6 weeks apart, 163 adults (about 45% hypertensive or BMI > 27); device error included, so CVA 0",
  },
  {
    indicator: "dbp",
    method: "populationCV",
    cviPct: 8.6,
    cvaPct: 0,
    badDirection: "both",
    directionSource:
      "Both directions clinically bad: ACC/AHA high bands; low blood pressure and fainting at landing (NASA HRP cardiovascular risk page)",
    status: "single-study",
    source:
      "Warren et al. 2010, Br J Gen Pract: single office readings 6 weeks apart, 163 adults; device error included, so CVA 0",
  },
  ownSD("spo2", "down", "BTS oxygen guideline 2017: any sudden fall of more than 3% needs assessment"),
  ownSD("tempC", "both", "Both directions clinically bad: fever ≥38.0 °C (CDC) and low ≤35.0 °C (NEWS2 score 3)"),
  ownSD("sleepHours", "down", "AASM/SRS 2015: under 7 h regularly is linked to harm"),
  ownSD("fatigueSP", "up", "Scale definition: higher = worse"),
  ownSD("moodPHQ2", "up", "Scale definition: higher = worse"),
  ownSD("pvtLapses", "up", "Scale definition: higher = worse"),
  ownSD("bodyMass", "both", "No risky direction named in advance in the evidence: two-sided"),
  ownSD("hrvRMSSD", "both", "No risky direction named in advance (no clear in-flight HRV evidence; no population range): two-sided"),
];
