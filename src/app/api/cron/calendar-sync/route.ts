import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agendaEvents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!serviceAccountJson || !calendarId) {
    return NextResponse.json({
      status: "not_configured",
      message: "Google Calendar sync no está configurado (faltan GOOGLE_SERVICE_ACCOUNT_JSON o GOOGLE_CALENDAR_ID).",
    });
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    
    // Sincronizar eventos desde hace 7 días hasta 30 días en el futuro
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 7);
    
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const items = response.data.items || [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      if (!item.id || !item.summary || !item.start?.dateTime || !item.end?.dateTime) {
        continue;
      }

      const externalId = item.id;
      const title = item.summary;
      const description = item.description || null;
      const startsAt = new Date(item.start.dateTime);
      const endsAt = new Date(item.end.dateTime);
      const meetLink = item.hangoutLink || null;
      const timezone = item.start.timeZone || "America/Bogota";

      // Buscar si el evento ya existe
      const existing = await db
        .select()
        .from(agendaEvents)
        .where(
          and(
            eq(agendaEvents.externalProvider, "google"),
            eq(agendaEvents.externalId, externalId)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null);

      if (existing) {
        await db
          .update(agendaEvents)
          .set({
            title,
            description,
            startsAt,
            endsAt,
            meetLink,
            timezone,
          })
          .where(eq(agendaEvents.id, existing.id));
        updatedCount++;
      } else {
        await db.insert(agendaEvents).values({
          title,
          description,
          startsAt,
          endsAt,
          meetLink,
          timezone,
          externalProvider: "google",
          externalId,
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      status: "success",
      synced: items.length,
      created: createdCount,
      updated: updatedCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message },
      { status: 500 }
    );
  }
}
