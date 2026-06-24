import { db } from "@/lib/db";
import { activity } from "@/lib/db/schema";
import type { EntityType } from "@/lib/db/actions/graph-types";

export async function logActivity(params: {
  actorType: "team" | "client" | "system";
  actorId?: string;
  verb: string;
  targetType: EntityType;
  targetId: string;
  payload?: Record<string, any>;
}) {
  const [log] = await db
    .insert(activity)
    .values({
      actorType: params.actorType,
      actorId: params.actorId,
      verb: params.verb,
      targetType: params.targetType,
      targetId: params.targetId,
      payload: params.payload || {},
    })
    .returning();

  return log;
}
