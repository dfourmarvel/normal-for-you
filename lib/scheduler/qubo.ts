import type { Assignment, BlockedSlot, Machine } from "@/lib/types";

/** Sparse binary quadratic model: E(x) = offset + Σ aᵢxᵢ + Σ bᵢⱼxᵢxⱼ. */
export type QuboVariable = Assignment & { key: string };
export type QuboTerm = { i: number; j: number; weight: number };
export type QuboModel = {
  variables: QuboVariable[];
  linear: number[];
  quadratic: QuboTerm[];
  offset: number;
};

export type QuboInput = {
  crewIds: string[];
  blockedSlots: BlockedSlot[];
  weeklyTargets: Record<string, number>;
  preferredAssignments?: Assignment[];
  recoveryCrewIds?: string[];
};

const MACHINES: Machine[] = ["treadmill", "bike"];
// Project objective weights; these are optimization choices, not NASA limits.
const HARD = 10_000;
const TARGET = 12;
const SPREAD = 2;
const PREFERENCE_REWARD = 1.5;
const RECOVERY_REWARD = 0.75;

const keyOf = (a: Assignment) =>
  `${a.crewId}:${a.day}:${a.slot}:${a.machine}`;

function addPair(map: Map<string, QuboTerm>, i: number, j: number, weight: number) {
  if (i === j || weight === 0) return;
  const left = Math.min(i, j);
  const right = Math.max(i, j);
  const key = `${left},${right}`;
  const old = map.get(key);
  map.set(key, { i: left, j: right, weight: (old?.weight ?? 0) + weight });
}

function isBlocked(input: QuboInput, crewId: string, day: number, slot: number) {
  return input.blockedSlots.some(
    (b) => b.day === day && b.slot === slot &&
      (b.crewId === "all" || b.crewId === crewId),
  );
}

export function buildSchedulerQubo(input: QuboInput): QuboModel {
  const variables: QuboVariable[] = [];
  const linear: number[] = [];
  const quadratic = new Map<string, QuboTerm>();
  const crewIndices = new Map<string, number[]>();
  const dayIndices = new Map<string, number[]>();

  for (const crewId of input.crewIds) {
    crewIndices.set(crewId, []);
    for (let day = 0; day < 7; day++) {
      for (let slot = 0; slot < 16; slot++) {
        for (const machine of MACHINES) {
          const assignment = { crewId, day, slot, machine };
          const index = variables.length;
          variables.push({ ...assignment, key: keyOf(assignment) });
          linear.push(0);
          crewIndices.get(crewId)!.push(index);
          const dayKey = `${crewId}:${day}`;
          if (!dayIndices.has(dayKey)) dayIndices.set(dayKey, []);
          dayIndices.get(dayKey)!.push(index);

          if (slot === 15 || isBlocked(input, crewId, day, slot)) {
            linear[index] += HARD;
          }
          if (input.recoveryCrewIds?.includes(crewId) && slot < 8) {
            linear[index] -= RECOVERY_REWARD;
          }
          if (input.preferredAssignments?.some((p) =>
            p.crewId === crewId && p.day === day && p.slot === slot &&
            p.machine === machine)) {
            linear[index] -= PREFERENCE_REWARD;
          }
        }
      }
    }
  }

  // A crew member cannot use both machines in the same slot.
  for (const crewId of input.crewIds) {
    for (let day = 0; day < 7; day++) {
      for (let slot = 0; slot < 16; slot++) {
        const pair = MACHINES.map((machine) => variables.findIndex((v) =>
          v.crewId === crewId && v.day === day && v.slot === slot &&
          v.machine === machine));
        addPair(quadratic, pair[0], pair[1], HARD);
      }
    }
  }

  // Each physical machine can serve at most one crew member per slot.
  for (let day = 0; day < 7; day++) {
    for (let slot = 0; slot < 16; slot++) {
      for (const machine of MACHINES) {
        const indices = variables.flatMap((v, i) =>
          v.day === day && v.slot === slot && v.machine === machine ? [i] : []);
        for (let a = 0; a < indices.length; a++) {
          for (let b = a + 1; b < indices.length; b++) {
            addPair(quadratic, indices[a], indices[b], HARD);
          }
        }
      }
    }
  }

  // TARGET * (sessions - target)^2, encouraging weekly target completion.
  let offset = 0;
  for (const crewId of input.crewIds) {
    const indices = crewIndices.get(crewId)!;
    const target = Math.max(0, Math.floor(input.weeklyTargets[crewId] ?? 0));
    offset += TARGET * target * target;
    for (const i of indices) linear[i] += TARGET * (1 - 2 * target);
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        addPair(quadratic, indices[a], indices[b], 2 * TARGET);
      }
    }
  }

  // Small penalty for stacking sessions for one crew member on one day.
  for (const indices of dayIndices.values()) {
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        addPair(quadratic, indices[a], indices[b], SPREAD);
      }
    }
  }

  return { variables, linear, quadratic: [...quadratic.values()], offset };
}

export function evaluateQubo(model: QuboModel, bits: Uint8Array): number {
  let energy = model.offset;
  for (let i = 0; i < model.variables.length; i++) {
    if (bits[i]) energy += model.linear[i];
  }
  for (const term of model.quadratic) {
    if (bits[term.i] && bits[term.j]) energy += term.weight;
  }
  return energy;
}
