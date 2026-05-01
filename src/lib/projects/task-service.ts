"use server";

import { getDb } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { WorkspaceTaskStatusValue } from "@/lib/ops/status-catalog";

export async function updateTaskStatus(taskId: string, status: WorkspaceTaskStatusValue) {
  const db = getDb();
  await db
    .update(tasks)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));
}

export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    status?: WorkspaceTaskStatusValue;
    owner?: string | null;
    dueLabel?: string | null;
  }
) {
  const db = getDb();
  await db
    .update(tasks)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));
}

export async function archiveTask(taskId: string) {
  const db = getDb();
  await db
    .update(tasks)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));
}
