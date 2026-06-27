import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildTaskDigest, renderDigest, getBogotaStartOfToday } from "../task-digest";

vi.mock("@/lib/db", () => {
  return {
    db: {
      select: vi.fn(),
    },
  };
});

describe("Telegram task digest builder and renderer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getBogotaStartOfToday", () => {
    it("should compute start of today in Bogota (UTC-5)", () => {
      // 2026-06-27T17:00:00Z is 12:00:00 in Bogota
      const now = new Date("2026-06-27T17:00:00Z");
      const start = getBogotaStartOfToday(now);
      // Start of today is 2026-06-27 00:00:00 Bogota = 2026-06-27 05:00:00 UTC
      expect(start.toISOString()).toBe("2026-06-27T05:00:00.000Z");
    });
  });

  describe("buildTaskDigest", () => {
    it("should return correct sections from database select responses", async () => {
      const { db } = await import("@/lib/db");

      // Mock responses:
      // Overdue response: 1 item
      const mockOverdue = [
        {
          task: { id: "t1", identifier: "PROJ-1", title: "Task 1", dueDate: new Date("2026-06-25T12:00:00Z") },
          user: { name: "Juan", telegramUsername: "juan_t" },
        },
      ];
      // Due soon response: 1 item
      const mockDueSoon = [
        {
          task: { id: "t2", identifier: "PROJ-2", title: "Task 2", dueDate: new Date("2026-06-27T18:00:00Z") },
          user: null,
        },
      ];
      // Unassigned response: 1 item
      const mockUnassigned = [
        {
          task: { id: "t3", identifier: "PROJ-3", title: "Task 3" },
          project: { name: "Proj A", status: "active" },
        },
      ];

      // Drizzle chain mocking for:
      // db.select().from().leftJoin().where()
      const mockWhereOverdue = { where: vi.fn().mockResolvedValue(mockOverdue) };
      const mockLeftJoinOverdue = { leftJoin: vi.fn().mockReturnValue(mockWhereOverdue) };
      const mockFromOverdue = { from: vi.fn().mockReturnValue(mockLeftJoinOverdue) };

      const mockWhereDueSoon = { where: vi.fn().mockResolvedValue(mockDueSoon) };
      const mockLeftJoinDueSoon = { leftJoin: vi.fn().mockReturnValue(mockWhereDueSoon) };
      const mockFromDueSoon = { from: vi.fn().mockReturnValue(mockLeftJoinDueSoon) };

      const mockWhereUnassigned = { where: vi.fn().mockResolvedValue(mockUnassigned) };
      const mockLeftJoinUnassigned = { leftJoin: vi.fn().mockReturnValue(mockWhereUnassigned) };
      const mockFromUnassigned = { from: vi.fn().mockReturnValue(mockLeftJoinUnassigned) };

      vi.mocked(db.select)
        .mockReturnValueOnce(mockFromOverdue as any) // first call in buildTaskDigest
        .mockReturnValueOnce(mockFromDueSoon as any)  // second call
        .mockReturnValueOnce(mockFromUnassigned as any); // third call

      const now = new Date("2026-06-27T12:00:00Z"); // 07:00 Bogota
      const sections = await buildTaskDigest(now);

      expect(sections).toHaveLength(3);
      expect(sections[0]).toEqual({
        kind: "overdue",
        count: 1,
        lines: ["@juan_t — PROJ-1 Task 1 (venció hace 2 d)"],
      });
      expect(sections[1]).toEqual({
        kind: "due_soon",
        count: 1,
        lines: ["Sin asignar — PROJ-2 Task 2 (hoy)"],
      });
      expect(sections[2]).toEqual({
        kind: "unassigned",
        count: 1,
        lines: ["PROJ-3 Task 3 → ¿quién la toma?"],
      });
    });
  });

  describe("renderDigest", () => {
    it("should render correct text content", () => {
      const sections = [
        {
          kind: "overdue" as const,
          count: 1,
          lines: ["@juan_t — PROJ-1 Task 1 (venció hace 2 d)"],
        },
        {
          kind: "due_soon" as const,
          count: 1,
          lines: ["Sin asignar — PROJ-2 Task 2 (hoy)"],
        },
      ];

      const now = new Date("2026-06-27T12:00:00Z");
      const text = renderDigest(sections, now);

      expect(text).toContain("📋 Resumen de tareas");
      expect(text).toContain("🔴 Vencidas (1)\n@juan_t — PROJ-1 Task 1 (venció hace 2 d)");
      expect(text).toContain("🟠 Vencen pronto (1)\nSin asignar — PROJ-2 Task 2 (hoy)");
    });

    it("should return empty string if sections are empty", () => {
      expect(renderDigest([])).toBe("");
    });
  });
});
