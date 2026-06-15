import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/lib/api/ratelimit", () => ({ rateLimit: vi.fn().mockResolvedValue({ ok: true }) }));
vi.mock("@/lib/api/auth", () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ userId: "u1", email: "a", name: "A", role: "admin" }),
}));
vi.mock("@/lib/db/actions/tasks", () => ({
  createTaskAction: vi.fn(),
  listTasksAction: vi.fn(),
}));

const call = async (mod: string, method: string, body?: any) => {
  const r = await import(mod);
  const req = new Request("http://x/api/v1/tasks", {
    method,
    body: body ? JSON.stringify(body) : undefined,
  }) as any;
  return (r as any)[method](req, { params: Promise.resolve({}) });
};

describe("POST/GET /api/v1/tasks", () => {
  beforeEach(() => vi.clearAllMocks());
  it("creates a task", async () => {
    const { createTaskAction } = await import("@/lib/db/actions/tasks");
    (createTaskAction as any).mockResolvedValue({ id: "t1", title: "X" });
    const res = await call("../route", "POST", { title: "X" });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toMatchObject({ id: "t1" });
  });
  it("400 on invalid body", async () => {
    const res = await call("../route", "POST", { title: "" });
    expect(res.status).toBe(400);
  });
});
