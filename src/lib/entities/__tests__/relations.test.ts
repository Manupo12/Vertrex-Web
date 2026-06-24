import { describe, it, expect } from "vitest";
import { inverseOf, RELATION_REGISTRY } from "../relations";

describe("relations registry", () => {
  it("resuelve la inversa de una relacion", () => {
    expect(inverseOf("blocks")).toBe("blocked_by");
    expect(inverseOf("blocked_by")).toBe("blocks");
    expect(inverseOf("mentions")).toBe("mentioned_by");
    expect(inverseOf("mentioned_by")).toBe("mentions");
    expect(inverseOf("relates_to")).toBe("relates_to");
  });

  it("verifica si una relacion es simetrica", () => {
    expect(RELATION_REGISTRY["relates_to"].symmetric).toBe(true);
    expect(RELATION_REGISTRY["blocks"].symmetric).toBe(false);
    expect(RELATION_REGISTRY["blocked_by"].symmetric).toBe(false);
  });
});
