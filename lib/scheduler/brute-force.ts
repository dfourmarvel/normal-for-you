import type { Assignment } from "@/lib/types";
import { evaluateQubo, type QuboModel } from "./qubo";

export type BruteForceResult = { bits: Uint8Array; energy: number; checked: number };

/** Exact solver for small fixtures only. Refuses large models to protect the browser. */
export function solveBruteForce(model: QuboModel, maxVariables = 20): BruteForceResult {
  const n = model.variables.length;
  if (n > maxVariables) {
    throw new Error(`Brute force limit is ${maxVariables} variables; received ${n}.`);
  }
  const checked = 2 ** n;
  let bestEnergy = Number.POSITIVE_INFINITY;
  let bestBits = new Uint8Array(n);
  const candidate = new Uint8Array(n);

  for (let mask = 0; mask < checked; mask++) {
    for (let bit = 0; bit < n; bit++) candidate[bit] = (mask >>> bit) & 1;
    const energy = evaluateQubo(model, candidate);
    if (energy < bestEnergy) {
      bestEnergy = energy;
      bestBits = candidate.slice();
    }
  }
  return { bits: bestBits, energy: bestEnergy, checked };
}

export function assignmentsFromBits(model: QuboModel, bits: Uint8Array): Assignment[] {
  return model.variables.flatMap((v, i) => {
    if (!bits[i]) return [];
    const { key: _key, ...assignment } = v;
    return [assignment];
  });
}
