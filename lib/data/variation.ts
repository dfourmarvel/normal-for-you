// © EFLM, not covered by this repo's licence, used with citation, permission requested
import type { VariationRow } from "@/lib/data/tables";

export const variation: VariationRow[] = [
  {
    indicator: "lymphAbs",
    cviPct: 10.9,
    cvaPct: 5.45,
    badDirection: "down",
    directionSource:
      "NASA HRP Immune Evidence Report 2021 (Crucian 2008): lymphocyte percentage fell after short flights (01b §5); direction chosen in advance by the science lead, 14 Nov (02 §3). 01b notes the direction after long flights is not settled.",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, global meta-analysis (absolute count, ×10⁹/L), read 14 Nov 2026 (01a Table 1); CVA = desirable APS 0.5 × CVI, as in the 01a worked RCV table",
  },
  {
    indicator: "neutAbs",
    cviPct: 14.6,
    cvaPct: 7.3,
    badDirection: "both",
    directionSource: "No risky direction named in advance in 01b: two-sided",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, global meta-analysis, read 14 Nov 2026 (01a Table 1); CVI 95% CI 6.3–26.0%, so this RCV is rough; CVA = desirable APS 0.5 × CVI",
  },
  {
    indicator: "wbc",
    cviPct: 11.1,
    cvaPct: 5.6,
    badDirection: "both",
    directionSource: "No risky direction named in advance in 01b: two-sided",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, global meta-analysis (leukocytes), read 14 Nov 2026 (01a Table 1); CVA = desirable APS 0.5 × CVI as listed there",
  },
  {
    indicator: "hb",
    cviPct: 2.7,
    cvaPct: 1.4,
    badDirection: "both",
    directionSource: "No risky direction named in advance in 01b: two-sided",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, full meta-analysis list (haemoglobin; dataset counts not read), read 14 Nov 2026 (01a Table 1); CVA = desirable APS 0.5 × CVI as listed there",
  },
  {
    indicator: "plt",
    cviPct: 7.2,
    cvaPct: 3.6,
    badDirection: "both",
    directionSource: "No risky direction named in advance in 01b: two-sided",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, global meta-analysis (thrombocytes), read 14 Nov 2026 (01a Table 1); CVA = desirable APS 0.5 × CVI",
  },
  {
    indicator: "glucose",
    cviPct: 4.9,
    cvaPct: 2.45,
    badDirection: "both",
    directionSource:
      "Both directions clinically bad: ADA 2026 high (≥100 mg/dL) and low (<70 mg/dL) bands (01d §1); 01b §3 says the in-flight direction is mixed",
    status: "eflm",
    source:
      "EFLM Biological Variation Database, fasting glucose, 15 datasets / 13 papers, read 14 Nov 2026 (01a Table 2); CVA = desirable APS 0.5 × CVI. EuBIVAS gives CVI 4.7% (01a source 3)",
  },
  {
    indicator: "restingHR",
    cviPct: 4.6,
    cvaPct: 0,
    badDirection: "both",
    directionSource:
      "Both directions clinically bad: NEWS2 scores both low and high bands (01d §1); science lead rule, 14 Nov",
    status: "single-study",
    source:
      "Quer et al. 2020, PLOS ONE: Fitbit daily resting HR, 92,457 adults, SD 3.03 bpm at mean 65.5 bpm; the % is 01a's SD ÷ mean; device error included, so CVA 0 (01a Table 2)",
  },
  {
    indicator: "sbp",
    cviPct: 8.6,
    cvaPct: 0,
    badDirection: "both",
    directionSource:
      "Both directions clinically bad: ACC/AHA high bands (01d §1); low blood pressure and fainting at landing (NASA HRP cardiovascular risk page, 01b §1)",
    status: "single-study",
    source:
      "Warren et al. 2010, Br J Gen Pract: single office readings 6 weeks apart, 163 adults (about 45% hypertensive or BMI > 27); device error included, so CVA 0 (01a Table 2)",
  },
  {
    indicator: "dbp",
    cviPct: 8.6,
    cvaPct: 0,
    badDirection: "both",
    directionSource:
      "Both directions clinically bad: ACC/AHA high bands (01d §1); low blood pressure and fainting at landing (NASA HRP cardiovascular risk page, 01b §1)",
    status: "single-study",
    source:
      "Warren et al. 2010, Br J Gen Pract: single office readings 6 weeks apart, 163 adults; device error included, so CVA 0 (01a Table 2)",
  },
];
