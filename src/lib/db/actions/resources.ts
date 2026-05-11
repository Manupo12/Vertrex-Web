"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema";
import { encrypt, decrypt } from "@/lib/security/encryption";
import { linkEntities } from "@/lib/db/actions/graph";
import { requireOsUser } from "@/lib/auth/session";

export async function createResourceAction(formData: FormData) {
  await requireOsUser();
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "otro");
  const value = String(formData.get("value") || "").trim();
  if (!title || !value) throw new Error("Titulo y valor son obligatorios");
  const encryptedValue = encrypt(value);
  const [resource] = await db.insert(resources).values({ title, type, encryptedValue }).returning();
  revalidatePath("/os/resources");
  return resource;
}

export async function revealResourceAction(id: string) {
  await requireOsUser();
  const [resource] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  if (!resource) throw new Error("Recurso no encontrado");
  return { value: decrypt(resource.encryptedValue) };
}

export async function connectResourceEntityAction(resourceId: string, targetId: string, targetType: "project" | "client" | "note" | "idea") {
  await requireOsUser();
  await linkEntities(resourceId, "resource", targetId, targetType);
  revalidatePath(`/os/resources/${resourceId}`);
}
