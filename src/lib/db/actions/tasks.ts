"use server";

import { db } from "@/lib/db";
import { tasks, projects, entityLinks, milestones } from "@/lib/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { requireOsUser } from "@/lib/auth/session";
import { nextTaskIdentifier } from "@/lib/identifiers/project-key";
import { materializeMentions } from "@/lib/db/actions/mentions";
import { logActivity } from "@/lib/activity/log";
import { pushNotification } from "@/lib/notifications/service";
import { revalidatePath } from "next/cache";

export async function createTaskAction(input: {
  title: string;
  projectId?: string;
  parentTaskId?: string;
  assigneeId?: string;
  priority?: number;
  cycleId?: string;
  milestoneId?: string;
  taskType?: string;
  dueDate?: Date | string;
  estimatePoints?: number;
  descriptionJson?: any;
  state?: string;
}) {
  const user = await requireOsUser();
  let identifier = `INBOX-${Math.floor(Math.random() * 10000)}`;
  
  if (input.projectId) {
    identifier = await nextTaskIdentifier(input.projectId);
  }

  const validStates = ["backlog", "todo", "in_progress", "in_review", "done", "cancelled"];
  const taskState = input.state && validStates.includes(input.state) ? input.state : "todo";

  const [task] = await db.insert(tasks).values({
    title: input.title,
    projectId: input.projectId || null,
    identifier,
    assigneeId: input.assigneeId,
    priority: input.priority || 0,
    cycleId: input.cycleId,
    milestoneId: input.milestoneId,
    parentTaskId: input.parentTaskId || null,
    taskType: (input.taskType as any) || "other",
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    estimatePoints: input.estimatePoints || null,
    createdBy: user.userId,
    state: taskState,
    descriptionJson: input.descriptionJson || {},
  }).returning();

  await logActivity({
    actorType: "team", actorId: user.userId, verb: "created",
    targetType: "task", targetId: task.id,
    payload: { title: task.title, identifier: task.identifier }
  });

  if (input.assigneeId && input.assigneeId !== user.userId) {
    await pushNotification({
      userId: input.assigneeId,
      type: "task_assigned",
      title: `Nueva tarea asignada: ${task.identifier}`,
      body: task.title,
      targetType: "task",
      targetId: task.id,
      sendEmail: true
    });
  }

  revalidatePath("/os/projects");
  return task;
}

export async function updateTaskAction(id: string, patch: Partial<typeof tasks.$inferInsert>) {
  const user = await requireOsUser();
  const [task] = await db.update(tasks).set({ ...patch, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
  
  if (patch.descriptionJson) await materializeMentions(id, "task", patch.descriptionJson);

  await logActivity({
    actorType: "team", actorId: user.userId, verb: "updated",
    targetType: "task", targetId: id, payload: patch
  });

  revalidatePath("/os/projects");
  return task;
}

export async function moveTaskToProjectAction(id: string, projectId: string, cycleId?: string, milestoneId?: string) {
  const user = await requireOsUser();
  const identifier = await nextTaskIdentifier(projectId);
  const [task] = await db.update(tasks).set({ 
    projectId, identifier, cycleId: cycleId || null, milestoneId: milestoneId || null, updatedAt: new Date() 
  }).where(eq(tasks.id, id)).returning();
  
  await logActivity({
    actorType: "team", actorId: user.userId, verb: "moved",
    targetType: "task", targetId: id, payload: { projectId, identifier }
  });
  
  revalidatePath("/os/projects");
  return task;
}

async function recalculateProjectProgress(projectId: string) {
  const [project] = await db.select({ progressMode: projects.progressMode }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project || project.progressMode === "manual") return;
  const projectTasks = await db.select({ state: tasks.state }).from(tasks).where(eq(tasks.projectId, projectId));
  if (projectTasks.length === 0) return;
  const doneTasks = projectTasks.filter(t => t.state === 'done' || t.state === 'cancelled').length;
  const progress = Math.round((doneTasks / projectTasks.length) * 100);
  await db.update(projects).set({ progress }).where(eq(projects.id, projectId));
}

async function checkMilestoneCompletion(milestoneId: string) {
  const milestoneTasks = await db.select({ state: tasks.state }).from(tasks).where(eq(tasks.milestoneId, milestoneId));
  const allDone = milestoneTasks.every(t => t.state === 'done' || t.state === 'cancelled');
  if (allDone && milestoneTasks.length > 0) {
    await db.update(milestones).set({ status: 'completed' }).where(eq(milestones.id, milestoneId));
  }
}

export async function changeTaskStateAction(id: string, state: string) {
  const user = await requireOsUser();
  const [oldTask] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!oldTask) throw new Error("Task not found");

  const validTransitions: Record<string, string[]> = {
    backlog: ["todo", "cancelled"],
    todo: ["in_progress", "backlog", "cancelled"],
    in_progress: ["in_review", "todo", "backlog", "cancelled"],
    in_review: ["done", "in_progress", "backlog", "cancelled"],
    done: ["todo"],
    cancelled: ["todo"],
  };

  if (!validTransitions[oldTask.state]?.includes(state)) {
    throw new Error(`Transición inválida: ${oldTask.state} → ${state}`);
  }

  const updateData: any = { state, updatedAt: new Date() };
  if (state === "done" || state === "cancelled") {
    updateData.completedAt = new Date();
  } else if (oldTask.state === "done" && state !== "done") {
    updateData.completedAt = null;
  } else if (state === "in_progress" && !oldTask.startedAt) {
    updateData.startedAt = new Date();
  }

  const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();

  await logActivity({
    actorType: "team", actorId: user.userId, verb: "status_changed",
    targetType: "task", targetId: id, payload: { from: oldTask.state, to: state }
  });

  if (state === "in_review" && oldTask.createdBy && oldTask.createdBy !== user.userId) {
    await pushNotification({
      userId: oldTask.createdBy, type: "task_review",
      title: `Tarea lista para revisión: ${task.identifier}`, targetType: "task", targetId: task.id
    });
  }

  // Recalcular progreso
  if (task.projectId) await recalculateProjectProgress(task.projectId);
  if (task.milestoneId) await checkMilestoneCompletion(task.milestoneId);

  // Desbloquear tareas pendientes
  if (state === "done") {
    const blockedLinks = await db.select().from(entityLinks).where(and(eq(entityLinks.sourceId, id), eq(entityLinks.relationType, "blocks")));
    for (const link of blockedLinks) {
      if (link.targetType === "task") {
        const [blockedTask] = await db.select().from(tasks).where(eq(tasks.id, link.targetId));
        if (blockedTask && blockedTask.assigneeId) {
          await pushNotification({
            userId: blockedTask.assigneeId, type: "task_unblocked",
            title: `Tarea desbloqueada: ${blockedTask.identifier}`, body: `Bloqueo resuelto por ${task.identifier}`,
            targetType: "task", targetId: blockedTask.id
          });
        }
      }
    }
  }

  revalidatePath("/os/projects");
  return task;
}

export async function assignTaskAction(id: string, assigneeId: string | null) {
  const user = await requireOsUser();
  const [task] = await db.update(tasks).set({ assigneeId, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
  
  if (assigneeId && assigneeId !== user.userId) {
    await pushNotification({
      userId: assigneeId, type: "task_assigned",
      title: `Tarea asignada: ${task.identifier}`, targetType: "task", targetId: task.id
    });
  }
  revalidatePath("/os/projects");
  return task;
}

export async function setTaskPriorityAction(id: string, priority: number) {
  const [task] = await db.update(tasks).set({ priority, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
  revalidatePath("/os/projects");
  return task;
}

export async function createSubtaskAction(parentId: string, title: string) {
  const user = await requireOsUser();
  const [parentTask] = await db.select().from(tasks).where(eq(tasks.id, parentId));
  if (!parentTask) throw new Error("Parent not found");

  const identifier = parentTask.projectId ? await nextTaskIdentifier(parentTask.projectId) : `INBOX-${Math.floor(Math.random() * 10000)}`;
  
  const [subtask] = await db.insert(tasks).values({
    title,
    projectId: parentTask.projectId,
    parentTaskId: parentId,
    identifier,
    createdBy: user.userId,
  }).returning();

  revalidatePath("/os/projects");
  return subtask;
}

export async function linkTaskBlocksAction(fromId: string, toId: string) {
  const user = await requireOsUser();
  await db.insert(entityLinks).values({
    sourceId: fromId, sourceType: "task",
    targetId: toId, targetType: "task",
    relationType: "blocks"
  });
  revalidatePath("/os/projects");
}

export async function unlinkTaskBlocksAction(linkId: string) {
  await requireOsUser();
  await db.delete(entityLinks).where(eq(entityLinks.id, linkId));
  revalidatePath("/os/projects");
}

export async function listTasksAction(projectId?: string) {
  await requireOsUser();
  if (projectId) {
    return db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(tasks.orderIndex, desc(tasks.createdAt));
  }
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getTaskDetailAction(id: string) {
  await requireOsUser();
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  return task;
}

export async function bulkUpdateTasksAction(ids: string[], patch: Partial<typeof tasks.$inferInsert>) {
  await requireOsUser();
  await db.update(tasks).set({ ...patch, updatedAt: new Date() }).where(inArray(tasks.id, ids));
  revalidatePath("/os/projects");
}

export async function deleteTaskAction(id: string) {
  await requireOsUser();
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath("/os/projects");
}
