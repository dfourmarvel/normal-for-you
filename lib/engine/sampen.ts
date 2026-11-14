export interface SampEnResult {
  /** −ln(A/B); undefined when it can't be computed (flat series, too short, or no matches). */
  value: number | undefined;
  /** Template pairs that still match at length m + 1. */
  a: number;
  /** Template pairs that match at length m. */
  b: number;
  /** Tolerance used, in the series' own units. */
  r: number;
}

// Population SD (divide by N), as the fixed method says.
export function populationSd(x: ArrayLike<number>): number {
  const n = x.length;
  if (n === 0) return NaN;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += x[i];
  const mean = sum / n;
  let ss = 0;
  for (let i = 0; i < n; i++) ss += (x[i] - mean) ** 2;
  return Math.sqrt(ss / n);
}

// Sample entropy (Richman & Moorman 2000): Chebyshev distance, pairs i < j, a match is distance ≤ r,
// and both counts use the first N − m templates so A and B are over the same pairs.
export function sampleEntropy(x: ArrayLike<number>, m = 2, rFraction = 0.2): SampEnResult {
  const n = x.length;
  const sd = populationSd(x);
  const r = rFraction * sd;
  if (!(m >= 1) || !(n > m + 1) || !(sd > 0)) return { value: undefined, a: 0, b: 0, r };
  const s = Float64Array.from(x as ArrayLike<number>);
  const last = n - m; // templates i = 0 … n − m − 1
  // Speed-up with identical counts: sort templates by their first point, so each one is only compared
  // with neighbours whose first point is within r. Every unordered pair is still seen exactly once.
  const order = Uint32Array.from({ length: last }, (_, i) => i).sort((p, q) => s[p] - s[q]);
  let a = 0;
  let b = 0;
  for (let p = 0; p < last; p++) {
    const i = order[p];
    for (let q = p + 1; q < last; q++) {
      const j = order[q];
      if (s[j] - s[i] > r) break;
      let k = 1;
      while (k < m && Math.abs(s[i + k] - s[j + k]) <= r) k++;
      if (k < m) continue;
      b++;
      if (Math.abs(s[i + m] - s[j + m]) <= r) a++;
    }
  }
  return { value: a > 0 && b > 0 ? -Math.log(a / b) : undefined, a, b, r };
}

export interface MannWhitneyResult {
  /** U for the first group: pairs where a beats b, ties counted as half. */
  u: number;
  pairs: number;
  /** Two-sided p from the normal approximation (tie-corrected, no continuity correction). */
  p: number;
}

export function mannWhitney(a: readonly number[], b: readonly number[]): MannWhitneyResult {
  const n1 = a.length;
  const n2 = b.length;
  const all = [...a.map((v) => ({ v, g: 0 })), ...b.map((v) => ({ v, g: 1 }))].sort((p, q) => p.v - q.v);
  const n = all.length;
  let rankSumA = 0;
  let tieTerm = 0;
  for (let i = 0; i < n; ) {
    let j = i;
    while (j + 1 < n && all[j + 1].v === all[i].v) j++;
    const rank = (i + j) / 2 + 1;
    const t = j - i + 1;
    tieTerm += t ** 3 - t;
    for (let k = i; k <= j; k++) if (all[k].g === 0) rankSumA += rank;
    i = j + 1;
  }
  const u = rankSumA - (n1 * (n1 + 1)) / 2;
  const mean = (n1 * n2) / 2;
  const sd = Math.sqrt(((n1 * n2) / 12) * (n + 1 - tieTerm / (n * (n - 1))));
  const p = sd > 0 ? Math.min(1, erfc(Math.abs(u - mean) / sd / Math.SQRT2)) : 1;
  return { u, pairs: n1 * n2, p };
}

// Complementary error function (Numerical Recipes erfcc), error < 1.2e-7: enough for a p-value.
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + z / 2);
  const y =
    t *
    Math.exp(
      -z * z - 1.26551223 +
        t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? y : 2 - y;
}
