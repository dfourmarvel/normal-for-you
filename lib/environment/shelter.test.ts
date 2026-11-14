import { describe, expect, it } from "vitest";
import { shelterBlocks } from "./shelter";

describe("shelterBlocks", () => {
  it("creates blocked slots for entire crew", () => {
    expect(
      shelterBlocks(2, [3, 4, 5])
    ).toEqual([
      {
        crewId: "all",
        day: 2,
        slot: 3,
        reason: "shelter",
      },
      {
        crewId: "all",
        day: 2,
        slot: 4,
        reason: "shelter",
      },
      {
        crewId: "all",
        day: 2,
        slot: 5,
        reason: "shelter",
      },
    ]);
  });
});