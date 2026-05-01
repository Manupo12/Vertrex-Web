import { eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured, schema } from "@/lib/db";

export async function createSignature({
  documentId,
  userId,
  ipAddress,
  confirmationContext,
  snapshotHash,
}: {
  documentId: string;
  userId?: string | null;
  ipAddress?: string | null;
  confirmationContext: string;
  snapshotHash?: string | null;
}) {
  if (!isDatabaseConfigured()) return null;
  const db = getDb();
  const [row] = await db
    .insert(schema.documentSignatures)
    .values({
      documentId,
      userId: userId ?? null,
      ipAddress: ipAddress ?? null,
      confirmationContext,
      snapshotHash: snapshotHash ?? null,
    })
    .returning();
  return row;
}

export async function getSignaturesByDocument(documentId: string) {
  if (!isDatabaseConfigured()) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.documentSignatures)
    .where(eq(schema.documentSignatures.documentId, documentId));
  return rows;
}
