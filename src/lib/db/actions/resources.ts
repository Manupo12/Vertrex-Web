"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources, resourceAccessLog, resourceFolders } from "@/lib/db/schema";
import { encrypt, decrypt } from "@/lib/security/encryption";
import { linkEntities } from "@/lib/db/actions/graph";
import { requireOsUser, requireAdminUser } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/auth/permissions";

export async function createResourceAction(formData: FormData) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "resources", "write");
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "otro");
  const value = String(formData.get("value") || "").trim();
  if (!title || !value) throw new Error("Titulo y valor son obligatorios");
  const encryptedValue = encrypt(value);
  const [resource] = await db.insert(resources).values({ title, type, encryptedValue }).returning();
  revalidatePath("/os/resources");
  return { id: resource.id, title: resource.title };
}

export async function revealResourceAction(id: string) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "resources", "read");
  const [resource] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  if (!resource) throw new Error("Recurso no encontrado");

  if (resource.visibility === "admin") {
    await requireAdminUser();
  } else if (resource.visibility === "owner") {
    if (resource.ownerId !== user.userId) throw new Error("Solo el propietario puede revelar este recurso");
  }

  await db.insert(resourceAccessLog).values({
    resourceId: id,
    actorId: user.userId,
    action: "reveal",
  });

  return { value: decrypt(resource.encryptedValue) };
}

export async function connectResourceEntityAction(resourceId: string, targetId: string, targetType: "project" | "client" | "note" | "idea") {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "resources", "write");
  await linkEntities(resourceId, "resource", targetId, targetType);
  revalidatePath(`/os/resources/${resourceId}`);
}

export async function setRotationAction(resourceId: string, rotationDueAt: string) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "resources", "write");
  await db.update(resources).set({ rotationDueAt: new Date(rotationDueAt) }).where(eq(resources.id, resourceId));
  revalidatePath(`/os/resources/${resourceId}`);
}

export async function createResourceFolderAction(name: string, parentId?: string) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "resources", "write");
  const [folder] = await db.insert(resourceFolders).values({ name, parentId: parentId || null }).returning();
  revalidatePath("/os/resources");
  return folder;
}

export async function setResourceVisibilityAction(resourceId: string, visibility: "team" | "admin" | "owner") {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "resources", "write");
  if (!["team", "admin", "owner"].includes(visibility)) throw new Error("Visibilidad invalida");
  await db.update(resources).set({ visibility }).where(eq(resources.id, resourceId));
  revalidatePath(`/os/resources/${resourceId}`);
}

export async function exportVaultAction() {
  const user = await requireAdminUser();
  const all = await db.select().from(resources);
  return all.map(r => ({
    id: r.id,
    title: r.title,
    type: r.type,
    value: decrypt(r.encryptedValue),
    visibility: r.visibility,
    ownerId: r.ownerId,
    rotationDueAt: r.rotationDueAt,
  }));
}
