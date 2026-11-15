import { evaluateQubo, type QuboModel } from "./qubo";

export type SbOptions = {
  seed?: number;
  steps?: number;
};

export function solveSimulatedBifurcation(
  model: QuboModel,
  options: SbOptions = {}
): { bits: Uint8Array; energy: number } {
  const seed = options.seed ?? 2026;
  const steps = options.steps ?? 600;
  const n = model.variables.length;
  
  if (n === 0) {
    return { bits: new Uint8Array(0), energy: model.offset };
  }

  // Deterministic PRNG
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const L = model.linear;

  // Build adjacency list for quadratic terms (Q_ij)
  const Q = Array.from({ length: n }, () => new Map<number, number>());
  for (const t of model.quadratic) {
    Q[t.i].set(t.j, (Q[t.i].get(t.j) || 0) + t.weight);
    Q[t.j].set(t.i, (Q[t.j].get(t.i) || 0) + t.weight); // symmetric
  }

  // Convert QUBO (b in {0,1}) to Spin (x in [-1, 1]) via b_i = (1 + x_i) / 2
  // h_eff_i = L_i / 2 + sum_j (Q_ij / 4)
  const h_eff = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let sumQ = 0;
    const neighbors = Q[i];
    for (const [, w] of neighbors.entries()) {
      sumQ += w;
    }
    h_eff[i] = (L[i] / 2) + (sumQ / 4);
  }

  // Effective quadratic coupling J_ij = Q_ij / 4
  const J = Array.from({ length: n }, () => new Map<number, number>());
  for (const t of model.quadratic) {
    const w = t.weight / 4;
    J[t.i].set(t.j, (J[t.i].get(t.j) || 0) + w);
    J[t.j].set(t.i, (J[t.j].get(t.i) || 0) + w);
  }

  // Initialize oscillator positions (x) and momenta (p) near zero
  const x = new Float64Array(n);
  const p = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = (rand() - 0.5) * 0.02;
    p[i] = (rand() - 0.5) * 0.002;
  }

  const dt = 0.12;

  // Ballistic Simulated Bifurcation loop (Goto et al. 2021)
  for (let step = 0; step < steps; step++) {
    // Adiabatic parameter a(t) ramps cleanly from 0 to 1
    const a = step / steps;

    const grad = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let g = h_eff[i];
      const neighbors = J[i];
      for (const [j, weight] of neighbors.entries()) {
        g += weight * x[j];
      }
      grad[i] = g;
    }

    for (let i = 0; i < n; i++) {
      // Force equation with harmonic pump term (1 - a)x_i and gradient
      const force = -((1 - a) * x[i]) - grad[i];
      p[i] += force * dt;
      x[i] += p[i] * dt;

      // Wall clamping at ±1 with momentum reset to 0
      if (x[i] > 1) {
        x[i] = 1;
        p[i] = 0;
      } else if (x[i] < -1) {
        x[i] = -1;
        p[i] = 0;
      }
    }
  }

  // Convert final positions back to binary bits (x > 0 -> 1 else 0)
  const bits = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    bits[i] = x[i] > 0 ? 1 : 0;
  }

  const energy = evaluateQubo(model, bits);
  return { bits, energy };
}