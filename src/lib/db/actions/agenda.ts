"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agendaEvents } from "@/lib/db/schema";
import { linkEntities, getEntityConnections } from "@/lib/db/actions/graph";

export async function createAgendaEventAction(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startsAt = String(formData.get("starts_at") || "");
  const endsAt = String(formData.get("ends_at") || "");
  const meetLink = String(formData.get("meet_link") || "").trim();
  const clientId = String(formData.get("client_id") || "").trim();
  const projectId = String(formData.get("project_id") || "").trim();

  if (!title || !startsAt || !endsAt) throw new Error("Titulo, inicio y fin son obligatorios");
  const [event] = await db.insert(agendaEvents).values({
    title, description: description || null, startsAt: new Date(startsAt), endsAt: new Date(endsAt), meetLink: meetLink || null,
  }).returning();

  if (clientId) await linkEntities(clientId, "client", event.id, "agenda", "has_meeting");
  if (projectId) await linkEntities(projectId, "project", event.id, "agenda", "has_meeting");

  revalidatePath("/os/agenda");
  redirect(`/os/agenda`);
}

export async function connectAgendaEntityAction(eventId: string, targetId: string, targetType: "client" | "project") {
  await linkEntities(eventId, "agenda", targetId, targetType);
  revalidatePath("/os/agenda");
}
