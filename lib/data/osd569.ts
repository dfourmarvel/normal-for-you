import type { Indicator, Reading } from "@/lib/types";
import type { RangeRow } from "./tables";

export const OSD569_URL = "/data/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv";
const RANGE_SOURCE = "NASA OSDR OSD-569, LSDS-7 CBC (lab reference range in file)";

// Inspiration4 was a 3-day flight, so R+n is mission day 3 + n.
const FLIGHT_DAYS = 3;

// widestRange: the file lists two reference ranges for this analyte (11.7-15.5 and 13.2-17.1, sex-specific);
// RangeRow has no per-astronaut field, so the widest span is used and the row says so. Every other analyte must have one range.
const COLUMNS: { prefix: string; indicator: Indicator; unit?: string; widestRange?: boolean }[] = [
  { prefix: "absolute_lymphocytes", indicator: "lymphAbs" },
  { prefix: "absolute_neutrophils", indicator: "neutAbs" },
  { prefix: "white_blood_cell_count", indicator: "wbc" },
  // shortcut: the file's suffix says "percent" for hemoglobin, which is mislabelled; the 13-17 values are g/dL.
  { prefix: "hemoglobin", indicator: "hb", unit: "g/dL", widestRange: true },
  { prefix: "platelet_count", indicator: "plt" },
];

const readableUnit = (suffix: string): string =>
  suffix.replace("_per_", "/").replace("microliter", "µL").replace("percent", "%").replace(/_/g, " ");

const fmt = (n: number): string => n.toLocaleString("en-US");

function toNumber(cell: string, where: string): number | undefined {
  if (cell === "") return undefined;
  const n = Number(cell);
  if (!Number.isFinite(n)) throw new Error(`OSD-569: non-numeric cell "${cell}" at ${where}`);
  return n;
}

function parseSample(name: string): { astronautId: string; missionDay: number; phase: Reading["phase"] } {
  const m = /^(C\d+)_whole-blood_([LR])([+-]\d+)_cbc$/.exec(name);
  if (!m) throw new Error(`OSD-569: unrecognised sample name "${name}"`);
  const n = parseInt(m[3], 10);
  return m[2] === "L"
    ? { astronautId: m[1], missionDay: n, phase: "preflight" }
    : { astronautId: m[1], missionDay: FLIGHT_DAYS + n, phase: "postflight" };
}

export function parseOsd569(csvText: string): { readings: Reading[]; ranges: RangeRow[] } {
  const lines = csvText.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) throw new Error("OSD-569: no data rows");
  const header = lines[0].split(",");
  const find = (name: string): number => header.indexOf(name);

  const cols = COLUMNS.map((c) => {
    const valueHeader = header.find((h) => h.startsWith(`${c.prefix}_value_`));
    if (!valueHeader) throw new Error(`OSD-569: no value column for ${c.prefix}`);
    const suffix = valueHeader.slice(`${c.prefix}_value_`.length);
    const min = find(`${c.prefix}_range_min_${suffix}`);
    const max = find(`${c.prefix}_range_max_${suffix}`);
    if (min < 0 || max < 0) throw new Error(`OSD-569: no range columns for ${c.prefix}`);
    return { ...c, value: find(valueHeader), min, max, unit: c.unit ?? readableUnit(suffix) };
  });

  const readings: Reading[] = [];
  const seenRange = new Map<Indicator, { min: number; max: number; pairs: Set<string> }>();

  for (const [i, line] of lines.slice(1).entries()) {
    const cells = line.split(",").map((c) => c.trim());
    if (cells.length !== header.length) throw new Error(`OSD-569: row ${i + 2} has ${cells.length} cells, expected ${header.length}`);
    const sample = cells[0];
    const meta = parseSample(sample);
    for (const c of cols) {
      const where = `${sample} ${c.prefix}`;
      const min = toNumber(cells[c.min], where);
      const max = toNumber(cells[c.max], where);
      if (min !== undefined && max !== undefined) {
        const prev = seenRange.get(c.indicator);
        if (prev && (prev.min !== min || prev.max !== max) && !c.widestRange) {
          throw new Error(`OSD-569: ${c.prefix} range differs between rows (${prev.min}-${prev.max} vs ${min}-${max})`);
        }
        seenRange.set(c.indicator, {
          min: Math.min(prev?.min ?? min, min),
          max: Math.max(prev?.max ?? max, max),
          pairs: (prev?.pairs ?? new Set()).add(`${fmt(min)}–${fmt(max)}`),
        });
      }
      const value = toNumber(cells[c.value], where);
      if (value === undefined) continue;
      readings.push({ id: `${sample}_${c.indicator}`, ...meta, indicator: c.indicator, value, unit: c.unit, takenAt: "", source: "osd569" });
    }
  }

  const ranges: RangeRow[] = cols.flatMap((c) => {
    const r = seenRange.get(c.indicator);
    if (!r) return [];
    // The file's min and max are themselves inside the lab range.
    const row: RangeRow = { indicator: c.indicator, low: { value: r.min, inclusive: true }, high: { value: r.max, inclusive: true }, unit: c.unit, label: `lab range ${fmt(r.min)}–${fmt(r.max)} ${c.unit}`, source: RANGE_SOURCE };
    if (r.pairs.size > 1) row.note = `The file lists ${r.pairs.size} reference ranges (${[...r.pairs].join(" and ")} ${c.unit}); the widest span is used.`;
    return [row];
  });
  return { readings, ranges };
}

export async function loadOsd569(): Promise<ReturnType<typeof parseOsd569>> {
  const res = await fetch(OSD569_URL);
  if (!res.ok) throw new Error(`OSD-569: could not load ${OSD569_URL} (${res.status})`);
  return parseOsd569(await res.text());
}
