import "server-only";
import { NextRequest } from "next/server";
import { resolveActorFromToken } from "@/lib/db/actions/api-tokens";
import type { OsSession } from "@/lib/auth/session";

export function extractBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function authenticateRequest(req: NextRequest): Promise<OsSession | null> {
  const token = extractBearer(req);
  return token ? resolveActorFromToken(token) : null;
}
