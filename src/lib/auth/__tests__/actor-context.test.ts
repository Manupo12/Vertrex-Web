import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: () => undefined })) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("REDIRECT"); }) }));

describe("actor context seam", () => {
  it("requireOsUser returns the injected actor without touching cookies", async () => {
    const { runWithActor } = await import("../actor-context");
    const { requireOsUser } = await import("../session");
    const actor = { userId: "u1", email: "a@b.c", name: "A", role: "admin" as const };
    const result = await runWithActor(actor, () => requireOsUser());
    expect(result).toEqual(actor);
  });

  it("requireOsUser redirects when no actor and no cookie", async () => {
    const { requireOsUser } = await import("../session");
    await expect(requireOsUser()).rejects.toThrow("REDIRECT");
  });
});
