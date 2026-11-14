import { createSixteenVariableFixture } from "./fixtures";
import { assignmentsFromBits, solveBruteForce } from "./brute-force";
import { evaluateQubo } from "./qubo";
import { buildSimpleSchedule, countHardBreaks } from "./simple";
import type { BlockedSlot } from "@/lib/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Scheduler test failed: ${message}`);
}

/** Lightweight self-test; callable from a temporary script or browser dev page. */
export function runSchedulerSelfTests(): {
  bruteForceCombinations: number;
  bruteForceEnergy: number;
  fallbackAssignments: number;
  fallbackHardBreaks: number;
} {
  const fixture = createSixteenVariableFixture();
  const exact = solveBruteForce(fixture);

  assert(exact.checked === 65_536, "16-variable fixture must check 65,536 combinations");
  assert(exact.energy === -10, "fixture optimum energy must be -10");
  assert(exact.bits[0] === 1, "the unique optimal choice must be selected");
  assert(exact.bits.slice(1).every((bit) => bit === 0), "other choices must remain off");
  assert(evaluateQubo(fixture, exact.bits) === exact.energy, "reported energy must recalculate");
  assert(assignmentsFromBits(fixture, exact.bits).length === 1, "one assignment should decode");

  let rejectedLargeModel = false;
  try {
    solveBruteForce({
      ...fixture,
      variables: [...fixture.variables, { ...fixture.variables[0], key: "extra" }],
      linear: [...fixture.linear, 0],
    });
  } catch {
    rejectedLargeModel = true;
  }
  assert(rejectedLargeModel, "brute force must reject models above its variable limit");

  const blockedSlots: BlockedSlot[] = [
    { crewId: "all", day: 0, slot: 0, reason: "shelter" },
    { crewId: "crew-2", day: 1, slot: 1, reason: "task" },
  ];
  const fallback = buildSimpleSchedule({
    crewIds: ["crew-1", "crew-2", "crew-3", "crew-4"],
    blockedSlots,
    weeklyTargets: { "crew-1": 3, "crew-2": 3, "crew-3": 3, "crew-4": 3 },
    recoveryCrewIds: ["crew-2"],
  });
  const hardBreaks = countHardBreaks(fallback.assignments, blockedSlots);
  assert(hardBreaks === 0, "fallback schedule must obey blocked/capacity/time constraints");
  assert(fallback.assignments.every((a) => a.slot !== 15), "slot 15 must remain unused");

  return {
    bruteForceCombinations: exact.checked,
    bruteForceEnergy: exact.energy,
    fallbackAssignments: fallback.assignments.length,
    fallbackHardBreaks: hardBreaks,
  };
}
