import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    status: "not_configured",
    message: "Google Calendar sync no está configurado aún para V3.0.",
    docs: "Para habilitar, configura las siguientes variables de entorno:\n" +
      "- GOOGLE_SERVICE_ACCOUNT_JSON (JSON del service account)\n" +
      "- GOOGLE_CALENDAR_ID (ID del calendario a sincronizar)\n" +
      "- CRON_SECRET (token para autenticar el cron)\n\n" +
      "El endpoint espera recibir eventos de Google Calendar y crear/actualizar registros en agenda_events.",
  });
}
