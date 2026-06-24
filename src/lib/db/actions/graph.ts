"use server";

import { and, eq, or, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { entityLinks } from "@/lib/db/schema";
import type { EntityType } from "@/lib/db/actions/graph-types";
import { SearchResult } from "@/lib/db/actions/search";
import { requireOsUser } from "@/lib/auth/session";
import { getDescriptor } from "@/lib/entities/registry";

export async function linkEntities(
  sourceId: string,
  sourceType: EntityType,
  targetId: string,
  targetType: EntityType,
  relationType = "relates_to"
) {
  await requireOsUser();
  if (sourceId === targetId && sourceType === targetType) throw new Error("No se puede conectar una entidad consigo misma");

  const [existing] = await db
    .select()
    .from(entityLinks)
    .where(
      or(
        and(
          eq(entityLinks.sourceId, sourceId),
          eq(entityLinks.sourceType, sourceType),
          eq(entityLinks.targetId, targetId),
          eq(entityLinks.targetType, targetType),
          eq(entityLinks.relationType, relationType)
        ),
        and(
          eq(entityLinks.sourceId, targetId),
          eq(entityLinks.sourceType, targetType),
          eq(entityLinks.targetId, sourceId),
          eq(entityLinks.targetType, sourceType),
          eq(entityLinks.relationType, relationType)
        )
      )
    )
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(entityLinks)
    .values({ sourceId, sourceType, targetId, targetType, relationType })
    .returning();

  return created;
}

export async function unlinkEntity(linkId: string) {
  await requireOsUser();
  await db.delete(entityLinks).where(eq(entityLinks.id, linkId));
}

export async function getEntityConnections(entityId: string) {
  await requireOsUser();
  return db
    .select()
    .from(entityLinks)
    .where(or(eq(entityLinks.sourceId, entityId), eq(entityLinks.targetId, entityId)));
}

export async function getGraphSnapshot() {
  await requireOsUser();
  return db.select().from(entityLinks);
}

export type ResolvedConnection = SearchResult & { linkId: string; relationType: string; isSource: boolean };

export async function getResolvedEntityConnections(entityId: string): Promise<ResolvedConnection[]> {
  await requireOsUser();
  const connections = await getEntityConnections(entityId);
  if (connections.length === 0) return [];

  const targetsByType: Record<string, { id: string; linkId: string; relationType: string; isSource: boolean }[]> = {};

  for (const c of connections) {
    const isSource = c.sourceId === entityId;
    const targetId = isSource ? c.targetId : c.sourceId;
    const targetType = isSource ? c.targetType : c.sourceType;

    if (!targetsByType[targetType]) targetsByType[targetType] = [];
    targetsByType[targetType].push({ id: targetId, linkId: c.id, relationType: c.relationType, isSource });
  }

  const resolved: ResolvedConnection[] = [];

  const promises = Object.entries(targetsByType).map(async ([type, targets]) => {
    if (targets.length === 0) return;
    const desc = getDescriptor(type as EntityType);
    if (!desc) return;

    const ids = targets.map(t => t.id);
    const rows = await db.select().from(desc.table).where(inArray(desc.table.id, ids));

    for (const row of rows) {
      const targetData = targets.find(t => t.id === row.id);
      if (targetData) {
        resolved.push({
          id: row.id,
          type: type as EntityType,
          linkId: targetData.linkId,
          relationType: targetData.relationType,
          isSource: targetData.isSource,
          ...desc.toDisplay(row)
        });
      }
    }
  });

  await Promise.all(promises);
  return resolved;
}
