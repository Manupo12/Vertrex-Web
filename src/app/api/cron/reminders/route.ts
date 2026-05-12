import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agendaEvents } from "@/lib/db/schema";
import { and, gte, lte } from "drizzle-orm";
import { addMinutes } from "date-fns";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = now;
  const windowEnd = addMinutes(now, 5);

  const events = await db.select().from(agendaEvents).where(
    and(
      gte(agendaEvents.startsAt, windowStart),
      lte(agendaEvents.startsAt, windowEnd),
    )
  );

  const reminded: string[] = [];
  for (const event of events) {
    if (!event.reminderMinutes) continue;
    const reminderTime = new Date(event.startsAt.getTime() - event.reminderMinutes * 60000);
    if (reminderTime <= now && now <= addMinutes(reminderTime, 1)) {
      reminded.push(event.id);
    }
  }

  return NextResponse.json({ checked: events.length, reminded });
}
