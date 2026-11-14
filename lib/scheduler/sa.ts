import type { Assignment, SolverResult } from "@/lib/types";
import { evaluateQubo, type QuboModel } from "./qubo";
import { assignmentsFromBits } from "./brute-force";
import { countHardBreaks } from "./simple";

export type AnnealingOptions = {
  iterations?: number;
  startTemperature?: number;
  endTemperature?: number;
  seed?: number;
};

/** Simulated annealing over the sparse QUBO; deterministic when a seed is supplied. */
export function solveSimulatedAnnealing(
  model: QuboModel,
  options: AnnealingOptions = {},
): { bits: Uint8Array; energy: number; iterations: number } {
  const iterations = options.iterations ?? 30_000;
  const startT = options.startTemperature ?? 8;
  const endT = options.endTemperature ?? 0.02;
  let state = (options.seed ?? 2026) >>> 0;
  const random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };

  const bits = new Uint8Array(model.variables.length);
  for (let i = 0; i < bits.length; i++) bits[i] = random() < 0.015 ? 1 : 0;
  let energy = evaluateQubo(model, bits);
  let bestEnergy = energy;
  let best = bits.slice();

  const adjacency: Array<Array<{ index: number; weight: number }>> =
    Array.from({ length: bits.length }, () => []);
  for (const term of model.quadratic) {
    adjacency[term.i].push({ index: term.j, weight: term.weight });
    adjacency[term.j].push({ index: term.i, weight: term.weight });
  }

  for (let step = 0; step < iterations; step++) {
    const index = Math.floor(random() * bits.length);
    let delta = bits[index] ? -model.linear[index] : model.linear[index];
    for (const edge of adjacency[index]) {
      if (bits[edge.index]) delta += bits[index] ? -edge.weight : edge.weight;
    }
    const progress = step / Math.max(iterations - 1, 1);
    const temperature = startT * Math.pow(endT / startT, progress);
    if (delta <= 0 || random() < Math.exp(-delta / temperature)) {
      bits[index] = bits[index] ? 0 : 1;
      energy += delta;
      if (energy < bestEnergy) {
        bestEnergy = energy;
        best = bits.slice();
      }
    }
  }
  return { bits: best, energy: bestEnergy, iterations };
}

export function annealToSolverResult(
  model: QuboModel,
  blockedSlots: Parameters<typeof countHardBreaks>[1],
  options?: AnnealingOptions,
): SolverResult {
  const started = Date.now();
  const result = solveSimulatedAnnealing(model, options);
  const assignments: Assignment[] = assignmentsFromBits(model, result.bits);
  return {
    solver: "sa",
    assignments,
    penalty: result.energy,
    hardBreaks: countHardBreaks(assignments, blockedSlots),
    ms: Date.now() - started,
  };
}
