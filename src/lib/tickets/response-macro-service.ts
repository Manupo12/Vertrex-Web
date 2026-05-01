"use server";

import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { responseMacros } from "@/lib/db/schema";
import { showToast } from "@/components/ui/toast-container";

export async function createMacro(data: { title: string; content: string; category?: string }) {
  const db = getDb();
  const [result] = await db
    .insert(responseMacros)
    .values({
      title: data.title,
      content: data.content,
      category: data.category ?? "general",
    })
    .returning();
  showToast("Macro creada", "success");
  return result;
}

export async function getMacros(category?: string) {
  const db = getDb();
  if (category) {
    return db.select().from(responseMacros).where(eq(responseMacros.category, category)).orderBy(desc(responseMacros.createdAt));
  }
  return db.select().from(responseMacros).orderBy(desc(responseMacros.createdAt));
}

export async function deleteMacro(macroId: string) {
  const db = getDb();
  await db.delete(responseMacros).where(eq(responseMacros.id, macroId));
  showToast("Macro eliminada", "info");
}
