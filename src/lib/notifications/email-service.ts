"use server";

import { getDb } from "@/lib/db";
import { emailLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export type EmailTemplate = 
  | "welcome" 
  | "ticket_created" 
  | "ticket_updated" 
  | "invoice_generated" 
  | "invoice_paid" 
  | "project_milestone" 
  | "meeting_reminder";

export type EmailLog = {
  id: string;
  to: string;
  subject: string;
  template: EmailTemplate;
  variables: Record<string, string>;
  sentAt: Date;
  status: "pending" | "sent" | "failed";
  error?: string;
};

export async function queueEmail(data: {
  to: string;
  subject: string;
  template: EmailTemplate;
  variables: Record<string, string>;
}): Promise<EmailLog> {
  const db = getDb();
  const [result] = await db
    .insert(emailLogs)
    .values({
      to: data.to,
      subject: data.subject,
      template: data.template,
      variables: data.variables,
      sentAt: new Date(),
      status: "pending",
    })
    .returning();

  return {
    id: result.id,
    to: result.to,
    subject: result.subject,
    template: result.template as EmailTemplate,
    variables: result.variables as Record<string, string>,
    sentAt: result.sentAt,
    status: result.status as "pending" | "sent" | "failed",
    error: result.error ?? undefined,
  };
}

export async function markEmailSent(emailId: string): Promise<void> {
  const db = getDb();
  await db
    .update(emailLogs)
    .set({ status: "sent" })
    .where(eq(emailLogs.id, emailId));
}

export async function markEmailFailed(emailId: string, error: string): Promise<void> {
  const db = getDb();
  await db
    .update(emailLogs)
    .set({ status: "failed", error })
    .where(eq(emailLogs.id, emailId));
}

export async function getEmailLogs(limit = 50): Promise<EmailLog[]> {
  const db = getDb();
  const results = await db
    .select()
    .from(emailLogs)
    .orderBy(desc(emailLogs.sentAt))
    .limit(limit);

  return results.map((log) => ({
    id: log.id,
    to: log.to,
    subject: log.subject,
    template: log.template as EmailTemplate,
    variables: log.variables as Record<string, string>,
    sentAt: log.sentAt,
    status: log.status as "pending" | "sent" | "failed",
    error: log.error ?? undefined,
  }));
}

export async function getPendingEmails(): Promise<EmailLog[]> {
  const db = getDb();
  const results = await db
    .select()
    .from(emailLogs)
    .where(eq(emailLogs.status, "pending"))
    .orderBy(desc(emailLogs.sentAt));

  return results.map((log) => ({
    id: log.id,
    to: log.to,
    subject: log.subject,
    template: log.template as EmailTemplate,
    variables: log.variables as Record<string, string>,
    sentAt: log.sentAt,
    status: log.status as "pending" | "sent" | "failed",
    error: log.error ?? undefined,
  }));
}

export function getEmailPreview(template: EmailTemplate, variables: Record<string, string>): string {
  const templates: Record<EmailTemplate, string> = {
    welcome: `Bienvenido a Vertrex, {{name}}!\n\nTu cuenta ha sido creada exitosamente.`,
    ticket_created: `Nuevo ticket #{{ticketId}}\n\nTítulo: {{title}}\nEstado: {{status}}`,
    ticket_updated: `Ticket #{{ticketId}} actualizado\n\nNuevo estado: {{status}}\nComentario: {{comment}}`,
    invoice_generated: `Factura {{invoiceNumber}} generada\n\nMonto: {{amount}}\nVencimiento: {{dueDate}}`,
    invoice_paid: `Pago recibido - Factura {{invoiceNumber}}\n\nGracias por tu pago de {{amount}}.`,
    project_milestone: `Milestone alcanzado\n\nProyecto: {{projectName}}\nMilestone: {{milestoneName}}`,
    meeting_reminder: `Recordatorio de reunión\n\nTítulo: {{title}}\nFecha: {{date}}\nHora: {{time}}`,
  };

  let content = templates[template] ?? "Contenido del email";
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
  });
  
  return content;
}
