"use server";

import { db } from "@/lib/db";
import { tags, taskLabels, entityLinks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireOsUser } from "@/lib/auth/session";
import type { EntityType } from "./graph-types";

export async function createTagAction(slug: string, label: string, color: string, scope = "global", scopeId?: string) {
  await requireOsUser();
  const [tag] = await db.insert(tags).values({ slug, label, color, scope, scopeId }).returning();
  return tag;
}

export async function tagTaskAction(taskId: string, tagId: string) {
  await requireOsUser();
  await db.insert(taskLabels).values({ taskId, tagId }).onConflictDoNothing();
}

export async function untagTaskAction(taskId: string, tagId: string) {
  await requireOsUser();
  await db.delete(taskLabels).where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.tagId, tagId)));
}

export async function tagEntityAction(entityId: string, entityType: EntityType, tagId: string) {
  await requireOsUser();
  const existing = await db.select().from(entityLinks).where(and(
    eq(entityLinks.sourceId, entityId),
    eq(entityLinks.sourceType, entityType),
    eq(entityLinks.targetId, tagId),
    eq(entityLinks.targetType, "tag"),
    eq(entityLinks.relationType, "tagged_with")
  ));
  if (existing.length === 0) {
    await db.insert(entityLinks).values({
      sourceId: entityId,
      sourceType: entityType,
      targetId: tagId,
      targetType: "tag",
      relationType: "tagged_with"
    });
  }
}

export async function untagEntityAction(entityId: string, entityType: EntityType, tagId: string) {
  await requireOsUser();
  await db.delete(entityLinks).where(and(
    eq(entityLinks.sourceId, entityId),
    eq(entityLinks.sourceType, entityType),
    eq(entityLinks.targetId, tagId),
    eq(entityLinks.targetType, "tag"),
    eq(entityLinks.relationType, "tagged_with")
  ));
}

export async function bulkTagEntitiesAction(entityIds: string[], entityType: EntityType, tagLabel: string) {
  await requireOsUser();
  const slug = tagLabel.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!slug) throw new Error("Etiqueta inválida");
  
  let tag = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1).then(rows => rows[0]);
  if (!tag) {
    [tag] = await db.insert(tags).values({ slug, label: tagLabel.trim(), color: "#3b82f6" }).returning();
  }
  
  for (const entityId of entityIds) {
    const existing = await db.select().from(entityLinks).where(and(
      eq(entityLinks.sourceId, entityId),
      eq(entityLinks.sourceType, entityType),
      eq(entityLinks.targetId, tag.id),
      eq(entityLinks.targetType, "tag"),
      eq(entityLinks.relationType, "tagged_with")
    ));
    if (existing.length === 0) {
      await db.insert(entityLinks).values({
        sourceId: entityId,
        sourceType: entityType,
        targetId: tag.id,
        targetType: "tag",
        relationType: "tagged_with"
      });
    }
  }
}

