import type { Assignment } from "@/lib/types";
import type { QuboModel, QuboVariable } from "./qubo";

/**
 * Tiny deterministic 16-choice fixture for exact-solver verification.
 * The first choice is the unique optimum. This tests exhaustive enumeration,
 * bit decoding, and energy evaluation—not mission scheduling quality.
 */
export function createSixteenVariableFixture(): QuboModel {
  const variables: QuboVariable[] = [];
  for (let i = 0; i < 16; i++) {
    const assignment: Assignment = {
      crewId: `crew-${Math.floor(i / 4) + 1}`,
      day: Math.floor(i / 8),
      slot: i % 8,
      machine: i % 2 === 0 ? "treadmill" : "bike",
    };
    variables.push({ ...assignment, key: `${assignment.crewId}:${assignment.day}:${assignment.slot}:${assignment.machine}` });
  }

  // A single preferred choice has energy -10; every other choice costs +2.
  // Pair penalties ensure selecting multiple choices cannot improve the result.
  const quadratic = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      quadratic.push({ i, j, weight: 25 });
    }
  }
  return {
    variables,
    linear: [-10, ...Array<number>(15).fill(2)],
    quadratic,
    offset: 0,
  };
}
