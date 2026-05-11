"use server";
import { db } from "@/lib/db";
import { savedViews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireOsUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function createSavedViewAction(name: string, route: string, queryJson: Record<string, unknown>) {
  const user = await requireOsUser();
  const [view] = await db.insert(savedViews).values({
    ownerId: user.userId,
    name,
    route,
    queryJson,
  }).returning();
  revalidatePath(route);
  return view;
}

export async function updateSavedViewAction(id: string, data: { name?: string; queryJson?: Record<string, unknown>; isShared?: boolean }) {
  await requireOsUser();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.queryJson !== undefined) updateData.queryJson = data.queryJson;
  if (data.isShared !== undefined) updateData.isShared = data.isShared;
  await db.update(savedViews).set(updateData).where(eq(savedViews.id, id));
  revalidatePath("/os");
}

export async function deleteSavedViewAction(id: string) {
  await requireOsUser();
  await db.delete(savedViews).where(eq(savedViews.id, id));
  revalidatePath("/os");
}

export async function listSavedViewsAction(route: string) {
  const user = await requireOsUser();
  return db.select().from(savedViews).where(and(eq(savedViews.ownerId, user.userId), eq(savedViews.route, route)));
}
