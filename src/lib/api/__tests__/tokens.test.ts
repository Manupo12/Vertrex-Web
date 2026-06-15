import { describe, it, expect } from "vitest";
import { generateApiToken, hashApiToken } from "../tokens";

describe("api tokens", () => {
  it("generates a vtx_ token with hash and prefix", () => {
    const { token, tokenHash, prefix } = generateApiToken();
    expect(token.startsWith("vtx_")).toBe(true);
    expect(prefix).toBe(token.slice(0, 12));
    expect(hashApiToken(token)).toBe(tokenHash);
  });
  it("hash is deterministic and differs per token", () => {
    const a = generateApiToken(); const b = generateApiToken();
    expect(hashApiToken(a.token)).toBe(a.tokenHash);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });
});
