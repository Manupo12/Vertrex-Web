"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { clientPortalUsers } from "@/lib/db/schema";
import { hashPin, generateSixDigitPin } from "@/lib/security/password";
import { requireOsUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";

export async function createPortalUserAction(
  clientId: string,
  name: string,
  email?: string,
  roleLabel?: string,
) {
  const session = await requireOsUser();
  if (!name?.trim()) throw new Error("El nombre es obligatorio");

  const pin = generateSixDigitPin();
  const pinHash = await hashPin(pin);

  const [portalUser] = await db
    .insert(clientPortalUsers)
    .values({
      clientId,
      name: name.trim(),
      email: email?.trim() || null,
      roleLabel: roleLabel?.trim() || null,
      pinHash,
      isActive: true,
    })
    .returning();

  await logActivity({
    actorType: "team",
    actorId: session.userId,
    verb: "create_portal_user",
    targetType: "client",
    targetId: clientId,
    payload: { portalUserId: portalUser.id, name, email, roleLabel },
  });

  revalidatePath(`/os/crm/${clientId}`);
  return { portalUser, pin };
}

export async function listPortalUsersAction(clientId: string) {
  await requireOsUser();
  return db
    .select()
    .from(clientPortalUsers)
    .where(eq(clientPortalUsers.clientId, clientId))
    .orderBy(desc(clientPortalUsers.createdAt));
}

export async function deactivatePortalUserAction(id: string) {
  const session = await requireOsUser();
  const [updated] = await db
    .update(clientPortalUsers)
    .set({ isActive: false })
    .where(eq(clientPortalUsers.id, id))
    .returning();
  if (!updated) throw new Error("Usuario de portal no encontrado");

  await logActivity({
    actorType: "team",
    actorId: session.userId,
    verb: "deactivate_portal_user",
    targetType: "client",
    targetId: updated.clientId,
    payload: { portalUserId: id, portalUserName: updated.name },
  });

  revalidatePath(`/os/crm/${updated.clientId}`);
}

export async function regeneratePortalPinAction(id: string) {
  const session = await requireOsUser();
  const pin = generateSixDigitPin();
  const pinHash = await hashPin(pin);

  const [updated] = await db
    .update(clientPortalUsers)
    .set({ pinHash })
    .where(eq(clientPortalUsers.id, id))
    .returning();
  if (!updated) throw new Error("Usuario de portal no encontrado");

  await logActivity({
    actorType: "team",
    actorId: session.userId,
    verb: "regenerate_portal_pin",
    targetType: "client",
    targetId: updated.clientId,
    payload: { portalUserId: id, portalUserName: updated.name },
  });

  revalidatePath(`/os/crm/${updated.clientId}`);
  return { pin };
}
