import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agendaEvents, users } from "@/lib/db/schema";
import { and, gte, lte } from "drizzle-orm";
import { addMinutes } from "date-fns";
import { pushNotification } from "@/lib/notifications/service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const events = await db.select().from(agendaEvents).where(
    and(
      gte(agendaEvents.startsAt, now),
      lte(agendaEvents.startsAt, addMinutes(now, 1440)), // 24 hours
    )
  );

  const reminded: string[] = [];
  const allUsers = await db.select().from(users);

  for (const event of events) {
    if (!event.reminderMinutes) continue;
    const reminderTime = new Date(event.startsAt.getTime() - event.reminderMinutes * 60000);
    const diffMin = (now.getTime() - reminderTime.getTime()) / 60000;
    
    // Check if we are within a 2-minute window of the reminder time
    if (diffMin >= 0 && diffMin <= 2) {
      for (const u of allUsers) {
        await pushNotification({
          userId: u.id,
          type: "reminder",
          title: `Recordatorio: ${event.title}`,
          body: `El evento "${event.title}" comienza en ${event.reminderMinutes} minutos.`,
          targetType: "agenda",
          targetId: event.id,
          sendEmail: true
        });
      }
      reminded.push(event.id);
    }
  }

  return NextResponse.json({ checked: events.length, reminded });
}
