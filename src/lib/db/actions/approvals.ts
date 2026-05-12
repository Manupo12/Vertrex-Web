"use server";

import { db } from "@/lib/db";
import { approvals, activity } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireOsUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { getPortalSession } from "@/lib/auth/portal";
import { revalidatePath } from "next/cache";

export async function requestApprovalAction(data: {
  title: string;
  description?: string;
  targetType: string;
  targetId: string;
  clientId: string;
}) {
  const user = await requireOsUser();
  const [approval] = await db.insert(approvals).values({
    title: data.title,
    description: data.description,
    targetType: data.targetType as any,
    targetId: data.targetId,
    clientId: data.clientId,
    requestedBy: user.userId,
    status: "pending"
  }).returning();

  await logActivity({
    actorType: "team",
    actorId: user.userId,
    verb: "approved", // Verb para solicitud
    targetType: data.targetType as any,
    targetId: data.targetId,
    payload: { approvalId: approval.id }
  });

  revalidatePath(`/os/${data.targetType}s/${data.targetId}`);
  return approval;
}

export async function respondApprovalAction(id: string, status: "approved" | "changes_requested", note?: string) {
  const [approval] = await db.update(approvals).set({
    status,
    responseNote: note,
    respondedAt: new Date()
  }).where(eq(approvals.id, id)).returning();

  revalidatePath(`/portal/approvals`);
  return approval;
}

export async function respondApprovalFromPortalAction(approvalId: string, status: "approved" | "changes_requested", note?: string) {
  const session = await getPortalSession();
  if (!session) throw new Error("No autorizado");

  const [approval] = await db.select().from(approvals).where(eq(approvals.id, approvalId)).limit(1);
  if (!approval) throw new Error("Aprobación no encontrada");
  if (approval.clientId !== session.clientId) throw new Error("No autorizado para esta aprobación");

  await db.update(approvals).set({
    status,
    responseNote: note || null,
    respondedAt: new Date(),
    respondedBy: session.portalUserId || session.clientId,
  }).where(eq(approvals.id, approvalId));

  await logActivity({
    actorType: "client", actorId: session.portalUserId || session.clientId,
    verb: status === "approved" ? "approved" : "rejected",
    targetType: "approval", targetId: approvalId,
    payload: { note },
  });

  revalidatePath(`/portal/${session.slug}/approvals`);
}
