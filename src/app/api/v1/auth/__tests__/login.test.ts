import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/api/ratelimit", () => ({ rateLimit: vi.fn().mockResolvedValue({ ok: true }) }));
vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }));
vi.mock("@/lib/auth/session", () => ({ verifyPassword: vi.fn() }));
vi.mock("@/lib/db/actions/api-tokens", () => ({ createApiTokenForUser: vi.fn() }));

const post = async (body: any) => {
  const { POST } = await import("../login/route");
  return POST(
    new Request("http://x/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }) as any,
  );
};
const selectUser = async (u: any) => {
  const { db } = await import("@/lib/db");
  (db.select as any).mockReturnValue({
    from: () => ({ where: () => ({ limit: vi.fn().mockResolvedValue(u ? [u] : []) }) }),
  });
};

describe("POST /api/v1/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());
  it("401 on bad credentials", async () => {
    await selectUser({ id: "u1", passwordHash: "h", isActive: true, preferences: {} });
    const { verifyPassword } = await import("@/lib/auth/session");
    (verifyPassword as any).mockResolvedValue(false);
    const res = await post({ email: "a@b.c", password: "x" });
    expect(res.status).toBe(401);
  });
  it("mints a token on success", async () => {
    await selectUser({
      id: "u1",
      email: "a@b.c",
      name: "A",
      role: "admin",
      passwordHash: "h",
      isActive: true,
      preferences: {},
    });
    const { verifyPassword } = await import("@/lib/auth/session");
    (verifyPassword as any).mockResolvedValue(true);
    const { createApiTokenForUser } = await import("@/lib/db/actions/api-tokens");
    (createApiTokenForUser as any).mockResolvedValue({ token: "vtx_abc", record: { id: "t1" } });
    const res = await post({ email: "a@b.c", password: "ok" });
    expect(res.status).toBe(200);
    expect((await res.json()).data.token).toBe("vtx_abc");
  });
});
