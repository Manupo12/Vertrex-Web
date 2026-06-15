import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/api/ratelimit", () => ({ rateLimit: vi.fn().mockResolvedValue({ ok: true }) }));
vi.mock("@/lib/api/auth", () => ({ authenticateRequest: vi.fn() }));

function reqWith(token?: string) {
  return new Request("http://x/api/v1/x", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  }) as any;
}

describe("authed wrapper", () => {
  it("returns 401 when unauthenticated", async () => {
    const { authenticateRequest } = await import("@/lib/api/auth");
    (authenticateRequest as any).mockResolvedValue(null);
    const { authed } = await import("../handler");
    const res = await authed(async () => ({ ok: true }))(reqWith(), { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("unauthorized");
  });

  it("runs handler under actor and wraps result in {data}", async () => {
    const { authenticateRequest } = await import("@/lib/api/auth");
    (authenticateRequest as any).mockResolvedValue({ userId: "u1", email: "a", name: "A", role: "admin" });
    const { authed } = await import("../handler");
    const res = await authed(async ({ session }) => ({ who: session.userId }))(
      reqWith("vtx_x"),
      { params: Promise.resolve({}) },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ who: "u1" });
  });
});
