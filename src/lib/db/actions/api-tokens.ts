import "server-only";
import { db } from "@/lib/db";
import { apiTokens, users } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { generateApiToken, hashApiToken } from "@/lib/api/tokens";
import type { OsSession } from "@/lib/auth/session";

export async function createApiTokenForUser(userId: string, name: string, expiresAt?: Date) {
  const { token, tokenHash, prefix } = generateApiToken();
  const [record] = await db
    .insert(apiTokens)
    .values({ userId, name, tokenHash, prefix, expiresAt: expiresAt ?? null })
    .returning();
  return { token, record }; // `token` se muestra UNA sola vez
}

export async function listApiTokensForUser(userId: string) {
  return db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      prefix: apiTokens.prefix,
      lastUsedAt: apiTokens.lastUsedAt,
      expiresAt: apiTokens.expiresAt,
      revokedAt: apiTokens.revokedAt,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, userId))
    .orderBy(desc(apiTokens.createdAt));
}

export async function revokeApiToken(userId: string, tokenId: string) {
  await db
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, userId)));
}

export async function resolveActorFromToken(token: string): Promise<OsSession | null> {
  const [row] = await db
    .select()
    .from(apiTokens)
    .where(and(eq(apiTokens.tokenHash, hashApiToken(token)), isNull(apiTokens.revokedAt)))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, row.userId), eq(users.isActive, true)))
    .limit(1);
  if (!user) return null;
  await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, row.id));
  return { userId: user.id, email: user.email, name: user.name, role: user.role };
}
