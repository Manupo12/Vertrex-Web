import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/auth/permissions", () => ({ getModulePermission: vi.fn() }));

const admin = { userId: "u1", email: "a", name: "A", role: "admin" as const };
const team = { userId: "u2", email: "b", name: "B", role: "team" as const };

describe("assertPermission", () => {
  it("lets admins through without checking", async () => {
    const { assertPermission } = await import("../rbac");
    await expect(assertPermission(admin, "crm", "admin")).resolves.toBeUndefined();
  });
  it("throws ApiError 403 when level insufficient", async () => {
    const { getModulePermission } = await import("@/lib/auth/permissions");
    (getModulePermission as any).mockResolvedValue("read");
    const { assertPermission } = await import("../rbac");
    await expect(assertPermission(team, "crm", "write")).rejects.toMatchObject({ status: 403, code: "forbidden" });
  });
  it("allows when level sufficient", async () => {
    const { getModulePermission } = await import("@/lib/auth/permissions");
    (getModulePermission as any).mockResolvedValue("write");
    const { assertPermission } = await import("../rbac");
    await expect(assertPermission(team, "crm", "write")).resolves.toBeUndefined();
  });
});
