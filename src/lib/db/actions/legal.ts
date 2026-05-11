"use server";
import { db } from "@/lib/db";
import { legalDocuments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOsUser } from "@/lib/auth/session";

export async function updateLegalSettingsAction(id: string, isPublic: boolean, signedAtDate: string | null) {
  await requireOsUser();
  await db.update(legalDocuments).set({
    isPublic,
    signedAt: signedAtDate ? new Date(signedAtDate) : null,
  }).where(eq(legalDocuments.id, id));
  
  revalidatePath("/os/legal");
  revalidatePath(`/os/legal/${id}`);
}