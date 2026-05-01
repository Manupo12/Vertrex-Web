"use server";

import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { timeEntries } from "@/lib/db/schema";
import { showToast } from "@/components/ui/toast-container";

export async function createTimeEntry(data: {
  taskId?: string | null;
  projectId?: string | null;
  clientId?: string | null;
  userId?: string | null;
  durationMinutes: number;
  description?: string | null;
  loggedAt?: Date;
}) {
  const db = getDb();
  const [result] = await db
    .insert(timeEntries)
    .values({
      taskId: data.taskId,
      projectId: data.projectId,
      clientId: data.clientId,
      userId: data.userId,
      durationMinutes: data.durationMinutes,
      description: data.description,
      loggedAt: data.loggedAt ?? new Date(),
    })
    .returning();
  showToast(`${data.durationMinutes} min registradas`, "success");
  return result;
}

export async function getTimeEntries(filters?: {
  taskId?: string;
  userId?: string;
  projectId?: string;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = getDb();
  const conditions = [];
  if (filters?.taskId) conditions.push(eq(timeEntries.taskId, filters.taskId));
  if (filters?.userId) conditions.push(eq(timeEntries.userId, filters.userId));
  if (filters?.projectId) conditions.push(eq(timeEntries.projectId, filters.projectId));
  if (filters?.clientId) conditions.push(eq(timeEntries.clientId, filters.clientId));
  if (filters?.startDate) conditions.push(gte(timeEntries.loggedAt, filters.startDate));
  if (filters?.endDate) conditions.push(lte(timeEntries.loggedAt, filters.endDate));

  return db
    .select()
    .from(timeEntries)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(timeEntries.loggedAt));
}

export async function getTimeSummaryByTask(taskId: string) {
  const db = getDb();
  const [result] = await db
    .select({ totalMinutes: sql<number>`COALESCE(SUM(${timeEntries.durationMinutes}), 0)` })
    .from(timeEntries)
    .where(eq(timeEntries.taskId, taskId));
  return result?.totalMinutes ?? 0;
}

export async function deleteTimeEntry(entryId: string) {
  const db = getDb();
  await db.delete(timeEntries).where(eq(timeEntries.id, entryId));
  showToast("Registro eliminado", "info");
}
