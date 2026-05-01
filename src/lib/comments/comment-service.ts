"use server";

import { getDb } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";

export type CommentEntityType = "task" | "ticket" | "client" | "deal" | "project" | "event";

export type CommentRecord = {
  id: string;
  entityType: CommentEntityType;
  entityId: string;
  author: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getComments(entityType: CommentEntityType, entityId: string): Promise<CommentRecord[]> {
  const db = getDb();
  const results = await db
    .select()
    .from(comments)
    .where(and(
      eq(comments.entityType, entityType),
      eq(comments.entityId, entityId)
    ))
    .orderBy(desc(comments.createdAt));

  return results.map((c) => ({
    id: c.id,
    entityType: c.entityType as CommentEntityType,
    entityId: c.entityId,
    author: c.author,
    content: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

export async function addComment(
  entityType: CommentEntityType,
  entityId: string,
  author: string,
  content: string
): Promise<CommentRecord> {
  const db = getDb();
  const [result] = await db
    .insert(comments)
    .values({
      entityType,
      entityId,
      author,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    id: result.id,
    entityType: result.entityType as CommentEntityType,
    entityId: result.entityId,
    author: result.author,
    content: result.content,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

export async function updateComment(commentId: string, content: string): Promise<void> {
  const db = getDb();
  await db
    .update(comments)
    .set({
      content,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, commentId));
}

export async function deleteComment(commentId: string): Promise<void> {
  const db = getDb();
  await db.delete(comments).where(eq(comments.id, commentId));
}
