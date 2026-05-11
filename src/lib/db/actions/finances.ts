"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { finances } from "@/lib/db/schema";
import { requireOsUser } from "@/lib/auth/session";

export async function createFinanceAction(formData: FormData) {
  await requireOsUser();
  const type = String(formData.get("type") || "ingreso");
  const amountCop = parseInt(String(formData.get("amount_cop") || "0"), 10);
  const concept = String(formData.get("concept") || "").trim();
  const status = String(formData.get("status") || "pending");
  const dueDateStr = String(formData.get("due_date") || "");
  if (!concept || !amountCop) throw new Error("Concepto y monto son obligatorios");
  const [finance] = await db.insert(finances).values({
    type, amountCop, concept, status,
    dueDate: dueDateStr ? new Date(dueDateStr) : null,
  }).returning();
  revalidatePath("/os/finances");
  redirect(`/os/finances/${finance.id}`);
}

export async function markFinancePaidAction(id: string) {
  await requireOsUser();
  await db.update(finances).set({ status: "paid", paidAt: new Date() }).where(eq(finances.id, id));
  revalidatePath("/os/finances");
  revalidatePath(`/os/finances/${id}`);
}

export async function getMonthlyFinanceSummary() {
  await requireOsUser();
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