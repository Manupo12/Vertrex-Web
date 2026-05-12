"use server";
import { db } from "@/lib/db";
import { documents, documentFolders, shareTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOsUser } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/auth/permissions";
import { linkEntities } from "@/lib/db/actions/graph";
import crypto from "crypto";

export async function updateDocumentPrivacyAction(id: string, isPublic: boolean) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "documents", "write");
  await db.update(documents).set({ isPublic }).where(eq(documents.id, id));
  revalidatePath(`/os/documents/${id}`);
  revalidatePath("/os/documents");
}

export async function createFolderAction(name: string, parentId?: string) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "documents", "write");
  const [folder] = await db.insert(documentFolders).values({ name, parentId: parentId || null }).returning();
  revalidatePath("/os/documents");
  return folder;
}

export async function moveDocumentToFolderAction(docId: string, folderId?: string) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "documents", "write");
  await db.update(documents).set({ folderId: folderId || null }).where(eq(documents.id, docId));
  revalidatePath("/os/documents");
}

export async function uploadDocumentVersionAction(formData: FormData) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "documents", "write");
  const name = String(formData.get("name") || "").trim();
  const folderId = String(formData.get("folder_id") || "").trim() || null;
  const contentBase64 = String(formData.get("content_base64") || "");
  const mimeType = String(formData.get("mime_type") || "application/octet-stream");
  if (!name) throw new Error("Nombre obligatorio");

  const conditions = [eq(documents.name, name)];
  if (folderId) conditions.push(eq(documents.folderId, folderId));
  const existing = await db.select().from(documents).where(and(...conditions)).limit(1);

  if (existing.length > 0) {
    const prev = existing[0];
    const version = prev.version + 1;
    const [doc] = await db.insert(documents).values({
      name, folderId, contentBase64, mimeType, version,
      parentId: prev.id,
    }).returning();
    await linkEntities(doc.id, "document", prev.id, "document", "version_of");
    revalidatePath("/os/documents");
    return doc;
  }

  const [doc] = await db.insert(documents).values({
    name, folderId, contentBase64, mimeType, version: 1,
  }).returning();
  revalidatePath("/os/documents");
  return doc;
}

export async function createShareTokenAction(documentId: string, ttlHours: number) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "documents", "write");
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const [st] = await db.insert(shareTokens).values({ documentId, token, expiresAt }).returning();
  return st;
}

export async function revokeShareTokenAction(tokenId: string) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "documents", "write");
  await db.delete(shareTokens).where(eq(shareTokens.id, tokenId));
}
