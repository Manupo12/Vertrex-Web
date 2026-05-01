import { eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured, schema } from "@/lib/db";

export async function createFolder({
  name,
  parentId,
  description,
}: {
  name: string;
  parentId?: string | null;
  description?: string | null;
}) {
  if (!isDatabaseConfigured()) return null;
  const db = getDb();
  const [row] = await db
    .insert(schema.fileFolders)
    .values({ name, parentId: parentId ?? null, description: description ?? null })
    .returning();
  return row;
}

export async function getFolders(parentId?: string | null) {
  if (!isDatabaseConfigured()) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.fileFolders)
    .where(parentId ? eq(schema.fileFolders.parentId, parentId) : eq(schema.fileFolders.parentId, ""));
  return rows;
}
