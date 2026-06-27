import { describe, it, expect, vi, beforeEach } from "vitest";
import { runDailyDigest } from "../run-digest";
import { buildTaskDigest, renderDigest } from "../task-digest";
import { sendGroupMessage } from "../client";

vi.mock("../task-digest", () => ({
  buildTaskDigest: vi.fn(),
  renderDigest: vi.fn(() => "mock digest content"),
}));

vi.mock("../client", () => ({
  sendGroupMessage: vi.fn(),
}));

describe("Telegram runDailyDigest coordinator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not send message if there are no task sections to notify", async () => {
    vi.mocked(buildTaskDigest).mockResolvedValueOnce([]);

    const result = await runDailyDigest();
    expect(result).toEqual({ sent: false, sections: 0 });
    expect(sendGroupMessage).not.toHaveBeenCalled();
  });

  it("should format and send message if sections are present", async () => {
    const mockSections = [
      {
        kind: "overdue" as const,
        count: 1,
        lines: ["line 1"],
      },
    ];
    vi.mocked(buildTaskDigest).mockResolvedValueOnce(mockSections);
    vi.mocked(sendGroupMessage).mockResolvedValueOnce({ ok: true });

    const result = await runDailyDigest();
    expect(result).toEqual({ sent: true, sections: 1 });
    expect(renderDigest).toHaveBeenCalledWith(mockSections, undefined);
    expect(sendGroupMessage).toHaveBeenCalledWith("mock digest content");
  });
});
