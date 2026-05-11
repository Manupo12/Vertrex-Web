"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { agendaEvents } from "@/lib/db/schema";
import { linkEntities } from "@/lib/db/actions/graph";
import { requireOsUser } from "@/lib/auth/session";

export async function createAgendaEventAction(formData: FormData) {
  await requireOsUser();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startsAt = String(formData.get("starts_at") || "");
  const endsAt = String(formData.get("ends_at") || "");
  const meetLink = String(formData.get("meet_link") || "").trim();
  const recurrenceRule = String(formData.get("recurrence_rule") || "none");
  const timezone = String(formData.get("timezone") || "America/Bogota");
  const reminderMinutesStr = String(formData.get("reminder_minutes") || "");
  const clientId = String(formData.get("client_id") || "").trim();
  const projectId = String(formData.get("project_id") || "").trim();

  if (!title || !startsAt || !endsAt) throw new Error("Titulo, inicio y fin son obligatorios");
  const [event] = await db.insert(agendaEvents).values({
    title, description: description || null, startsAt: new Date(startsAt), endsAt: new Date(endsAt), meetLink: meetLink || null,
    recurrenceRule, timezone,
    reminderMinutes: reminderMinutesStr ? parseInt(reminderMinutesStr) : null,
  }).returning();

  if (clientId) await linkEntities(clientId, "client", event.id, "agenda", "has_meeting");
  if (projectId) await linkEntities(projectId, "project", event.id, "agenda", "has_meeting");

  revalidatePath("/os/agenda");
  redirect(`/os/agenda`);
}

export async function connectAgendaEntityAction(eventId: string, targetId: string, targetType: "client" | "project") {
  await requireOsUser();
  await linkEntities(eventId, "agenda", targetId, targetType);
  revalidatePath("/os/agenda");
}

export async function updateAgendaEventAction(id: string, formData: FormData) {
  await requireOsUser();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startsAt = String(formData.get("starts_at") || "");
  const endsAt = String(formData.get("ends_at") || "");
  const recurrenceRule = String(formData.get("recurrence_rule") || "none");
  const timezone = String(formData.get("timezone") || "America/Bogota");
  const reminderMinutes = parseInt(String(formData.get("reminder_minutes") || ""), 10);
  const meetLink = String(formData.get("meet_link") || "").trim();

  if (!title || !startsAt || !endsAt) throw new Error("Titulo, inicio y fin son obligatorios");

  await db.update(agendaEvents).set({
    title,
    description: description || null,
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    recurrenceRule,
    timezone,
    reminderMinutes: isNaN(reminderMinutes) ? null : reminderMinutes,
    meetLink: meetLink || null,
  }).where(eq(agendaEvents.id, id));

  revalidatePath("/os/agenda");
}

export async function getUpcomingRemindersAction() {
  await requireOsUser();
  const now = new Date();
  const events = await db.select().from(agendaEvents).where(
    and(
      gt(agendaEvents.startsAt, now),
    )
  );
  return events.filter(e => {
    if (!e.reminderMinutes) return false;
    const reminderTime = new Date(e.startsAt.getTime() - e.reminderMinutes * 60 * 1000);
    return reminderTime <= now;
  });
}
