// NASA-STD-3001 limits that map onto app indicators (01c §1–2).
import type { LimitRow } from "@/lib/data/tables";

export const limits: LimitRow[] = [
  {
    indicator: "co2",
    limit: 3,
    breachedWhen: "above",
    unit: "mmHg",
    requirementNo: "V2 6004",
    label: "Cabin CO₂, 1-hour average: no more than 3 mmHg",
    source: "NASA-STD-3001 Vol 2 Rev F (2026-07-14) §6.2.1.3, p.51 (01c §1)",
  },
  {
    indicator: "co2",
    limit: 3,
    breachedWhen: "above",
    unit: "mmHg",
    requirementNo: "ISS flight rule (2016), not a NASA-STD-3001 requirement",
    label: "Cabin CO₂, 24-hour average: no more than 3 mmHg (ISS flight rule)",
    source: "OCHMO-TB-004 Carbon Dioxide Rev D (10 Mar 2026), p.7 (01c §1)",
  },
  {
    indicator: "radDose",
    limit: 600,
    breachedWhen: "above",
    unit: "mSv",
    requirementNo: "V1 4030",
    label: "Career effective dose from spaceflight: less than 600 mSv (all ages and sexes)",
    source: "NASA-STD-3001 Vol 1 Rev C (2023-09-15) §4.8, pp.40–41 (01c §2)",
  },
];
