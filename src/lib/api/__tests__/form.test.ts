import { describe, it, expect } from "vitest";
import { jsonToFormData } from "../form";

describe("jsonToFormData", () => {
  it("maps primitives and skips undefined", () => {
    const fd = jsonToFormData({ name: "X", n: 3, skip: undefined });
    expect(fd.get("name")).toBe("X");
    expect(fd.get("n")).toBe("3");
    expect(fd.has("skip")).toBe(false);
  });
});
