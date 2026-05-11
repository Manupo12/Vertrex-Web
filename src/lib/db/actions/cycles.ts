"use server";

import { db } from "@/lib/db";
import { cycles, tasks } from "@/lib/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { requireOsUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { revalidatePath } from "next/cache";

export async function createCycleAction(projectId: string, input: { name: string; startsAt: Date; endsAt: Date; goal?: string }) {
  const user = await requireOsUser();
  const [cycle] = await db.insert(cycles).values({
    projectId,
    name: input.name,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    goal: input.goal
  }).returning();

  await logActivity({
    actorType: "team", actorId: user.userId, verb: "created",
    targetType: "cycle", targetId: cycle.id
  });

  revalidatePath("/os/projects");
  return cycle;
}

export async function activateCycleAction(cycleId: string) {
  const user = await requireOsUser();
  const [cycle] = await db.select().from(cycles).where(eq(cycles.id, cycleId));
  if (!cycle) throw new Error("Cycle not found");

  // Completar el ciclo activo anterior
  await db.update(cycles)
    .set({ status: "completed" })
    .where(and(eq(cycles.projectId, cycle.projectId), eq(cycles.status, "active")));

  // Activar nuevo ciclo
  const [activated] = await db.update(cycles).set({ status: "active" }).where(eq(cycles.id, cycleId)).returning();

  await logActivity({
    actorType: "team", actorId: user.userId, verb: "activated",
    targetType: "cycle", targetId: cycleId
  });

  revalidatePath("/os/projects");
  return activated;
}

export async function closeCycleAction(cycleId: string, opts: { moveUnfinishedToBacklog: boolean }) {
  const user = await requireOsUser();
  const [cycle] = await db.update(cycles).set({ status: "completed" }).where(eq(cycles.id, cycleId)).returning();
  
  if (opts.moveUnfinishedToBacklog) {
    await db.update(tasks).set({ cycleId: null })
      .where(and(eq(tasks.cycleId, cycleId), inArray(tasks.state, ["backlog", "todo", "in_progress", "in_review"])));
  }

  await logActivity({
    actorType: "team", actorId: user.userId, verb: "closed",
    targetType: "cycle", targetId: cycleId
  });

  revalidatePath("/os/projects");
  return cycle;
}

export async function addTasksToCycleAction(cycleId: string, taskIds: string[]) {
  const user = await requireOsUser();
  if (taskIds.length === 0) return;
  await db.update(tasks).set({ cycleId }).where(inArray(tasks.id, taskIds));
  revalidatePath("/os/projects");
}
