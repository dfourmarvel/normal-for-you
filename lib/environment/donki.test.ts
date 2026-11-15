import { describe, expect, it } from "vitest";

describe("DONKI module", () => {
  it("exports fetchDonkiEvents", async () => {
    const mod = await import("./donki");

    expect(
      typeof mod.fetchDonkiEvents
    ).toBe("function");
  });
});