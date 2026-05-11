"use server";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireOsUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function markNotificationReadAction(id: string) {
  const user = await requireOsUser();
  await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
  revalidatePath("/os/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireOsUser();
  await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.userId, user.userId));
  revalidatePath("/os/notifications");
}
