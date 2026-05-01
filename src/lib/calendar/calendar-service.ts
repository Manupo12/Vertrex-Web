"use server";

import { getDb } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { showToast } from "@/components/ui/toast-container";

export async function updateEvent(
  eventId: string,
  updates: {
    title?: string;
    description?: string | null;
    kind?: string;
    location?: string | null;
    meetUrl?: string | null;
    startsAt?: Date;
    endsAt?: Date;
  }
) {
  const db = getDb();
  await db
    .update(calendarEvents)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(calendarEvents.id, eventId));
  showToast("Evento actualizado", "success");
}
