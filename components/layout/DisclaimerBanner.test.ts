import { describe, expect, it } from "vitest";
import { showDisclaimerBanner } from "./DisclaimerBanner";

describe("showDisclaimerBanner", () => {
  it("is hidden on the proof pages", () => {
    expect(showDisclaimerBanner("/proof")).toBe(false);
    expect(showDisclaimerBanner("/proof/heart-rhythm")).toBe(false);
  });
  it("is shown elsewhere, including look-alike paths", () => {
    for (const p of ["/proofs", "/mission", "/"]) expect(showDisclaimerBanner(p)).toBe(true);
  });
});
