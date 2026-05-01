"use server";

import { eq, and, lte, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { billingSchedules } from "@/lib/db/schema";
import { showToast } from "@/components/ui/toast-container";

export async function createBillingSchedule(data: {
  clientId: string;
  projectId?: string | null;
  label: string;
  amountCents: number;
  frequency: "monthly" | "quarterly" | "yearly";
  startDate: Date;
  endDate?: Date | null;
  nextInvoiceDate?: Date | null;
}) {
  const db = getDb();
  const [result] = await db
    .insert(billingSchedules)
    .values({
      clientId: data.clientId,
      projectId: data.projectId,
      label: data.label,
      amountCents: data.amountCents,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate,
      nextInvoiceDate: data.nextInvoiceDate ?? data.startDate,
    })
    .returning();
  showToast("Schedule creado", "success");
  return result;
}

export async function getBillingSchedules(filters?: { clientId?: string; status?: string; dueBefore?: Date }) {
  const db = getDb();
  const conditions = [];
  if (filters?.clientId) conditions.push(eq(billingSchedules.clientId, filters.clientId));
  if (filters?.status) conditions.push(eq(billingSchedules.status, filters.status));
  if (filters?.dueBefore) conditions.push(lte(billingSchedules.nextInvoiceDate, filters.dueBefore));

  return db
    .select()
    .from(billingSchedules)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
}

export async function updateBillingSchedule(
  scheduleId: string,
  data: Partial<{
    label: string;
    amountCents: number;
    frequency: string;
    status: string;
    nextInvoiceDate: Date;
  }>
) {
  const db = getDb();
  const [result] = await db
    .update(billingSchedules)
    .set({ ...data })
    .where(eq(billingSchedules.id, scheduleId))
    .returning();
  showToast("Schedule actualizado", "success");
  return result;
}

export async function deleteBillingSchedule(scheduleId: string) {
  const db = getDb();
  await db.delete(billingSchedules).where(eq(billingSchedules.id, scheduleId));
  showToast("Schedule eliminado", "info");
}
