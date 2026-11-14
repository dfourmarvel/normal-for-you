import type { Indicator, Reading } from "@/lib/types";
import type { RangeRow } from "./tables";

export const OSD569_URL = "/data/LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv";
const RANGE_SOURCE = "NASA OSDR OSD-569, LSDS-7 CBC (lab reference range in file)";

// Inspiration4 was a 3-day flight, so R+n is mission day 3 + n.
export const FLIGHT_DAYS = 3;

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

// The five white-cell differential columns, each an absolute count and a percent of the total white count.
const DIFFERENTIAL: { key: string; name: string; indicator?: Indicator }[] = [
  { key: "basophils", name: "basophil" },
  { key: "eosinophils", name: "eosinophil" },
  { key: "lymphocytes", name: "lymphocyte", indicator: "lymphAbs" },
  { key: "monocytes", name: "monocyte" },
  { key: "neutrophils", name: "neutrophil", indicator: "neutAbs" },
];

export interface CorrectionChange {
  indicator: Indicator;
  fileValue: number | null;
  usedValue: number | null; // null: left out
  reason: string;
}
/** shifted: cells in the wrong columns, rebuilt from percent × WBC. unverifiable: the row can't be checked, so its white-cell values are left out. */
export interface Correction { sample: string; astronautId: string; draw: string; kind: "shifted" | "unverifiable"; changes: CorrectionChange[] }
export interface Osd569 { readings: Reading[]; ranges: RangeRow[]; corrections: Correction[] }

// A file count further than this from percent × WBC is a mismatch; the file's own rounding is a cell or two.
const isMismatch = (file: number, expected: number): boolean => Math.abs(file - expected) > Math.max(60, 0.08 * expected);
// Naming which count a shifted cell holds needs a tight match: the loose test above would pair any two small counts.
const isSame = (file: number, expected: number): boolean => Math.abs(file - expected) <= Math.max(1, 0.005 * expected);

const readableUnit = (suffix: string): string =>
  suffix.replace("_per_", "/").replace("microliter", "µL").replace("percent", "%").replace(/_/g, " ");

const fmt = (n: number): string => n.toLocaleString("en-US");

function toNumber(cell: string, where: string): number | undefined {
  if (cell === "") return undefined;
  const n = Number(cell);
  if (!Number.isFinite(n)) throw new Error(`OSD-569: non-numeric cell "${cell}" at ${where}`);
  return n;
}

function parseSample(name: string): { astronautId: string; missionDay: number; phase: Reading["phase"]; draw: string } {
  const m = /^(C\d+)_whole-blood_([LR])([+-]\d+)_cbc$/.exec(name);
  if (!m) throw new Error(`OSD-569: unrecognised sample name "${name}"`);
  const n = parseInt(m[3], 10);
  const draw = `${m[2]}${m[3]}`;
  return m[2] === "L"
    ? { astronautId: m[1], missionDay: n, phase: "preflight", draw }
    : { astronautId: m[1], missionDay: FLIGHT_DAYS + n, phase: "postflight", draw };
}

export function parseOsd569(csvText: string): Osd569 {
  const lines = csvText.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) throw new Error("OSD-569: no data rows");
  const header = lines[0].split(",");
  const find = (name: string): number => header.indexOf(name);
  const need = (name: string): number => {
    const i = find(name);
    if (i < 0) throw new Error(`OSD-569: no column ${name}`);
    return i;
  };

  const cols = COLUMNS.map((c) => {
    const valueHeader = header.find((h) => h.startsWith(`${c.prefix}_value_`));
    if (!valueHeader) throw new Error(`OSD-569: no value column for ${c.prefix}`);
    const suffix = valueHeader.slice(`${c.prefix}_value_`.length);
    const min = find(`${c.prefix}_range_min_${suffix}`);
    const max = find(`${c.prefix}_range_max_${suffix}`);
    if (min < 0 || max < 0) throw new Error(`OSD-569: no range columns for ${c.prefix}`);
    return { ...c, value: find(valueHeader), min, max, unit: c.unit ?? readableUnit(suffix) };
  });
  const wbcCol = need("white_blood_cell_count_value_thousand_per_microliter");
  const pltCol = cols.find((c) => c.indicator === "plt");
  const diffCols = DIFFERENTIAL.map((d) => ({
    ...d,
    abs: need(`absolute_${d.key}_value_cells_per_microliter`),
    pct: need(`${d.key}_value_percent`),
  }));

  const readings: Reading[] = [];
  const corrections: Correction[] = [];
  const seenRange = new Map<Indicator, { min: number; max: number; pairs: Set<string> }>();

  for (const [i, line] of lines.slice(1).entries()) {
    const cells = line.split(",").map((c) => c.trim());
    if (cells.length !== header.length) throw new Error(`OSD-569: row ${i + 2} has ${cells.length} cells, expected ${header.length}`);
    const sample = cells[0];
    const { draw, ...meta } = parseSample(sample);

    // Each absolute differential count should equal percent × WBC (WBC in thousand/µL, so × 10 gives cells/µL).
    const wbc = toNumber(cells[wbcCol], `${sample} white_blood_cell_count`);
    const diff = diffCols.map((d) => {
      const file = toNumber(cells[d.abs], `${sample} absolute_${d.key}`);
      const pct = toNumber(cells[d.pct], `${sample} ${d.key}_percent`);
      const expected = pct !== undefined && wbc !== undefined ? pct * wbc * 10 : undefined;
      return { ...d, file, pct, expected, off: file !== undefined && expected !== undefined && isMismatch(file, expected) };
    });

    const override = new Map<Indicator, number | null>();
    const leaveOut = (why: string, indicators: Indicator[]) => {
      const changes = cols
        .filter((c) => indicators.includes(c.indicator))
        .map((c): CorrectionChange => {
          override.set(c.indicator, null);
          return { indicator: c.indicator, fileValue: toNumber(cells[c.value], `${sample} ${c.prefix}`) ?? null, usedValue: null, reason: `${why} It is left out.` };
        });
      corrections.push({ sample, astronautId: meta.astronautId, draw, kind: "unverifiable", changes });
    };

    if (wbc === undefined && diff.some((d) => d.file !== undefined || d.pct !== undefined)) {
      // Nothing to check the absolute counts against; platelets and haemoglobin are not part of this check.
      leaveOut("The total white count is blank, so the white-cell counts in this row can't be checked.", ["lymphAbs", "neutAbs"]);
    } else if (diff.some((d) => d.off)) {
      // One mismatch marks the row as column-shifted. Rebuild only if the WBC itself is trustworthy:
      // the percentages must add up to 100, and most file cells must be some percent × WBC (just in another column).
      const pctSum = diff.reduce((sum, d) => sum + (d.pct ?? 0), 0);
      const matching = diff.filter((d) => d.file !== undefined && diff.some((o) => o.expected !== undefined && isSame(d.file as number, o.expected))).length;
      const failed = [
        Math.abs(pctSum - 100) > 0.5 && `The five percentages add up to ${Math.round(pctSum * 10) / 10}, not 100.`,
        matching < 3 && `Only ${matching} of the 5 count cells match a percentage × the total white count (${wbc} thousand/µL); at least 3 must.`,
      ].filter(Boolean);
      if (failed.length > 0) {
        leaveOut(`${failed.join(" ")} So the total white count can't be trusted and the row can't be rebuilt.`, ["lymphAbs", "neutAbs", "wbc", "plt"]);
      } else {
        const changes: CorrectionChange[] = [];
        for (const d of diff) {
          if (!d.indicator) continue;
          const used = d.expected === undefined ? null : Math.round(d.expected);
          override.set(d.indicator, used);
          const file = d.file;
          const holder = file === undefined ? undefined : diff.find((o) => o !== d && o.expected !== undefined && isSame(file, o.expected));
          const found = file === undefined
            ? `The file's ${d.name} cell is empty.`
            : holder
              ? `The file's ${d.name} cell holds the ${holder.name} count (${holder.pct}% × ${wbc}).`
              : `The file's ${d.name} cell (${fmt(file)}) matches no white-cell count in the row.`;
          const rebuilt = used === null
            ? "It has no percentage to rebuild it from, so it is left out."
            : `Rebuilt as ${d.pct}% × ${wbc} thousand/µL = ${fmt(used)} cells/µL.`;
          changes.push({ indicator: d.indicator, fileValue: file ?? null, usedValue: used, reason: `${found} ${rebuilt}` });
        }
        if (pltCol) {
          override.set("plt", null);
          changes.push({
            indicator: "plt",
            fileValue: toNumber(cells[pltCol.value], `${sample} platelet_count`) ?? null,
            usedValue: null,
            reason: "The platelet cell is in the shifted row and has no percentage to rebuild it from, so it is left out.",
          });
        }
        corrections.push({ sample, astronautId: meta.astronautId, draw, kind: "shifted", changes });
      }
    }

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
      const value = override.has(c.indicator) ? override.get(c.indicator) : toNumber(cells[c.value], where);
      if (value === undefined || value === null) continue;
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
  return { readings, ranges, corrections };
}

export async function loadOsd569(): Promise<Osd569> {
  const res = await fetch(OSD569_URL);
  if (!res.ok) throw new Error(`OSD-569: could not load ${OSD569_URL} (${res.status})`);
  return parseOsd569(await res.text());
}
