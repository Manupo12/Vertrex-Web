import { describe, it, expect } from "vitest";
import { format } from "../output";

describe("format", () => {
  it("json", () => expect(format([{ a: 1 }], "json")).toContain('"a": 1'));
  it("csv header", () => expect(format([{ a: 1, b: 2 }], "csv").split("\n")[0]).toBe("a,b"));
  it("table includes value", () => expect(format([{ a: "x" }], "table")).toContain("x"));
});
