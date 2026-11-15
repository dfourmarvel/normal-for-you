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
  const steps = options.steps ?? 400;
  const n = model.variables.length;
  
  if (n === 0) {
    return { bits: new Uint8Array(0), energy: model.offset };
  }

  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const x = new Float64Array(n);
  const p = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = (rand() - 0.5) * 0.2;
    p[i] = (rand() - 0.5) * 0.05;
  }

  const dt = 0.15;

  for (let step = 0; step < steps; step++) {
    const a0 = step / steps;
    const grad = new Float64Array(n);
    
    for (let i = 0; i < n; i++) {
      grad[i] = model.linear[i];
    }
    for (const t of model.quadratic) {
      grad[t.i] += t.weight * x[t.j];
      grad[t.j] += t.weight * x[t.i];
    }

    for (let i = 0; i < n; i++) {
      const force = -((1 - a0 * 0.4) * x[i]) - grad[i];
      p[i] += force * dt;
      x[i] += p[i] * dt;
      if (x[i] > 1) x[i] = 1;
      else if (x[i] < -1) x[i] = -1;
    }
  }

  const bits = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    bits[i] = x[i] > 0 ? 1 : 0;
  }

  const energy = evaluateQubo(model, bits);
  return { bits, energy };
}