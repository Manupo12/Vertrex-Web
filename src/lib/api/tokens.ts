import "server-only";
import { randomBytes, createHash } from "node:crypto";

const TOKEN_PREFIX = "vtx_";

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateApiToken(): { token: string; tokenHash: string; prefix: string } {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  return { token, tokenHash: hashApiToken(token), prefix: token.slice(0, 12) };
}
