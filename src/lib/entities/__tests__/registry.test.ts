import { describe, it, expect } from "vitest";
import { ENTITY_REGISTRY, getDescriptor } from "@/lib/entities/registry";

describe("entity-registry", () => {
  it("incluye los tipos resolubles del grafo actual", () => {
    const required = ["client","project","document","legal","note","idea","resource",
      "finance","agenda","repository","link","social_account","team_member","ticket",
      "task","cycle","milestone","tag"] as const;
    for (const t of required) {
      expect(getDescriptor(t), `falta ${t}`).toBeTruthy();
    }
  });

  it("proyecta un cliente a label/subtitle/href", () => {
    const d = getDescriptor("client")!;
    const out = d.toDisplay({ id: "x", name: "ACME", slug: "acme" });
    expect(out).toEqual({ label: "ACME", subtitle: "Cliente (acme)", href: "/os/crm/acme" });
  });
});
