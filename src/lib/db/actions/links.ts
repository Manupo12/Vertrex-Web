"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { repositories, links, linkCollections } from "@/lib/db/schema";
import { fetchGitHubRepo, fetchOpenGraph, fetchGitHubReadme, parseGitHubUrl } from "@/lib/links/service";

import { requireOsUser } from "@/lib/auth/session";

export async function saveExternalReferenceAction(
  url: string, 
  savedReason?: string, 
  collectionId?: string | null,
  customTitle?: string,
  customDescription?: string
) {
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
      description: customDescription || ghData.description,
      language: ghData.language,
      languageColor: ghData.languageColor,
      stars: ghData.stars,
      forks: ghData.forks,
      topics: ghData.topics,
      pushedAt: ghData.pushedAt,
      savedReason: savedReason.trim(),
      collectionId: collectionId || null,
    }).returning();
    revalidatePath("/os/links");
    return { type: "repository" as const, data: repo };
  }
  
  const existing = await db.select().from(links).where(eq(links.url, trimmedUrl)).limit(1);
  if (existing.length > 0) throw new Error("Este link ya esta guardado");

  let title = customTitle?.trim() || null;
  let description = customDescription?.trim() || null;
  let imageUrl = null;
  let type = "otro";

  try {
    const ogData = await fetchOpenGraph(trimmedUrl);
    if (!title) title = ogData.title;
    if (!description) description = ogData.description;
    imageUrl = ogData.imageUrl;
    type = ogData.type;
  } catch {
    const host = new URL(trimmedUrl).hostname.replace("www.", "");
    const lastPart = trimmedUrl.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") || host;
    if (!title) title = `${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)} | ${host}`;
    if (!description) description = "Enlace guardado de forma rápida";
    imageUrl = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  }

  const [link] = await db.insert(links).values({
    url: trimmedUrl,
    title: title || trimmedUrl,
    description: description,
    imageUrl: imageUrl,
    type: type,
    savedReason: savedReason?.trim() || null,
    collectionId: collectionId || null,
  }).returning();
  revalidatePath("/os/links");
  return { type: "link" as const, data: link };
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

export async function updateLinkReadingStatusAction(linkId: string, status: "triage" | "to_read" | "reading" | "done") {
  await requireOsUser();
  if (!["triage", "to_read", "reading", "done"].includes(status)) throw new Error("Estado invalido");
  await db.update(links).set({ readingStatus: status }).where(eq(links.id, linkId));
  revalidatePath("/os/links");
}

export async function updateRepoReadingStatusAction(repoId: string, status: string) {
  await requireOsUser();
  await db.update(repositories).set({ implementationStatus: status }).where(eq(repositories.id, repoId));
  revalidatePath("/os/links");
}

export async function createCollectionAction(name: string, description?: string) {
  await requireOsUser();
  const [collection] = await db.insert(linkCollections).values({ name, description: description || null }).returning();
  revalidatePath("/os/links");
  return collection;
}

export async function quickSaveAction(url: string, savedReason?: string, collectionId?: string | null) {
  await requireOsUser();
  return saveExternalReferenceAction(url, savedReason, collectionId);
}

export async function updateExternalReferenceAction(id: string, type: "repo" | "link", data: { title?: string; description?: string; savedReason?: string; collectionId?: string | null }) {
  await requireOsUser();
  if (type === "repo") {
    await db.update(repositories).set({
      savedReason: data.savedReason || "",
      collectionId: data.collectionId || null,
    }).where(eq(repositories.id, id));
  } else {
    await db.update(links).set({
      title: data.title || null,
      description: data.description || null,
      savedReason: data.savedReason || null,
      collectionId: data.collectionId || null,
    }).where(eq(links.id, id));
  }
  revalidatePath("/os/links");
  revalidatePath(`/os/links/${id}`);
}

export async function deleteExternalReferenceAction(id: string, type: "repo" | "link") {
  await requireOsUser();
  if (type === "repo") {
    await db.delete(repositories).where(eq(repositories.id, id));
  } else {
    await db.delete(links).where(eq(links.id, id));
  }
  revalidatePath("/os/links");
}
