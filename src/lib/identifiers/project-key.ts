import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { eq, like, desc } from "drizzle-orm";

export function generateProjectKey(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (clean.length === 0) return "PRJ";
  if (clean.length <= 3) return clean;
  return clean.substring(0, 3);
}

export async function nextTaskIdentifier(projectId: string): Promise<string> {
  return await db.transaction(async (tx) => {
    const [project] = await tx.select().from(projects).where(eq(projects.id, projectId));
    if (!project) throw new Error("Project not found");

    const key = project.projectKey || generateProjectKey(project.name);

    // Si el proyecto no tenía key, actualizamos
    if (!project.projectKey) {
      await tx.update(projects).set({ projectKey: key }).where(eq(projects.id, projectId));
    }

    const lastTask = await tx.select()
      .from(tasks)
      .where(like(tasks.identifier, `${key}-%`))
      .orderBy(desc(tasks.createdAt))
      .limit(1);

    let nextN = 1;
    if (lastTask.length > 0) {
      const match = lastTask[0].identifier.match(new RegExp(`^${key}-(\\d+)$`));
      if (match) {
        nextN = parseInt(match[1], 10) + 1;
      }
    }

    return `${key}-${nextN}`;
  });
}
