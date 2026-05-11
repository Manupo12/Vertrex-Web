"use server";

import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireOsUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { revalidatePath } from "next/cache";

export async function addCommentAction(targetType: string, targetId: string, body: string) {
  const user = await requireOsUser();
  const [comment] = await db.insert(comments).values({
    authorType: "team",
    authorId: user.userId,
    targetType: targetType as any,
    targetId,
    body
  }).returning();

  await logActivity({
    actorType: "team",
    actorId: user.userId,
    verb: "commented",
    targetType: targetType as any,
    targetId,
    payload: { commentId: comment.id }
  });

  revalidatePath(`/os/${targetType}s/${targetId}`);
  return comment;
}

export async function listCommentsAction(targetType: string, targetId: string) {
  return await db.select()
    .from(comments)
    .where(and(eq(comments.targetType, targetType as any), eq(comments.targetId, targetId)))
    .orderBy(desc(comments.createdAt));
}
