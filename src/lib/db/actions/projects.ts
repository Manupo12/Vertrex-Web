"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, finances, entityLinks } from "@/lib/db/schema";
import { linkEntities, getEntityConnections } from "@/lib/db/actions/graph";
import { requireOsUser } from "@/lib/auth/session";

export async function createProjectAction(formData: FormData) {
  await requireOsUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("El nombre es obligatorio");
  const [project] = await db.insert(projects).values({ name, status: "active", progress: 0, currentVersion: "v1.0", referenceLinks: [] }).returning();
  revalidatePath("/os/projects");
  redirect(`/os/projects/${project.id}`);
}

export async function updateProjectAction(id: string, data: { name?: string; status?: string; progress?: number; currentVersion?: string }) {
  await requireOsUser();
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.status !== undefined) update.status = data.status;
  if (data.progress !== undefined) update.progress = data.progress;
  if (data.currentVersion !== undefined) update.currentVersion = data.currentVersion;
  await db.update(projects).set(update).where(eq(projects.id, id));
  revalidatePath(`/os/projects/${id}`);
  revalidatePath("/os/projects");
}

export async function addProjectReferenceLinkAction(projectId: string, label: string, url: string) {
  await requireOsUser();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error("Proyecto no encontrado");
  const links = (project.referenceLinks as Array<{ label: string; url: string }>) || [];
  links.push({ label, url });
  await db.update(projects).set({ referenceLinks: links }).where(eq(projects.id, projectId));
  revalidatePath(`/os/projects/${projectId}`);
}

export async function removeProjectReferenceLinkAction(projectId: string, index: number) {
  await requireOsUser();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error("Proyecto no encontrado");
  const links = (project.referenceLinks as Array<{ label: string; url: string }>) || [];
  links.splice(index, 1);
  await db.update(projects).set({ referenceLinks: links }).where(eq(projects.id, projectId));
  revalidatePath(`/os/projects/${projectId}`);
}

export async function projectHasPaidAdvance(projectId: string): Promise<boolean> {
  const related = await db.select().from(finances).where(
    and(
      eq(finances.type, "ingreso"),
      eq(finances.status, "paid"),
      eq(finances.concept, "Anticipo 50%")
    )
  );
  const links = await db.select().from(entityLinks).where(
    or(
      and(eq(entityLinks.sourceId, projectId), eq(entityLinks.sourceType, "project"), eq(entityLinks.targetType, "finance")),
      and(eq(entityLinks.targetId, projectId), eq(entityLinks.targetType, "project"), eq(entityLinks.sourceType, "finance"))
    )
  );
  const financeIds = links.map(l => l.sourceId === projectId ? l.targetId : l.sourceId);
  return related.some(f => financeIds.includes(f.id));
}

export async function getProjectById(id: string) {
  await requireOsUser();
  return db.select().from(projects).where(eq(projects.id, id)).limit(1).then(rows => rows[0] || null);
}
