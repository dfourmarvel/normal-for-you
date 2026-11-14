import type { Assignment, BlockedSlot, Machine, SolverResult } from "@/lib/types";

export type SimpleSchedulerInput = {
  crewIds: string[];
  blockedSlots: BlockedSlot[];
  weeklyTargets: Record<string, number>;
  preferredSlots?: Array<{ crewId: string; day: number; slot: number }>;
  recoveryCrewIds?: string[];
};

const MACHINES: Machine[] = ["treadmill", "bike"];

function blocked(crewId: string, day: number, slot: number, list: BlockedSlot[]) {
  return list.some((b) => b.day === day && b.slot === slot &&
    (b.crewId === "all" || b.crewId === crewId));
}

/** Deterministic offline fallback. Slots are 0–15; slot 15 is reserved before sleep. */
export function buildSimpleSchedule(input: SimpleSchedulerInput): SolverResult {
  const started = Date.now();
  const assignments: Assignment[] = [];
  const machineUse = new Set<string>();
  const crewDayUse = new Set<string>();
  const recovery = new Set(input.recoveryCrewIds ?? []);
  const crewIds = [...input.crewIds].sort();

  for (let day = 0; day < 7; day++) {
    const shift = day % Math.max(crewIds.length, 1);
    const order = crewIds.slice(shift).concat(crewIds.slice(0, shift));

    for (const crewId of order) {
      const target = Math.max(0, Math.floor(input.weeklyTargets[crewId] ?? 0));
      const current = assignments.filter((a) => a.crewId === crewId).length;
      if (current >= target || crewDayUse.has(`${crewId}:${day}`)) continue;

      const slots = Array.from({ length: 15 }, (_, i) => i);
      slots.sort((a, b) => {
        const pa = input.preferredSlots?.some((p) =>
          p.crewId === crewId && p.day === day && p.slot === a) ?? false;
        const pb = input.preferredSlots?.some((p) =>
          p.crewId === crewId && p.day === day && p.slot === b) ?? false;
        if (pa !== pb) return pa ? -1 : 1;
        if (recovery.has(crewId) && (a < 8) !== (b < 8)) return a < 8 ? -1 : 1;
        return a - b;
      });

      for (const slot of slots) {
        if (blocked(crewId, day, slot, input.blockedSlots)) continue;
        const machine = MACHINES.find((m) => !machineUse.has(`${day}:${slot}:${m}`));
        if (!machine) continue;
        assignments.push({ crewId, day, slot, machine });
        machineUse.add(`${day}:${slot}:${machine}`);
        crewDayUse.add(`${crewId}:${day}`);
        break;
      }
    }
  }

  return {
    solver: "simple",
    assignments,
    penalty: 0,
    hardBreaks: countHardBreaks(assignments, input.blockedSlots),
    ms: Date.now() - started,
  };
}

export function countHardBreaks(assignments: Assignment[], blockedSlots: BlockedSlot[]) {
  let breaks = 0;
  const crewSlots = new Set<string>();
  const machineSlots = new Set<string>();
  for (const a of assignments) {
    const crewSlot = `${a.crewId}:${a.day}:${a.slot}`;
    const machineSlot = `${a.day}:${a.slot}:${a.machine}`;
    if (a.day < 0 || a.day > 6 || a.slot < 0 || a.slot > 14) breaks++;
    if (crewSlots.has(crewSlot)) breaks++;
    if (machineSlots.has(machineSlot)) breaks++;
    if (blocked(a.crewId, a.day, a.slot, blockedSlots)) breaks++;
    crewSlots.add(crewSlot);
    machineSlots.add(machineSlot);
  }
  return breaks;
}
