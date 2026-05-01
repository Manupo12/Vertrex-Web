"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { clientContacts } from "@/lib/db/schema";
import { showToast } from "@/components/ui/toast-container";

export type ClientContactRole = "primary" | "billing" | "technical" | "approver";

export async function createContact(
  clientId: string,
  data: {
    name: string;
    email?: string | null;
    phone?: string | null;
    role?: ClientContactRole;
  }
) {
  const db = getDb();
  const [result] = await db
    .insert(clientContacts)
    .values({
      clientId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role ?? "primary",
    })
    .returning();
  showToast("Contacto creado", "success");
  return result;
}

export async function updateContact(
  contactId: string,
  data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    role?: ClientContactRole;
  }
) {
  const db = getDb();
  const [result] = await db
    .update(clientContacts)
    .set({
      ...data,
    })
    .where(eq(clientContacts.id, contactId))
    .returning();
  showToast("Contacto actualizado", "success");
  return result;
}

export async function deleteContact(contactId: string) {
  const db = getDb();
  await db.delete(clientContacts).where(eq(clientContacts.id, contactId));
  showToast("Contacto eliminado", "info");
}

export async function getContactsByClient(clientId: string) {
  const db = getDb();
  return db.select().from(clientContacts).where(eq(clientContacts.clientId, clientId));
}
