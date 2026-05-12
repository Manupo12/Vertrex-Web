"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { finances, legalDocuments, entityLinks } from "@/lib/db/schema";
import { requireOsUser } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/auth/permissions";
import { linkEntities } from "@/lib/db/actions/graph";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(date: Date, years: number) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export async function createFinanceAction(formData: FormData) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "finances", "write");
  const type = String(formData.get("type") || "ingreso");
  const amountCop = parseInt(String(formData.get("amount_cop") || "0"), 10);
  const concept = String(formData.get("concept") || "").trim();
  const status = String(formData.get("status") || "pending");
  const dueDateStr = String(formData.get("due_date") || "");
  const currency = String(formData.get("currency") || "COP");
  const recurrence = String(formData.get("recurrence") || "none");
  const nextDueDateStr = String(formData.get("next_due_date") || "");
  const vatAmountCop = parseInt(String(formData.get("vat_amount_cop") || "0"), 10);
  const vatRate = parseInt(String(formData.get("vat_rate") || "0"), 10);
  const invoiceNumber = String(formData.get("invoice_number") || "").trim() || null;

  if (!concept || !amountCop) throw new Error("Concepto y monto son obligatorios");
  const [finance] = await db.insert(finances).values({
    type, amountCop, concept, status,
    dueDate: dueDateStr ? new Date(dueDateStr) : null,
    currency,
    recurrence,
    nextDueDate: nextDueDateStr ? new Date(nextDueDateStr) : null,
    vatAmountCop,
    vatRate,
    invoiceNumber,
  }).returning();
  revalidatePath("/os/finances");
  redirect(`/os/finances/${finance.id}`);
}

export async function markFinancePaidAction(id: string) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "finances", "write");
  const [finance] = await db.select().from(finances).where(eq(finances.id, id)).limit(1);
  if (!finance) throw new Error("Finanza no encontrada");

  await db.update(finances).set({ status: "paid", paidAt: new Date() }).where(eq(finances.id, id));

  if (finance.recurrence === "monthly") {
    const nextDue = finance.nextDueDate ? addMonths(finance.nextDueDate, 1) : addMonths(new Date(), 1);
    await db.insert(finances).values({
      type: finance.type,
      amountCop: finance.amountCop,
      concept: finance.concept,
      status: "pending",
      currency: finance.currency,
      recurrence: finance.recurrence,
      nextDueDate: nextDue,
      vatAmountCop: finance.vatAmountCop,
      vatRate: finance.vatRate,
      invoiceNumber: finance.invoiceNumber,
      dueDate: nextDue,
    });
  } else if (finance.recurrence === "yearly") {
    const nextDue = finance.nextDueDate ? addYears(finance.nextDueDate, 1) : addYears(new Date(), 1);
    await db.insert(finances).values({
      type: finance.type,
      amountCop: finance.amountCop,
      concept: finance.concept,
      status: "pending",
      currency: finance.currency,
      recurrence: finance.recurrence,
      nextDueDate: nextDue,
      vatAmountCop: finance.vatAmountCop,
      vatRate: finance.vatRate,
      invoiceNumber: finance.invoiceNumber,
      dueDate: nextDue,
    });
  }

  revalidatePath("/os/finances");
  revalidatePath(`/os/finances/${id}`);
}

export async function exportFinancesCSVAction() {
  const { db } = await import("@/lib/db");
  const { finances } = await import("@/lib/db/schema");
  const { desc } = await import("drizzle-orm");
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "finances", "read");

  const all = await db.select().from(finances).orderBy(desc(finances.createdAt));

  const headers = ["Tipo", "Concepto", "Monto COP", "Moneda", "Estado", "Vencimiento", "Pagado", "Recurrencia", "IVA", "Factura"];
  const rows = all.map(f => [
    f.type,
    `"${(f.concept || "").replace(/"/g, '""')}"`,
    String(f.amountCop),
    f.currency || "COP",
    f.status,
    f.dueDate ? new Date(f.dueDate).toISOString().split("T")[0] : "",
    f.paidAt ? new Date(f.paidAt).toISOString().split("T")[0] : "",
    f.recurrence || "none",
    String(f.vatAmountCop || 0),
    f.invoiceNumber || "",
  ]);

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  return csv;
}

export async function updateFinanceAction(id: string, formData: FormData) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "finances", "write");
  const type = String(formData.get("type") || "ingreso");
  const amountCop = parseInt(String(formData.get("amount_cop") || "0"), 10);
  const concept = String(formData.get("concept") || "").trim();
  const status = String(formData.get("status") || "pending");
  const dueDateStr = String(formData.get("due_date") || "");
  if (!concept || !amountCop) throw new Error("Concepto y monto son obligatorios");
  await db.update(finances).set({
    type, amountCop, concept, status,
    dueDate: dueDateStr ? new Date(dueDateStr) : null,
  }).where(eq(finances.id, id));
  revalidatePath("/os/finances");
  revalidatePath(`/os/finances/${id}`);
}

export async function deleteFinanceAction(id: string) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "finances", "write");
  await db.delete(finances).where(eq(finances.id, id));
  revalidatePath("/os/finances");
  redirect("/os/finances");
}

export async function getMonthlyFinanceSummary() {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "finances", "read");
  const all = await db.select().from(finances);
  const now = new Date();
  const thisMonth = all.filter(f => {
    const d = f.paidAt || f.createdAt;
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const ingresos = thisMonth.filter(f => f.type === "ingreso").reduce((s, f) => s + f.amountCop, 0);
  const gastos = thisMonth.filter(f => f.type === "gasto").reduce((s, f) => s + f.amountCop, 0);
  const pendientes = thisMonth.filter(f => f.status === "pending").length;
  return { ingresos, gastos, neto: ingresos - gastos, pendientes };
}

export async function getFinanceById(id: string) {
  return db.select().from(finances).where(eq(finances.id, id)).limit(1).then(rows => rows[0] || null);
}

export async function generateInvoiceAction(projectId: string, milestoneId: string | null, items: { description: string; amount: number }[]) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "finances", "write");
  const total = items.reduce((s, i) => s + i.amount, 0);
  const itemsHtml = items.map(i => `<tr><td>${i.description}</td><td>$${i.amount.toLocaleString("es-CO")}</td></tr>`).join("");
  const bodyHtml = `<html><body><h1>Cuenta de Cobro</h1><table>${itemsHtml}</table><h3>Total: $${total.toLocaleString("es-CO")}</h3></body></html>`;
  const [doc] = await db.insert(legalDocuments).values({
    name: `Cuenta de Cobro - ${new Date().toISOString().split("T")[0]}`,
    type: "cuenta_cobro",
    sizeBytes: bodyHtml.length,
  }).returning();

  await linkEntities(projectId, "project", doc.id, "legal", "has_invoice");
  if (milestoneId) await linkEntities(milestoneId, "milestone", doc.id, "legal", "has_invoice");

  revalidatePath("/os/finances");
  return doc;
}

export async function getProjectPnLAction(projectId: string) {
  const user = await requireOsUser();
  await requireModuleAccess(user.userId, "finances", "read");
  const linked = await db.select().from(entityLinks).where(
    and(
      eq(entityLinks.sourceId, projectId),
      eq(entityLinks.sourceType, "project"),
      eq(entityLinks.targetType, "finance")
    )
  );
  const financeIds = linked.map(l => l.targetId);
  if (financeIds.length === 0) return { income: 0, expenses: 0, margin: 0, count: 0 };

  const all = await db.select().from(finances).where(inArray(finances.id, financeIds));
  const income = all.filter(f => f.type === "ingreso").reduce((s, f) => s + f.amountCop, 0);
  const expenses = all.filter(f => f.type === "gasto").reduce((s, f) => s + f.amountCop, 0);
  const margin = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  return { income, expenses, margin, count: all.length };
}
