"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { socialAccounts, contentPlan, marketingHashtags } from "@/lib/db/schema";
import { encrypt, decrypt } from "@/lib/security/encryption";
import { requireOsUser } from "@/lib/auth/session";

export async function createSocialAccountAction(formData: FormData) {
  await requireOsUser();
  const platform = String(formData.get("platform") || "").trim();
  const handle = String(formData.get("handle") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  if (!platform || !handle) throw new Error("Plataforma y handle son obligatorios");
  const passwordEncrypted = password ? encrypt(password) : null;
  const [account] = await db.insert(socialAccounts).values({ platform, handle, email: email || null, passwordEncrypted, notes: notes || null }).returning();
  revalidatePath("/os/marketing");
  redirect(`/os/marketing/${account.id}`);
}

export async function revealSocialPasswordAction(accountId: string) {
  await requireOsUser();
  const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, accountId)).limit(1);
  if (!account || !account.passwordEncrypted) throw new Error("No hay contrasena guardada");
  return { password: decrypt(account.passwordEncrypted) };
}

export async function createContentPlanAction(formData: FormData) {
  await requireOsUser();
  const socialAccountId = String(formData.get("social_account_id") || "");
  const title = String(formData.get("title") || "").trim();
  const contentType = String(formData.get("content_type") || "post");
  const scheduledAtStr = String(formData.get("scheduled_at") || "");
  const notes = String(formData.get("notes") || "").trim();
  
  if (!socialAccountId || !title) throw new Error("Cuenta y titulo son obligatorios");
  
  await db.insert(contentPlan).values({ 
    socialAccountId, 
    title, 
    contentType, 
    notes: notes || null,
    scheduledAt: scheduledAtStr ? new Date(scheduledAtStr) : null
  });
  
  revalidatePath(`/os/marketing`);
  revalidatePath(`/os/marketing/${socialAccountId}`);
}

export async function updateContentPlanStatusAction(id: string, status: string) {
  await requireOsUser();
  if (!["idea", "en_produccion", "listo", "publicado"].includes(status)) {
    throw new Error("Estado invalido");
  }
  await db.update(contentPlan).set({ status }).where(eq(contentPlan.id, id));
  revalidatePath("/os/marketing");
}

export async function updateSocialAccountStatsAction(id: string, formData: FormData) {
  await requireOsUser();
  const followersCount = parseInt(String(formData.get("followersCount") || "0"));
  const reachCount = parseInt(String(formData.get("reachCount") || "0"));
  
  await db.update(socialAccounts).set({ followersCount, reachCount }).where(eq(socialAccounts.id, id));
  revalidatePath(`/os/marketing/${id}`);
}

export async function createHashtagAction(label: string, tags: string[], accountId: string) {
  await requireOsUser();
  const [ht] = await db.insert(marketingHashtags).values({ label, tags, accountId }).returning();
  revalidatePath("/os/marketing");
  return ht;
}

export async function deleteHashtagAction(id: string) {
  await requireOsUser();
  await db.delete(marketingHashtags).where(eq(marketingHashtags.id, id));
  revalidatePath("/os/marketing");
}

export async function updateContentPlanEngagementAction(id: string, reach: number, likes: number, comments: number, saves: number) {
  await requireOsUser();
  await db.update(contentPlan).set({ reach, likes, comments, saves }).where(eq(contentPlan.id, id));
  revalidatePath("/os/marketing");
}

export async function listHashtagsAction(accountId?: string) {
  await requireOsUser();
  if (accountId) {
    return db.select().from(marketingHashtags).where(eq(marketingHashtags.accountId, accountId));
  }
  return db.select().from(marketingHashtags);
}

export async function updateHashtagAction(id: string, data: { label?: string; tags?: string[]; accountId?: string }) {
  await requireOsUser();
  const updateData: any = {};
  if (data.label !== undefined) updateData.label = data.label;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.accountId !== undefined) updateData.accountId = data.accountId;
  await db.update(marketingHashtags).set(updateData).where(eq(marketingHashtags.id, id));
  revalidatePath("/os/marketing/hashtags");
  revalidatePath("/os/marketing");
}
