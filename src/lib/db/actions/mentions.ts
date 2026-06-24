"use server";
import { db } from "@/lib/db";
import { entityLinks } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { linkEntities } from "@/lib/db/actions/graph";
import { getDescriptor } from "@/lib/entities/registry";
import type { EntityType } from "@/lib/db/actions/graph-types";

function extractMentionNodes(blocks: any[]): any[] {
  const mentions: any[] = [];
  if (!blocks || !Array.isArray(blocks)) return mentions;
  for (const block of blocks) {
    const items = block.content || block.inlineContent || [];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item?.type === "mention" && item?.props?.id) {
          mentions.push(item);
        }
      }
    }
    if (block.children) mentions.push(...extractMentionNodes(block.children));
  }
  return mentions;
}

export async function materializeMentions(sourceId: string, sourceType: string, descriptionJson: any) {
  if (!descriptionJson) return;
  const blocks = Array.isArray(descriptionJson) ? descriptionJson : (descriptionJson.content || []);
  const mentionNodes = extractMentionNodes(blocks);
  for (const m of mentionNodes) {
    if (!m.props?.id || !m.props?.type) continue;
    
    // Validar tipo de entidad contra el registro
    const typeDescriptor = getDescriptor(m.props.type as EntityType);
    if (!typeDescriptor) continue;

    const existing = await db.select().from(entityLinks).where(
      and(eq(entityLinks.sourceId, sourceId), eq(entityLinks.sourceType, sourceType as any), eq(entityLinks.targetId, m.props.id), eq(entityLinks.relationType, "mentions"))
    ).limit(1);
    if (existing.length === 0) {
      await linkEntities(sourceId, sourceType as any, m.props.id, m.props.type as any, "mentions");
    }
  }
}
