import { describe, it, expect } from "vitest";
import { signSessionToken, verifySessionToken, getAuthSecret } from "./token";

describe("token", () => {
  describe("signSessionToken + verifySessionToken", () => {
    it("should sign and verify a valid token", async () => {
      const payload = {
        sid: "session-123",
        role: "team" as const,
        email: "test@vertrex.co",
        name: "Test User",
        clientId: null,
        clientSlug: null,
      };

      const token = await signSessionToken(payload, "user-123", new Date(Date.now() + 3600_000));
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.sid).toBe("session-123");
      expect(verified?.role).toBe("team");
      expect(verified?.email).toBe("test@vertrex.co");
      expect(verified?.name).toBe("Test User");
      expect(verified?.sub).toBe("user-123");
    });

    it("should return null for an invalid token", async () => {
      const verified = await verifySessionToken("invalid-token-string");
      expect(verified).toBeNull();
    });

    it("should return null for a tampered token", async () => {
      const payload = {
        sid: "session-456",
        role: "client" as const,
        email: "client@client.vertrex.co",
        name: "Client User",
        clientId: "client-123",
        clientSlug: "acme",
      };

      const token = await signSessionToken(payload, "user-456", new Date(Date.now() + 3600_000));
      const tampered = token.slice(0, -5) + "xxxxx";
      const verified = await verifySessionToken(tampered);
      expect(verified).toBeNull();
    });
  });

  describe("getAuthSecret", () => {
    it("should return a Uint8Array secret", () => {
      const secret = getAuthSecret();
      expect(secret).toBeInstanceOf(Uint8Array);
      expect(secret.length).toBeGreaterThan(0);
    });
  });
});
