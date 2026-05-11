"use server";
import { db } from "@/lib/db";
import { legalDocuments, legalTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOsUser } from "@/lib/auth/session";
import { linkEntities } from "@/lib/db/actions/graph";
import { logActivity } from "@/lib/activity/log";

export async function updateLegalSettingsAction(id: string, isPublic: boolean, signedAtDate: string | null) {
  await requireOsUser();
  await db.update(legalDocuments).set({
    isPublic,
    signedAt: signedAtDate ? new Date(signedAtDate) : null,
  }).where(eq(legalDocuments.id, id));
  
  revalidatePath("/os/legal");
  revalidatePath(`/os/legal/${id}`);
}

export async function createLegalTemplateAction(name: string, type: string, bodyHtml: string, variables: { key: string; label: string; required: boolean }[]) {
  await requireOsUser();
  const [template] = await db.insert(legalTemplates).values({ name, type, bodyHtml, variables }).returning();
  revalidatePath("/os/legal");
  return template;
}

export async function generateLegalFromTemplateAction(templateId: string, vars: Record<string, string>, clientId: string, projectId?: string) {
  const user = await requireOsUser();
  const [template] = await db.select().from(legalTemplates).where(eq(legalTemplates.id, templateId)).limit(1);
  if (!template) throw new Error("Plantilla no encontrada");

  let bodyHtml = template.bodyHtml;
  for (const [key, value] of Object.entries(vars)) {
    bodyHtml = bodyHtml.replace(new RegExp(`{{${key}}}`, "g"), value);
  }

  const [doc] = await db.insert(legalDocuments).values({
    name: template.name,
    type: template.type,
    templateId,
    sizeBytes: bodyHtml.length,
  }).returning();

  await linkEntities(clientId, "client", doc.id, "legal", "has_document");
  if (projectId) await linkEntities(projectId, "project", doc.id, "legal", "has_document");

  await logActivity({
    actorType: "team",
    actorId: user.userId,
    verb: "generated",
    targetType: "legal",
    targetId: doc.id,
    payload: { templateId, templateName: template.name },
  });

  revalidatePath("/os/legal");
  return doc;
}

export async function requestSignatureAction(legalId: string, clientId: string, portalUserIds: string[]) {
  const user = await requireOsUser();
  await db.update(legalDocuments).set({ requiresSignature: true }).where(eq(legalDocuments.id, legalId));

  await logActivity({
    actorType: "team",
    actorId: user.userId,
    verb: "requested_signature",
    targetType: "legal",
    targetId: legalId,
    payload: { clientId, portalUserIds },
  });

  revalidatePath(`/os/legal/${legalId}`);
}
