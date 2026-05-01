"use server";

import { getDb } from "@/lib/db";
import { tickets } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { showToast } from "@/components/ui/toast-container";

export async function updateTicketStatus(ticketId: string, status: "open" | "in_progress" | "resolved" | "closed") {
  const db = getDb();
  await db
    .update(tickets)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId));
  showToast("Estado del ticket actualizado", "success");
}

export async function updateTicket(
  ticketId: string,
  updates: {
    title?: string;
    summary?: string | null;
    status?: "open" | "in_progress" | "resolved" | "closed";
    priority?: string | null;
    assignedTo?: string | null;
  }
) {
  const db = getDb();
  
  const metadataUpdates: Record<string, unknown> = {};
  if (updates.priority !== undefined) metadataUpdates.priority = updates.priority;
  if (updates.assignedTo !== undefined) metadataUpdates.assignedTo = updates.assignedTo;
  
  await db
    .update(tickets)
    .set({
      title: updates.title,
      summary: updates.summary,
      status: updates.status,
      updatedAt: new Date(),
      metadata: sql`metadata || ${JSON.stringify(metadataUpdates)}::jsonb`,
    })
    .where(eq(tickets.id, ticketId));
  showToast("Ticket actualizado", "success");
}

export async function assignTicket(ticketId: string, assignedTo: string | null) {
  const db = getDb();
  await db
    .update(tickets)
    .set({
      updatedAt: new Date(),
      metadata: sql`metadata || ${JSON.stringify({ assignedTo })}::jsonb`,
    })
    .where(eq(tickets.id, ticketId));
  showToast(`Ticket asignado a ${assignedTo ?? "nadie"}`, "info");
}
