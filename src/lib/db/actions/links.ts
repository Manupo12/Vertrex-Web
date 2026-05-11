"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { repositories, links } from "@/lib/db/schema";
import { fetchGitHubRepo, fetchOpenGraph, fetchGitHubReadme, parseGitHubUrl } from "@/lib/links/service";

import { requireOsUser } from "@/lib/auth/session";

export async function saveExternalReferenceAction(url: string, savedReason?: string) {
  await requireOsUser();
  const trimmedUrl = url.trim();
  if (!trimmedUrl) throw new Error("URL es obligatoria");
  
  const githubParsed = parseGitHubUrl(trimmedUrl);
  
  if (githubParsed) {
    if (!savedReason?.trim()) throw new Error("Debes explicar que problema te resuelve este repo");
    const existing = await db.select().from(repositories).where(eq(repositories.url, githubParsed.normalizedUrl)).limit(1);
    if (existing.length > 0) throw new Error("Este repositorio ya esta guardado");
    const ghData = await fetchGitHubRepo(trimmedUrl);
    const [repo] = await db.insert(repositories).values({
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
      savedReason: savedReason.trim(),
    }).returning();
    revalidatePath("/os/links");
    return { type: "repository" as const, data: repo };
  }
  
  const existing = await db.select().from(links).where(eq(links.url, trimmedUrl)).limit(1);
  if (existing.length > 0) throw new Error("Este link ya esta guardado");
  try {
    const ogData = await fetchOpenGraph(trimmedUrl);
    const [link] = await db.insert(links).values({
      url: ogData.url,
      title: ogData.title,
      description: ogData.description,
      imageUrl: ogData.imageUrl,
      type: ogData.type,
    }).returning();
    revalidatePath("/os/links");
    return { type: "link" as const, data: link };
  } catch {
    const [link] = await db.insert(links).values({ url: trimmedUrl }).returning();
    revalidatePath("/os/links");
    return { type: "link" as const, data: link };
  }
}

export async function updateRepositoryStatusAction(id: string, status: string) {
  await requireOsUser();
  await db.update(repositories).set({ implementationStatus: status }).where(eq(repositories.id, id));
  revalidatePath("/os/links");
  revalidatePath(`/os/links/${id}`);
}

export async function updateRepositoryPriorityAction(id: string, priority: number) {
  await requireOsUser();
  const clampedPriority = Math.max(1, Math.min(5, priority));
  await db.update(repositories).set({ priority: clampedPriority }).where(eq(repositories.id, id));
  revalidatePath("/os/links");
  revalidatePath(`/os/links/${id}`);
}

export async function loadRepositoryReadmeAction(id: string) {
  await requireOsUser();
  const [repo] = await db.select().from(repositories).where(eq(repositories.id, id)).limit(1);
  if (!repo) throw new Error("Repositorio no encontrado");
  if (repo.readmeContent) return { readmeContent: repo.readmeContent };
  const readme = await fetchGitHubReadme(repo.owner, repo.repoName);
  await db.update(repositories).set({ readmeContent: readme }).where(eq(repositories.id, id));
  revalidatePath(`/os/links/${id}`);
  return { readmeContent: readme };
}

export async function getRepositoryById(id: string) {
  return db.select().from(repositories).where(eq(repositories.id, id)).limit(1).then(rows => rows[0] || null);
}

export async function getLinkById(id: string) {
  return db.select().from(links).where(eq(links.id, id)).limit(1).then(rows => rows[0] || null);
}
