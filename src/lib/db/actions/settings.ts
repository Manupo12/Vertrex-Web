"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOsSession, verifyPassword, createPasswordHash } from "@/lib/auth/session";
import { defineAction } from "@/lib/actions/define-action";

export async function changePasswordAction(currentPassword: string, newPassword: string) {
  const session = await getOsSession();
  if (!session) throw new Error("No autorizado");

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) throw new Error("Usuario no encontrado");

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new Error("La contrasena actual es incorrecta");

  if (newPassword.length < 8) throw new Error("La nueva contrasena debe tener al menos 8 caracteres");

  const newHash = await createPasswordHash(newPassword);

  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, session.userId));
  
  return { success: true };
}

export const updateUserPreferencesAction = defineAction(
  {},
  async ({ actor }, preferences: Record<string, any>) => {
    const [user] = await db.select().from(users).where(eq(users.id, actor.userId)).limit(1);
    if (!user) throw new Error("Usuario no encontrado");

    const currentPrefs = (user.preferences || {}) as Record<string, any>;
    const updatedPrefs = { ...currentPrefs, ...preferences };

    await db.update(users).set({ preferences: updatedPrefs }).where(eq(users.id, actor.userId));
    return { success: true, preferences: updatedPrefs };
  }
);
