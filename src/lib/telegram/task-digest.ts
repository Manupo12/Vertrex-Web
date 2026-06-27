import { db } from "@/lib/db";
import { tasks, users, projects } from "@/lib/db/schema";
import { eq, and, lt, gte, isNull, notInArray, or } from "drizzle-orm";
import { mentionFor } from "./mention";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type DigestSection = {
  kind: "overdue" | "due_soon" | "unassigned";
  lines: string[];
  count: number;
};

/**
 * Retorna el inicio del día de hoy en Bogotá (UTC-5) representado como un objeto Date de JS.
 */
export function getBogotaStartOfToday(now: Date): Date {
  const utcTime = now.getTime();
  const bogotaTime = new Date(utcTime - 5 * 60 * 60 * 1000);
  const year = bogotaTime.getUTCFullYear();
  const month = bogotaTime.getUTCMonth();
  const day = bogotaTime.getUTCDate();
  return new Date(Date.UTC(year, month, day, 5, 0, 0, 0));
}

/**
 * Consulta la base de datos para armar el digest de tareas.
 */
export async function buildTaskDigest(nowDate?: Date): Promise<DigestSection[]> {
  const now = nowDate || new Date();
  const startOfToday = getBogotaStartOfToday(now);
  const endOfTomorrow = new Date(startOfToday.getTime() + 48 * 60 * 60 * 1000);

  // 1. Tareas Vencidas
  const overdueRaw = await db
    .select({
      task: tasks,
      user: users,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(
      and(
        lt(tasks.dueDate, now),
        notInArray(tasks.state, ["done", "cancelled"])
      )
    );

  // 2. Tareas por Vencer (hoy o mañana)
  const dueSoonRaw = await db
    .select({
      task: tasks,
      user: users,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(
      and(
        gte(tasks.dueDate, now),
        lt(tasks.dueDate, endOfTomorrow),
        notInArray(tasks.state, ["done", "cancelled"])
      )
    );

  // 3. Tareas Activas Sin Responsable (en proyectos activos o sin proyecto)
  const unassignedRaw = await db
    .select({
      task: tasks,
      project: projects,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        isNull(tasks.assigneeId),
        notInArray(tasks.state, ["done", "cancelled"]),
        or(
          eq(projects.status, "active"),
          isNull(tasks.projectId)
        )
      )
    );

  const sections: DigestSection[] = [];

  // Formatear Vencidas
  if (overdueRaw.length > 0) {
    const lines = overdueRaw.map(({ task, user }) => {
      const assigneeMention = user ? mentionFor(user) : "Sin asignar";
      const dueDate = new Date(task.dueDate!);
      const startOfDueDate = getBogotaStartOfToday(dueDate);
      const diffInMs = startOfToday.getTime() - startOfDueDate.getTime();
      const diffInDays = Math.floor(diffInMs / (24 * 60 * 60 * 1000));
      
      let relativeStr = "venció hoy";
      if (diffInDays === 1) {
        relativeStr = "venció ayer";
      } else if (diffInDays > 1) {
        relativeStr = `venció hace ${diffInDays} d`;
      }
      
      return `${assigneeMention} — ${task.identifier} ${task.title} (${relativeStr})`;
    });
    sections.push({ kind: "overdue", lines, count: overdueRaw.length });
  }

  // Formatear Por Vencer
  if (dueSoonRaw.length > 0) {
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const lines = dueSoonRaw.map(({ task, user }) => {
      const assigneeMention = user ? mentionFor(user) : "Sin asignar";
      const dueDate = new Date(task.dueDate!);
      const relativeStr = dueDate < startOfTomorrow ? "hoy" : "mañana";
      return `${assigneeMention} — ${task.identifier} ${task.title} (${relativeStr})`;
    });
    sections.push({ kind: "due_soon", lines, count: dueSoonRaw.length });
  }

  // Formatear Sin Responsable
  if (unassignedRaw.length > 0) {
    const lines = unassignedRaw.map(({ task }) => {
      return `${task.identifier} ${task.title} → ¿quién la toma?`;
    });
    sections.push({ kind: "unassigned", lines, count: unassignedRaw.length });
  }

  return sections;
}

/**
 * Arma el mensaje a enviar a Telegram.
 */
export function renderDigest(sections: DigestSection[], nowDate?: Date): string {
  if (sections.length === 0) return "";

  const now = nowDate || new Date();
  const dateStr = format(new Date(now.getTime() - 5 * 60 * 60 * 1000), "eee d MMM", { locale: es });

  let text = `📋 Resumen de tareas — ${dateStr}\n`;

  for (const sec of sections) {
    text += "\n";
    if (sec.kind === "overdue") {
      text += `🔴 Vencidas (${sec.count})\n`;
    } else if (sec.kind === "due_soon") {
      text += `🟠 Vencen pronto (${sec.count})\n`;
    } else if (sec.kind === "unassigned") {
      text += `⚪ Sin responsable (${sec.count})\n`;
    }
    text += sec.lines.join("\n") + "\n";
  }

  return text.trim();
}
