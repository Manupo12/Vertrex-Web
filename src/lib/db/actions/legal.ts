"use server";
import { db } from "@/lib/db";
import { legalDocuments, legalTemplates, clients, clientPortalUsers } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOsUser } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/auth/permissions";
import { linkEntities } from "@/lib/db/actions/graph";
import { logActivity } from "@/lib/activity/log";
import { sendEmail } from "@/lib/email/provider";
import { renderPdf } from "@/lib/pdf/render";

export async function updateLegalSettingsAction(id: string, isPublic: boolean, signedAtDate: string | null) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "legal", "write");
  await db.update(legalDocuments).set({
    isPublic,
    signedAt: signedAtDate ? new Date(signedAtDate) : null,
  }).where(eq(legalDocuments.id, id));
  
  revalidatePath("/os/legal");
  revalidatePath(`/os/legal/${id}`);
}

export async function createLegalTemplateAction(name: string, type: string, bodyHtml: string, variables: { key: string; label: string; required: boolean }[]) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "legal", "write");
  const [template] = await db.insert(legalTemplates).values({ name, type, bodyHtml, variables }).returning();
  revalidatePath("/os/legal");
  return template;
}

export async function generateLegalFromTemplateAction(templateId: string, vars: Record<string, string>, clientId: string, projectId?: string) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "legal", "write");
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
    bodyHtml,
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
  await requireModuleAccess(user.userId, "legal", "write");

  const [legalDoc] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, legalId)).limit(1);
  if (!legalDoc) throw new Error("Documento legal no encontrado");

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) throw new Error("Cliente no encontrado");

  const pdfBytes = await renderPdf(legalDoc.bodyHtml || "<p>Sin contenido</p>", {});
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  await db.update(legalDocuments).set({ requiresSignature: true, contentBase64: pdfBase64, mimeType: "application/pdf" }).where(eq(legalDocuments.id, legalId));

  const portalUsers = portalUserIds.length > 0
    ? await db.select().from(clientPortalUsers).where(inArray(clientPortalUsers.id, portalUserIds))
    : [];

  for (const pu of portalUsers) {
    if (!pu.email) continue;
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/${client.slug}/legal/${legalId}`;
    await sendEmail({
      to: pu.email,
      subject: `Firma requerida: ${legalDoc.name}`,
      html: `<p>Hola ${pu.name},</p><p>Se requiere tu firma en el documento <strong>${legalDoc.name}</strong>.</p><p>Ingresa al portal para revisarlo y firmarlo:</p><p><a href="${portalUrl}">${portalUrl}</a></p>`,
    });
  }

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
