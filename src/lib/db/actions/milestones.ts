"use server";

import { db } from "@/lib/db";
import { milestones, tasks } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireOsUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { revalidatePath } from "next/cache";

export async function createMilestoneAction(projectId: string, input: { name: string; description?: string; targetDate?: Date }) {
  const user = await requireOsUser();
  const [milestone] = await db.insert(milestones).values({
    projectId,
    name: input.name,
    description: input.description,
    targetDate: input.targetDate
  }).returning();

  await logActivity({
    actorType: "team", actorId: user.userId, verb: "created",
    targetType: "milestone", targetId: milestone.id
  });

  revalidatePath("/os/projects");
  return milestone;
}

export async function updateMilestoneAction(id: string, patch: Partial<typeof milestones.$inferInsert>) {
  const user = await requireOsUser();
  const [milestone] = await db.update(milestones).set(patch).where(eq(milestones.id, id)).returning();
  revalidatePath("/os/projects");
  return milestone;
}

export async function completeMilestoneAction(id: string) {
  const user = await requireOsUser();
  const [milestone] = await db.update(milestones).set({ status: "completed" }).where(eq(milestones.id, id)).returning();
  
  await logActivity({
    actorType: "team", actorId: user.userId, verb: "completed",
    targetType: "milestone", targetId: id
  });

  revalidatePath("/os/projects");
  return milestone;
}

export async function addTasksToMilestoneAction(milestoneId: string, taskIds: string[]) {
  const user = await requireOsUser();
  if (taskIds.length === 0) return;
  await db.update(tasks).set({ milestoneId }).where(inArray(tasks.id, taskIds));
  revalidatePath("/os/projects");
}
