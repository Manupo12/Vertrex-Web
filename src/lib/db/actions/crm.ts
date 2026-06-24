"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, clientPortalUsers } from "@/lib/db/schema";
import { hashPin, generateSixDigitPin } from "@/lib/security/password";
import { getEntityConnections } from "@/lib/db/actions/graph";
import { requireOsUser } from "@/lib/auth/session";

export async function createClientAction(formData: FormData) {
  await requireOsUser();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  let slug = String(formData.get("slug") || "").trim();
  if (!name) throw new Error("El nombre es obligatorio");
  if (!slug) slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  
  const pin = generateSixDigitPin();
  const pinHash = await hashPin(pin);
  
  const [client] = await db.insert(clients).values({ name, slug, email: email || null, phone: phone || null, pinHash }).returning();
  
  if (email) {
    await db.insert(clientPortalUsers).values({
      clientId: client.id,
      name,
      email,
      roleLabel: "Contacto principal",
      pinHash,
      isActive: true,
    });
  }
  
  revalidatePath("/os/crm");
  redirect(`/os/crm/${client.slug}?pin=${pin}`);
}

export async function generateClientPinAction(slug: string) {
  await requireOsUser();
  const pin = generateSixDigitPin();
  const pinHash = await hashPin(pin);
  const [updated] = await db.update(clients).set({ pinHash }).where(eq(clients.slug, slug)).returning();
  if (!updated) throw new Error("Cliente no encontrado");
  revalidatePath(`/os/crm/${slug}`);
  return { pin };
}

export async function updateClientAction(slug: string, formData: FormData) {
  await requireOsUser();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const status = String(formData.get("status") || "active");
  if (!name) throw new Error("El nombre es obligatorio");
  await db.update(clients).set({ name, email: email || null, phone: phone || null, status }).where(eq(clients.slug, slug));
  revalidatePath(`/os/crm/${slug}`);
  revalidatePath("/os/crm");
}

export async function getClientBySlug(slug: string) {
  await requireOsUser();
  return db.select().from(clients).where(eq(clients.slug, slug)).limit(1).then(rows => rows[0] || null);
}

export async function bulkDeleteClientsAction(ids: string[]) {
  await requireOsUser();
  await db.delete(clients).where(inArray(clients.id, ids));
  revalidatePath("/os/crm");
}

export async function getClientGraphSummary(slug: string) {
  const client = await getClientBySlug(slug);
  if (!client) return null;
  const connections = await getEntityConnections(client.id);
  return { client, connections };
}
