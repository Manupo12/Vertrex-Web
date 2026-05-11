"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";

export async function updatePortalPreferencesAction(portalUserId: string, preferences: Record<string, boolean>) {
  await db.execute(sql`ALTER TABLE client_portal_users ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb`);
  await db.execute(sql`UPDATE client_portal_users SET preferences = ${JSON.stringify(preferences)}::jsonb WHERE id = ${portalUserId}`);
  revalidatePath("/portal/[slug]/account");
  return { success: true };
}
