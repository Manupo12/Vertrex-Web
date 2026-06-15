import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: { insert: vi.fn(), select: vi.fn(), update: vi.fn() } }));

describe("resolveActorFromToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null for unknown token", async () => {
    const { db } = await import("@/lib/db");
    (db.select as any).mockReturnValue({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([]) }) }) });
    const { resolveActorFromToken } = await import("../api-tokens");
    expect(await resolveActorFromToken("vtx_bad")).toBeNull();
  });

  it("returns an OsSession for a valid token and bumps lastUsedAt", async () => {
    const { db } = await import("@/lib/db");
    const tokenRow = { id: "t1", userId: "u1", revokedAt: null, expiresAt: null };
    const userRow = { id: "u1", email: "a@b.c", name: "A", role: "admin", isActive: true };
    (db.select as any)
      .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([tokenRow]) }) }) })
      .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue([userRow]) }) }) });
    (db.update as any).mockReturnValue({ set: () => ({ where: vi.fn().mockResolvedValue(undefined) }) });
    const { resolveActorFromToken } = await import("../api-tokens");
    const s = await resolveActorFromToken("vtx_good");
    expect(s).toEqual({ userId: "u1", email: "a@b.c", name: "A", role: "admin" });
  });
});
