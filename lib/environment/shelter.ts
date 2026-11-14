import type { BlockedSlot } from "../types";

export function shelterBlocks(
  day: number,
  slots: number[]
): BlockedSlot[] {
  return slots.map((slot) => ({
    crewId: "all",
    day,
    slot,
    reason: "shelter",
  }));
}