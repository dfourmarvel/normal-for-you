import { describe, expect, it } from "vitest";
import {
  createStormStatus,
  needsShelter,
} from "./radiation";

describe("Radiation shelter rules", () => {
  it("does not shelter for NORMAL", () => {
    expect(needsShelter("NORMAL")).toBe(false);
  });

  it("does not shelter for S1", () => {
    expect(needsShelter("S1")).toBe(false);
  });

  it("does not shelter for S2", () => {
    expect(needsShelter("S2")).toBe(false);
  });

  it("requires shelter for S3", () => {
    expect(needsShelter("S3")).toBe(true);
  });

  it("requires shelter for S4", () => {
    expect(needsShelter("S4")).toBe(true);
  });

  it("requires shelter for S5", () => {
    expect(needsShelter("S5")).toBe(true);
  });

  it("creates storm status", () => {
    expect(
      createStormStatus("S4")
    ).toEqual({
      level: "S4",
      shelterRequired: true,
    });
  });
});