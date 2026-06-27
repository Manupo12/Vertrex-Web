import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isTelegramEnabled, sendGroupMessage } from "../client";

describe("Telegram client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should return false for isTelegramEnabled if variables are missing", () => {
    process.env.TELEGRAM_NOTIFICATIONS_ENABLED = "true";
    process.env.TELEGRAM_BOT_TOKEN = "";
    process.env.TELEGRAM_GROUP_CHAT_ID = "-100123456";
    expect(isTelegramEnabled()).toBe(false);
  });

  it("should return true for isTelegramEnabled if all variables are set and enabled is true", () => {
    process.env.TELEGRAM_NOTIFICATIONS_ENABLED = "true";
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
    process.env.TELEGRAM_GROUP_CHAT_ID = "-100123456";
    expect(isTelegramEnabled()).toBe(true);
  });

  it("should return ok: false if telegram notifications are disabled", async () => {
    process.env.TELEGRAM_NOTIFICATIONS_ENABLED = "false";
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
    process.env.TELEGRAM_GROUP_CHAT_ID = "-100123456";

    const result = await sendGroupMessage("test message");
    expect(result).toEqual({ ok: false });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should send a group message successfully when API returns success", async () => {
    process.env.TELEGRAM_NOTIFICATIONS_ENABLED = "true";
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
    process.env.TELEGRAM_GROUP_CHAT_ID = "-100123456";

    const mockResponse = {
      ok: true,
      result: {
        message_id: 999,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await sendGroupMessage("Hello Telegram");
    expect(result).toEqual({ ok: true, messageId: 999 });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123:abc/sendMessage",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chat_id: "-100123456",
          text: "Hello Telegram",
          disable_web_page_preview: true,
        }),
      })
    );
  });

  it("should retry once and throw an error if the API response is not ok", async () => {
    process.env.TELEGRAM_NOTIFICATIONS_ENABLED = "true";
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
    process.env.TELEGRAM_GROUP_CHAT_ID = "-100123456";

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ description: "Bad Request" }),
    } as Response);

    await expect(sendGroupMessage("Hello Telegram")).rejects.toThrow(
      "Fallo tras 2 intentos: Error de API Telegram (400): Bad Request"
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
