import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  requireOsUser: vi.fn(),
}));
vi.mock("@/lib/auth/permissions", () => ({
  requireModuleAccess: vi.fn(),
}));
vi.mock("@/lib/activity/log", () => ({
  logActivity: vi.fn(),
}));

describe("defineAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exige autenticacion y ejecuta la funcion de dominio", async () => {
    const { defineAction } = await import("../define-action");
    const { requireOsUser } = await import("@/lib/auth/session");

    const mockActor = { userId: "user-1", email: "user@test.com", name: "User", role: "team" as const };
    (requireOsUser as any).mockResolvedValue(mockActor);

    const action = defineAction({}, async ({ actor }, x: number) => {
      return { result: x * 2, actor };
    });

    const res = await action(5);
    expect(requireOsUser).toHaveBeenCalled();
    expect(res.result).toBe(10);
    expect(res.actor).toEqual(mockActor);
  });

  it("verifica permisos de modulo si estan especificados", async () => {
    const { defineAction } = await import("../define-action");
    const { requireOsUser } = await import("@/lib/auth/session");
    const { requireModuleAccess } = await import("@/lib/auth/permissions");

    const mockActor = { userId: "user-1", email: "user@test.com", name: "User", role: "team" as const };
    (requireOsUser as any).mockResolvedValue(mockActor);

    const action = defineAction(
      { module: "finances", level: "write" },
      async ({ actor }, input: string) => {
        return { ok: true };
      }
    );

    await action("test");
    expect(requireModuleAccess).toHaveBeenCalledWith("user-1", "finances", "write");
  });

  it("registra actividad si meta.audit esta configurado y el resultado tiene id", async () => {
    const { defineAction } = await import("../define-action");
    const { requireOsUser } = await import("@/lib/auth/session");
    const { logActivity } = await import("@/lib/activity/log");

    const mockActor = { userId: "user-1", email: "user@test.com", name: "User", role: "team" as const };
    (requireOsUser as any).mockResolvedValue(mockActor);

    const action = defineAction(
      { audit: { verb: "create_task", targetType: "task" } },
      async ({ actor }) => {
        return { id: "task-123", title: "Nueva tarea" };
      }
    );

    const res = await action();
    expect(res.id).toBe("task-123");
    expect(logActivity).toHaveBeenCalledWith({
      actorType: "team",
      actorId: "user-1",
      verb: "create_task",
      targetType: "task",
      targetId: "task-123"
    });
  });

  it("funciona con multiples argumentos en la accion", async () => {
    const { defineAction } = await import("../define-action");
    const { requireOsUser } = await import("@/lib/auth/session");

    const mockActor = { userId: "user-1", email: "user@test.com", name: "User", role: "team" as const };
    (requireOsUser as any).mockResolvedValue(mockActor);

    const action = defineAction({}, async ({ actor }, arg1: string, arg2: number) => {
      return { msg: `${arg1}-${arg2}` };
    });

    const res = await action("hello", 42);
    expect(res.msg).toBe("hello-42");
  });
});
