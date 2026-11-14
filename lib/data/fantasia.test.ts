import { describe, expect, it } from "vitest";
import { parseFantasia } from "./fantasia";

const meta = { source: "s", licence: "l", cite: "c", method: "m" };
const rec = { id: "f1o01", group: "elderly", age: 77, sex: "F", beats: 3, dropped: 0, nn: [900, 910] };

describe("parseFantasia", () => {
  it("accepts the wrapper object", () => {
    expect(parseFantasia({ ...meta, records: [rec] }).records[0].id).toBe("f1o01");
  });
  it("rejects a bare list", () => {
    expect(() => parseFantasia([rec])).toThrow(/no records list/);
  });
  it("rejects a missing records field", () => {
    expect(() => parseFantasia(meta)).toThrow(/no records list/);
  });
  it("rejects missing metadata and bad records", () => {
    expect(() => parseFantasia({ records: [rec] })).toThrow(/missing "source"/);
    expect(() => parseFantasia({ ...meta, records: [{ ...rec, group: "x" }] })).toThrow(/group/);
  });
});
