import type { BadDirection, VariationRow } from "@/lib/data/tables";

export interface RcvLimits { upPct: number; downPct: number }

// Log-normal reference change value (Fokkema 2006), see 01a "The RCV formulas".
export function rcvLogNormal(cviPct: number, cvaPct: number, z: number): RcvLimits {
  const sigmaA = Math.sqrt(Math.log(1 + (cvaPct / 100) ** 2));
  const sigmaI = Math.sqrt(Math.log(1 + (cviPct / 100) ** 2));
  const k = z * Math.SQRT2 * Math.sqrt(sigmaA ** 2 + sigmaI ** 2);
  return { upPct: 100 * (Math.exp(k) - 1), downPct: 100 * (Math.exp(-k) - 1) };
}

export const zFor = (dir: BadDirection): number => (dir === "both" ? 1.96 : 1.645);

export const rcvForRow = (row: VariationRow): RcvLimits => rcvLogNormal(row.cviPct, row.cvaPct, zFor(row.badDirection));

export const isBadDirection = (dir: BadDirection, changePct: number): boolean =>
  dir === "both" || (dir === "down" ? changePct < 0 : changePct > 0);
