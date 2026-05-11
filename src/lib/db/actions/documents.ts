"use server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOsUser } from "@/lib/auth/session";

export async function updateDocumentPrivacyAction(id: string, isPublic: boolean) {
  await requireOsUser();
  await db.update(documents).set({ isPublic }).where(eq(documents.id, id));
  revalidatePath(`/os/documents/${id}`);
  revalidatePath("/os/documents");
}
