import type { BadDirection, VariationRow } from "@/lib/data/tables";

export interface RcvLimits { upPct: number; downPct: number }

export type PopulationCvRow = Extract<VariationRow, { method: "populationCV" }>;

// Log-normal reference change value (Fokkema 2006), see 01a "The RCV formulas".
export function rcvLogNormal(cviPct: number, cvaPct: number, z: number): RcvLimits {
  const sigmaA = Math.sqrt(Math.log(1 + (cvaPct / 100) ** 2));
  const sigmaI = Math.sqrt(Math.log(1 + (cviPct / 100) ** 2));
  const k = z * Math.SQRT2 * Math.sqrt(sigmaA ** 2 + sigmaI ** 2);
  return { upPct: 100 * (Math.exp(k) - 1), downPct: 100 * (Math.exp(-k) - 1) };
}

export const zFor = (dir: BadDirection): number => (dir === "both" ? 1.96 : 1.645);

export const rcvForRow = (row: PopulationCvRow): RcvLimits => rcvLogNormal(row.cviPct, row.cvaPct, zFor(row.badDirection));

// Standard Student t table: [df, one-sided 0.95, two-sided 0.975].
const T_TABLE: readonly (readonly [number, number, number])[] = [
  [4, 2.132, 2.776], [5, 2.015, 2.571], [6, 1.943, 2.447], [7, 1.895, 2.365], [8, 1.86, 2.306], [9, 1.833, 2.262],
  [10, 1.812, 2.228], [12, 1.782, 2.179], [15, 1.753, 2.131], [20, 1.725, 2.086], [30, 1.697, 2.042],
];

// Between table entries, and above df 30, the next lower df is used: a wider, conservative band.
export function tFor(df: number, dir: BadDirection): number {
  if (df < T_TABLE[0][0]) throw new Error(`t table starts at df ${T_TABLE[0][0]}, got ${df}`);
  const row = T_TABLE.filter(([d]) => d <= df).at(-1) ?? T_TABLE[0];
  return dir === "both" ? row[2] : row[1];
}

// Coskun 2022 model 2 (own variance): HSP ± t × s × √((n+1)/n), returned as % of the HSP.
export function ownSdLimits(n: number, sd: number, hsp: number, dir: BadDirection): RcvLimits {
  const halfWidth = tFor(n - 1, dir) * sd * Math.sqrt((n + 1) / n);
  const pct = (100 * halfWidth) / hsp;
  return { upPct: pct, downPct: -pct };
}

export const isBadDirection = (dir: BadDirection, changePct: number): boolean =>
  dir === "both" || (dir === "down" ? changePct < 0 : changePct > 0);
