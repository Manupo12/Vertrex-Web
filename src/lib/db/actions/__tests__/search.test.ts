import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  }
}));
vi.mock("@/lib/auth/session", () => ({
  getOsSession: vi.fn().mockResolvedValue({ userId: "test-user-id", email: "test@test.com", name: "Test", role: "admin" })
}));

describe("searchEntitiesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca entidades usando el registro y retorna SearchResult[]", async () => {
    const { searchEntitiesAction } = await import("../search");
    const { db } = await import("@/lib/db");

    // Mock generic select chain
    const mockSelectResult = [
      { id: "c-1", name: "ACME Corp", slug: "acme" }
    ];

    const limitMock = vi.fn().mockResolvedValue(mockSelectResult);
    const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.select as any).mockReturnValue({ from: fromMock });

    const results = await searchEntitiesAction("ACME");
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toEqual({
      id: "c-1",
      label: "ACME Corp",
      subtitle: "Cliente (acme)",
      type: "client",
      href: "/os/crm/acme"
    });
  });

  it("respeta el filtro is:task y realiza búsqueda específica de tareas", async () => {
    const { searchEntitiesAction } = await import("../search");
    const { db } = await import("@/lib/db");

    const mockTasks = [
      { id: "t-1", title: "Completar migracion", identifier: "VTX-42" }
    ];

    const limitMock = vi.fn().mockResolvedValue(mockTasks);
    const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.select as any).mockReturnValue({ from: fromMock });

    const results = await searchEntitiesAction("is:task Completar");
    expect(results).toBeDefined();
    expect(results.length).toBe(1);
    expect(results[0]).toEqual({
      id: "t-1",
      label: "Completar migracion",
      subtitle: "Tarea (VTX-42)",
      type: "task",
      href: "/t/VTX-42"
    });
  });
});
