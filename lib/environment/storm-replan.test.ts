import { describe, expect, it } from "vitest";
import { runStormReplan } from "./storm-replan";

describe("Storm re-planning", () => {
  it("creates a valid storm scenario", () => {
    const result = runStormReplan();

    expect(result.normalSchedule).toBeDefined();

    expect(result.stormSchedule).toBeDefined();

    expect(
      result.stormSchedule.assignments.length
    ).toBeGreaterThan(0);
  });
});