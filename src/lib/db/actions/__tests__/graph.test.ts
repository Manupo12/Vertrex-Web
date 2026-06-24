import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
  }
}));
vi.mock("@/lib/auth/session", () => ({
  requireOsUser: vi.fn().mockResolvedValue({ userId: "test-user-id" })
}));

describe("graph actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resuelve conexiones de una entidad a través del registro", async () => {
    const { getResolvedEntityConnections } = await import("../graph");
    const { db } = await import("@/lib/db");

    const mockConnections = [
      {
        id: "link-1",
        sourceId: "project-1",
        sourceType: "project",
        targetId: "client-1",
        targetType: "client",
        relationType: "relates_to"
      }
    ];

    let callCount = 0;
    (db.select as any).mockImplementation(() => ({
      from: vi.fn().mockImplementation((table: any) => ({
        where: vi.fn().mockImplementation((cond: any) => {
          if (callCount === 0) {
            callCount++;
            return Promise.resolve(mockConnections);
          }
          return Promise.resolve([{ id: "client-1", name: "ACME Corp", slug: "acme" }]);
        })
      }))
    }));

    const resolved = await getResolvedEntityConnections("project-1");
    expect(resolved).toBeDefined();
    expect(resolved.length).toBe(1);
    expect(resolved[0]).toEqual({
      id: "client-1",
      type: "client",
      linkId: "link-1",
      relationType: "relates_to",
      isSource: true,
      label: "ACME Corp",
      subtitle: "Cliente (acme)",
      href: "/os/crm/acme"
    });
  });
});
