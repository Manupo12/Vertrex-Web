import { describe, it, expect, beforeEach } from "vitest";
import { enforceRateLimit, RateLimitError, readRateLimitFingerprint } from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    // Reset global store between tests
    (globalThis as Record<string, unknown>).__vertrexRateLimitStore = undefined;
  });

  describe("enforceRateLimit", () => {
    it("should allow requests under the limit", () => {
      const request = new Request("http://localhost:3000/api/test");
      const result = enforceRateLimit({
        request,
        namespace: "test",
        max: 5,
        windowMs: 60_000,
      });

      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("should decrement remaining on multiple requests", () => {
      const request = new Request("http://localhost:3000/api/test");
      enforceRateLimit({ request, namespace: "test", max: 3, windowMs: 60_000 });
      enforceRateLimit({ request, namespace: "test", max: 3, windowMs: 60_000 });
      const result = enforceRateLimit({ request, namespace: "test", max: 3, windowMs: 60_000 });

      expect(result.remaining).toBe(0);
    });

    it("should throw RateLimitError when exceeding the limit", () => {
      const request = new Request("http://localhost:3000/api/test");
      enforceRateLimit({ request, namespace: "test", max: 2, windowMs: 60_000 });
      enforceRateLimit({ request, namespace: "test", max: 2, windowMs: 60_000 });

      expect(() =>
        enforceRateLimit({ request, namespace: "test", max: 2, windowMs: 60_000 }),
      ).toThrow(RateLimitError);
    });

    it("should use custom identifier when provided", () => {
      const request = new Request("http://localhost:3000/api/test");
      enforceRateLimit({ request, namespace: "test", max: 1, windowMs: 60_000, identifier: "user-A" });

      // Different identifier should have its own bucket
      const result = enforceRateLimit({ request, namespace: "test", max: 1, windowMs: 60_000, identifier: "user-B" });
      expect(result.remaining).toBe(0); // first request for user-B
    });
  });

  describe("readRateLimitFingerprint", () => {
    it("should extract IP from x-forwarded-for", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          "x-forwarded-for": "203.0.113.1, 70.41.3.18",
          "user-agent": "Mozilla/5.0",
        },
      });
      const fp = readRateLimitFingerprint(request);
      expect(fp).toContain("203.0.113.1");
      expect(fp).toContain("Mozilla/5.0");
    });

    it("should fallback to unknown-ip when no headers present", () => {
      const request = new Request("http://localhost:3000");
      const fp = readRateLimitFingerprint(request);
      expect(fp).toContain("unknown-ip");
    });
  });
});
