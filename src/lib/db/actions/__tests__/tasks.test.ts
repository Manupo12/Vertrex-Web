import { describe, it, expect, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { insert: vi.fn(), select: vi.fn(), update: vi.fn(), delete: vi.fn() } }));
vi.mock("@/lib/auth/session", () => ({ requireOsUser: vi.fn().mockResolvedValue({ userId: "test-user-id", email: "test@test.com", name: "Test", role: "admin" }) }));
vi.mock("@/lib/identifiers/project-key", () => ({ nextTaskIdentifier: vi.fn().mockResolvedValue("TEST-1") }));
vi.mock("@/lib/activity/log", () => ({ logActivity: vi.fn() }));
vi.mock("@/lib/notifications/service", () => ({ pushNotification: vi.fn() }));

describe("createTaskAction", () => {
  it("creates a task with valid input", async () => {
    const { createTaskAction } = await import("../tasks");
    const { db } = await import("@/lib/db");

    (db.insert as any).mockImplementation((table: any) => ({
      values: (data: any) => ({
        returning: vi.fn().mockResolvedValue([{ id: "1", identifier: "TEST-1", ...data }]),
      }),
    }));

    const result = await createTaskAction({ title: "Test task" });
    expect(result).toBeDefined();
    expect(result.title).toBe("Test task");
  });
});
