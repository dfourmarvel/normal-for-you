import type { GoesRadiationLevel, StormStatus } from "./types";

/**
 * NOAA solar radiation storm scale.
 * HFm design rule:
 * S1-S2 => advisory
 * S3+ => shelter
 */
export function needsShelter(
  level: GoesRadiationLevel
): boolean {
  return (
    level === "S3" ||
    level === "S4" ||
    level === "S5"
  );
}

export function createStormStatus(
  level: GoesRadiationLevel
): StormStatus {
  return {
    level,
    shelterRequired: needsShelter(level),
  };
}