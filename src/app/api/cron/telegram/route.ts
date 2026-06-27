import { NextResponse } from "next/server";
import { runDailyDigest } from "@/lib/telegram/run-digest";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await runDailyDigest();
    return NextResponse.json({ 
      success: true, 
      sent: result.sent, 
      sections: result.sections 
    });
  } catch (error: any) {
    console.error("Error en endpoint cron de Telegram:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Error interno del servidor" 
    }, { status: 500 });
  }
}
