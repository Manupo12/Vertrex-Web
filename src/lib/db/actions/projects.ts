"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, finances, entityLinks, knowledgeNotes, comments, repositories } from "@/lib/db/schema";

import { requireOsUser } from "@/lib/auth/session";
import { parseGitHubUrl, fetchGitHubRepo } from "@/lib/links/service";

export async function createProjectAction(formData: FormData) {
  await requireOsUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("El nombre es obligatorio");
  const [project] = await db.insert(projects).values({ name, status: "active", progress: 0, currentVersion: "v1.0", referenceLinks: [] }).returning();
  revalidatePath("/os/projects");
  redirect(`/os/projects/${project.id}`);
}

export async function updateProjectAction(id: string, data: { name?: string; status?: string; progress?: number; currentVersion?: string; githubRepoUrl?: string | null }) {
  await requireOsUser();
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.status !== undefined) update.status = data.status;
  if (data.progress !== undefined) update.progress = data.progress;
  if (data.currentVersion !== undefined) update.currentVersion = data.currentVersion;
  if (data.githubRepoUrl !== undefined) update.githubRepoUrl = data.githubRepoUrl;
  await db.update(projects).set(update).where(eq(projects.id, id));
  revalidatePath(`/os/projects/${id}`);
  revalidatePath("/os/projects");
}

export async function updateProjectGitHubRepoAction(projectId: string, repoUrl: string | null) {
  await requireOsUser();
  
  if (repoUrl) {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) throw new Error("URL de GitHub no válida");
    
    // 1. Check if the repository already exists
    let [repo] = await db.select().from(repositories).where(eq(repositories.url, parsed.normalizedUrl)).limit(1);
    
    if (!repo) {
      // Fetch metadata from GitHub and insert it
      const ghData = await fetchGitHubRepo(repoUrl);
      [repo] = await db.insert(repositories).values({
        url: ghData.url,
        owner: ghData.owner,
        repoName: ghData.repoName,
        description: ghData.description,
        language: ghData.language,
        languageColor: ghData.languageColor,
        stars: ghData.stars,
        forks: ghData.forks,
        topics: ghData.topics,
        pushedAt: ghData.pushedAt,
        savedReason: `Asociado al proyecto por integración directa`,
      }).returning();
    }
    
    // 2. Remove existing links in entityLinks between this project and any repository
    await db.delete(entityLinks).where(
      and(
        eq(entityLinks.sourceId, projectId),
        eq(entityLinks.sourceType, "project"),
        eq(entityLinks.targetType, "repository")
      )
    );
    await db.delete(entityLinks).where(
      and(
        eq(entityLinks.targetId, projectId),
        eq(entityLinks.targetType, "project"),
        eq(entityLinks.sourceType, "repository")
      )
    );
    
    // 3. Link them in the graph
    await db.insert(entityLinks).values({
      sourceId: projectId,
      sourceType: "project",
      targetId: repo.id,
      targetType: "repository",
      relationType: "codebase"
    });
    
    // 4. Update the project record
    await db.update(projects).set({ githubRepoUrl: parsed.normalizedUrl }).where(eq(projects.id, projectId));
  } else {
    // Disconnecting:
    // 1. Remove the link from entityLinks
    await db.delete(entityLinks).where(
      and(
        eq(entityLinks.sourceId, projectId),
        eq(entityLinks.sourceType, "project"),
        eq(entityLinks.targetType, "repository")
      )
    );
    await db.delete(entityLinks).where(
      and(
        eq(entityLinks.targetId, projectId),
        eq(entityLinks.targetType, "project"),
        eq(entityLinks.sourceType, "repository")
      )
    );
    
    // 2. Clear from projects table
    await db.update(projects).set({ githubRepoUrl: null }).where(eq(projects.id, projectId));
  }
  
  revalidatePath(`/os/projects/${projectId}`);
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

export async function deleteProject(id: string) {
  await db.transaction(async (tx) => {
    // 1. Set relatedProjectId = null in knowledgeNotes
    await tx.update(knowledgeNotes).set({ relatedProjectId: null }).where(eq(knowledgeNotes.relatedProjectId, id));
    
    // 2. Delete polymorphic links (entityLinks) where project is source or target
    await tx.delete(entityLinks).where(
      or(
        and(eq(entityLinks.sourceId, id), eq(entityLinks.sourceType, "project")),
        and(eq(entityLinks.targetId, id), eq(entityLinks.targetType, "project"))
      )
    );

    // 3. Delete comments where target is project
    await tx.delete(comments).where(
      and(eq(comments.targetId, id), eq(comments.targetType, "project"))
    );

    // 4. Delete the project itself (this will cascade delete cycles, milestones, and tasks)
    await tx.delete(projects).where(eq(projects.id, id));
  });
}

export async function deleteProjectAction(id: string) {
  await requireOsUser();
  await deleteProject(id);
  revalidatePath("/os/projects");
}
