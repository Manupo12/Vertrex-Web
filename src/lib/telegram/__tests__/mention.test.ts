import { describe, it, expect } from "vitest";
import { normalizeTelegramUsername, mentionFor } from "../mention";

describe("Telegram mentions helper", () => {
  describe("normalizeTelegramUsername", () => {
    it("should extract username from standard handles", () => {
      expect(normalizeTelegramUsername("@manuel_v")).toBe("manuel_v");
      expect(normalizeTelegramUsername("manuel_v")).toBe("manuel_v");
    });

    it("should extract username from t.me URLs", () => {
      expect(normalizeTelegramUsername("https://t.me/manuel_v")).toBe("manuel_v");
      expect(normalizeTelegramUsername("http://t.me/manuel_v?start=ref")).toBe("manuel_v");
    });

    it("should return empty string for invalid usernames", () => {
      expect(normalizeTelegramUsername("ma")).toBe(""); // Too short
      expect(normalizeTelegramUsername("manuel-v")).toBe(""); // Invalid char '-'
      expect(normalizeTelegramUsername("")).toBe("");
    });
  });

  describe("mentionFor", () => {
    it("should format username with @ when available", () => {
      expect(mentionFor({ name: "Manuel", telegramUsername: "manuel_v" })).toBe("@manuel_v");
    });

    it("should return name when username is not available", () => {
      expect(mentionFor({ name: "Manuel", telegramUsername: null })).toBe("Manuel");
      expect(mentionFor({ name: "Manuel", telegramUsername: "" })).toBe("Manuel");
    });
  });
});
