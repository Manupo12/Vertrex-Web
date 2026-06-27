import { describe, it, expect, vi, beforeEach } from "vitest";
import { notifyTaskAssigned } from "../notify-tasks";
import { sendGroupMessage } from "../client";

vi.mock("../client", () => ({
  sendGroupMessage: vi.fn(),
  isTelegramEnabled: vi.fn(() => true),
}));

describe("Telegram task assignment notifier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send formatted message with due date", async () => {
    vi.mocked(sendGroupMessage).mockResolvedValue({ ok: true });

    await notifyTaskAssigned({
      assignee: { id: "1", name: "Manuel", telegramUsername: "manuel_v" },
      task: { identifier: "PROJ-12", title: "Build feature", dueDate: new Date("2026-07-04T12:00:00.000Z") },
      assignedByName: "Ana",
    });

    expect(sendGroupMessage).toHaveBeenCalledWith(
      expect.stringContaining("📌 Nueva tarea para @manuel_v\nPROJ-12 · Build feature\n🗓 Vence: sáb 4 jul\nAsignada por Ana")
    );
  });

  it("should send formatted message without due date", async () => {
    vi.mocked(sendGroupMessage).mockResolvedValue({ ok: true });

    await notifyTaskAssigned({
      assignee: { id: "1", name: "Manuel", telegramUsername: "manuel_v" },
      task: { identifier: "PROJ-12", title: "Build feature", dueDate: null },
      assignedByName: "Ana",
    });

    expect(sendGroupMessage).toHaveBeenCalledWith(
      expect.stringContaining("📌 Nueva tarea para @manuel_v\nPROJ-12 · Build feature\nAsignada por Ana")
    );
    expect(sendGroupMessage).not.toHaveBeenCalledWith(expect.stringContaining("🗓 Vence"));
  });

  it("should use user name if telegramUsername is null", async () => {
    vi.mocked(sendGroupMessage).mockResolvedValue({ ok: true });

    await notifyTaskAssigned({
      assignee: { id: "1", name: "Manuel", telegramUsername: null },
      task: { identifier: "PROJ-12", title: "Build feature", dueDate: null },
      assignedByName: "Ana",
    });

    expect(sendGroupMessage).toHaveBeenCalledWith(
      expect.stringContaining("📌 Nueva tarea para Manuel\nPROJ-12 · Build feature\nAsignada por Ana")
    );
  });

  it("should catch and suppress exceptions", async () => {
    vi.mocked(sendGroupMessage).mockRejectedValue(new Error("Network Error"));

    await expect(
      notifyTaskAssigned({
        assignee: { id: "1", name: "Manuel", telegramUsername: "manuel_v" },
        task: { identifier: "PROJ-12", title: "Build", dueDate: null },
        assignedByName: "Ana",
      })
    ).resolves.not.toThrow();

    expect(sendGroupMessage).toHaveBeenCalled();
  });
});
