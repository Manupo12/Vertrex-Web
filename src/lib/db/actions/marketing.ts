"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { socialAccounts, contentPlan } from "@/lib/db/schema";
import { encrypt, decrypt } from "@/lib/security/encryption";

export async function createSocialAccountAction(formData: FormData) {
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
  const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, accountId)).limit(1);
  if (!account || !account.passwordEncrypted) throw new Error("No hay contrasena guardada");
  return { password: decrypt(account.passwordEncrypted) };
}

export async function createContentPlanAction(formData: FormData) {
  const socialAccountId = String(formData.get("social_account_id") || "");
  const title = String(formData.get("title") || "").trim();
  const contentType = String(formData.get("content_type") || "post");
  const notes = String(formData.get("notes") || "").trim();
  if (!socialAccountId || !title) throw new Error("Cuenta y titulo son obligatorios");
  await db.insert(contentPlan).values({ socialAccountId, title, contentType, notes: notes || null });
  revalidatePath(`/os/marketing`);
  revalidatePath(`/os/marketing/${socialAccountId}`);
}

export async function updateContentPlanStatusAction(id: string, status: string) {
  await db.update(contentPlan).set({ status }).where(eq(contentPlan.id, id));
  revalidatePath("/os/marketing");
}
