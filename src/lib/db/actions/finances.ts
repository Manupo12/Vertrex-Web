"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { finances, legalDocuments, entityLinks } from "@/lib/db/schema";
import { linkEntities } from "@/lib/db/actions/graph";
import { defineAction } from "@/lib/actions/define-action";
import { logActivity } from "@/lib/activity/log";

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

export const createFinanceAction = defineAction(
  { module: "finances", level: "write" },
  async ({ actor }, formData: FormData) => {
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
    
    const dueDateVal = dueDateStr ? new Date(dueDateStr) : null;
    const nextDueDateVal = nextDueDateStr 
      ? new Date(nextDueDateStr) 
      : (recurrence !== "none" ? (dueDateVal || new Date()) : null);

    const [finance] = await db.insert(finances).values({
      type, amountCop, concept, status,
      dueDate: dueDateVal,
      currency,
      recurrence,
      nextDueDate: nextDueDateVal,
      vatAmountCop,
      vatRate,
      invoiceNumber,
    }).returning();

    await logActivity({
      actorType: "team",
      actorId: actor.userId,
      verb: "create",
      targetType: "finance",
      targetId: finance.id,
    });

    revalidatePath("/os/finances");
    redirect(`/os/finances/${finance.id}`);
  }
);

export const markFinancePaidAction = defineAction(
  { module: "finances", level: "write", audit: { verb: "mark_paid", targetType: "finance" } },
  async ({ actor }, id: string) => {
    const [finance] = await db.select().from(finances).where(eq(finances.id, id)).limit(1);
    if (!finance) throw new Error("Finanza no encontrada");

    await db.update(finances).set({ status: "paid", paidAt: new Date() }).where(eq(finances.id, id));

    let nextDue: Date | null = null;
    if (finance.recurrence === "monthly") {
      nextDue = finance.nextDueDate ? addMonths(finance.nextDueDate, 1) : addMonths(new Date(), 1);
    } else if (finance.recurrence === "yearly") {
      nextDue = finance.nextDueDate ? addYears(finance.nextDueDate, 1) : addYears(new Date(), 1);
    }

    if (nextDue) {
      const [newFinance] = await db.insert(finances).values({
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
      }).returning();

      // Clone graph connections (entityLinks) from old finance item to the new recurrence
      const oldLinks = await db.select().from(entityLinks).where(
        or(
          and(eq(entityLinks.sourceId, finance.id), eq(entityLinks.sourceType, "finance")),
          and(eq(entityLinks.targetId, finance.id), eq(entityLinks.targetType, "finance"))
        )
      );

      if (oldLinks.length > 0) {
        const newLinks = oldLinks.map(link => {
          const isSource = link.sourceId === finance.id;
          return {
            sourceId: isSource ? newFinance.id : link.sourceId,
            sourceType: link.sourceType,
            targetId: isSource ? link.targetId : newFinance.id,
            targetType: link.targetType,
            relationType: link.relationType,
          };
        });
        await db.insert(entityLinks).values(newLinks);
      }
    }

    revalidatePath("/os/finances");
    revalidatePath(`/os/finances/${id}`);
    return finance;
  }
);

export const exportFinancesCSVAction = defineAction(
  { module: "finances", level: "read" },
  async ({ actor }) => {
    const { finances } = await import("@/lib/db/schema");
    const { desc } = await import("drizzle-orm");

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
);

export const updateFinanceAction = defineAction(
  { module: "finances", level: "write", audit: { verb: "update", targetType: "finance" } },
  async ({ actor }, id: string, formData: FormData) => {
    const type = String(formData.get("type") || "ingreso");
    const amountCop = parseInt(String(formData.get("amount_cop") || "0"), 10);
    const concept = String(formData.get("concept") || "").trim();
    const status = String(formData.get("status") || "pending");
    const dueDateStr = String(formData.get("due_date") || "");
    const recurrence = String(formData.get("recurrence") || "none");
    if (!concept || !amountCop) throw new Error("Concepto y monto son obligatorios");
    const [finance] = await db.update(finances).set({
      type, amountCop, concept, status,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      recurrence,
    }).where(eq(finances.id, id)).returning();
    revalidatePath("/os/finances");
    revalidatePath(`/os/finances/${id}`);
    return finance;
  }
);

export const deleteFinanceAction = defineAction(
  { module: "finances", level: "write" },
  async ({ actor }, id: string) => {
    await db.delete(finances).where(eq(finances.id, id));
    
    await logActivity({
      actorType: "team",
      actorId: actor.userId,
      verb: "delete",
      targetType: "finance",
      targetId: id,
    });

    revalidatePath("/os/finances");
    redirect("/os/finances");
  }
);

export const getMonthlyFinanceSummary = defineAction(
  { module: "finances", level: "read" },
  async ({ actor }) => {
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
);

export async function getFinanceById(id: string) {
  return db.select().from(finances).where(eq(finances.id, id)).limit(1).then(rows => rows[0] || null);
}

export const generateInvoiceAction = defineAction(
  { module: "finances", level: "write", audit: { verb: "generate_invoice", targetType: "legal" } },
  async ({ actor }, projectId: string, milestoneId: string | null, items: { description: string; amount: number }[]) => {
    const total = items.reduce((s, i) => s + i.amount, 0);
    const itemsHtml = items.map(i => `<tr><td>${i.description}</td><td>$${i.amount.toLocaleString("es-CO")}</td></tr>`).join("");
    const bodyHtml = `<html><body><h1>Cuenta de Cobro</h1><table>${itemsHtml}</table><h3>Total: $${total.toLocaleString("es-CO")}</h3></body></html>`;
    const [doc] = await db.insert(legalDocuments).values({
      name: `Cuenta de Cobro - ${new Date().toISOString().split("T")[0]}`,
      type: "cuenta_cobro",
      sizeBytes: bodyHtml.length,
      bodyHtml,
    }).returning();

    await linkEntities(projectId, "project", doc.id, "legal", "has_invoice");
    if (milestoneId) await linkEntities(milestoneId, "milestone", doc.id, "legal", "has_invoice");

    revalidatePath("/os/finances");
    return doc;
  }
);

export const getProjectPnLAction = defineAction(
  { module: "finances", level: "read" },
  async ({ actor }, projectId: string) => {
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
);
