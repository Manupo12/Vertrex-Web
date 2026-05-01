"use server";

import { getDb } from "@/lib/db";
import { transactions, invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { WorkspaceInvoiceStatusValue } from "@/lib/ops/status-catalog";
import { showToast } from "@/components/ui/toast-container";

export async function updateTransaction(
  transactionId: string,
  updates: {
    type?: "income" | "expense";
    amountCents?: number;
    category?: string | null;
    description?: string | null;
  }
) {
  const db = getDb();
  await db
    .update(transactions)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, transactionId));
  showToast("Transacción actualizada", "success");
}

export async function updateInvoice(
  invoiceId: string,
  updates: {
    label?: string;
    invoiceNumber?: string;
    amountCents?: number;
    status?: WorkspaceInvoiceStatusValue;
    dueLabel?: string | null;
  }
) {
  const db = getDb();
  await db
    .update(invoices)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));
  showToast("Factura actualizada", "success");
}

export async function advanceInvoiceStatus(invoiceId: string, newStatus: WorkspaceInvoiceStatusValue) {
  const db = getDb();
  await db
    .update(invoices)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));
  showToast(`Factura → ${newStatus}`, "success");
}
