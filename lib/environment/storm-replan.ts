import { shelterBlocks } from "./shelter";
import { needsShelter } from "./radiation";

import { buildSimpleSchedule } from "../scheduler/simple";

export function runStormReplan() {
  const crewIds = [
    "crew-1",
    "crew-2",
    "crew-3",
    "crew-4",
  ];

  const weeklyTargets = {
    "crew-1": 3,
    "crew-2": 3,
    "crew-3": 3,
    "crew-4": 3,
  };

  const normalSchedule = buildSimpleSchedule({
    crewIds,
    blockedSlots: [],
    weeklyTargets,
    recoveryCrewIds: [],
  });

  const shelterActive = needsShelter("S4");

  const blockedSlots = shelterActive
    ? shelterBlocks(3, [4, 5, 6])
    : [];

  const stormSchedule = buildSimpleSchedule({
    crewIds,
    blockedSlots,
    weeklyTargets,
    recoveryCrewIds: [],
  });

  return {
    normalSchedule,
    stormSchedule,
  };
}