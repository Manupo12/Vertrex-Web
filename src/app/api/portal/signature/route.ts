import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signatures } from "@/lib/db/schema";
import { getPortalSession } from "@/lib/auth/portal";
import { logActivity } from "@/lib/activity/log";

export async function POST(request: NextRequest) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { legalId, signerName, signerEmail } = body;

  if (!signerName || typeof signerName !== "string" || signerName.trim() === "") {
    return NextResponse.json({ error: "signerName es requerido" }, { status: 400 });
  }

  if (!body.checkboxAccepted) {
    return NextResponse.json({ error: "Debe aceptar los términos" }, { status: 400 });
  }

  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
  const userAgent = request.headers.get("user-agent") || null;

  const [signature] = await db
    .insert(signatures)
    .values({
      legalId,
      signerName: signerName.trim(),
      signerEmail: signerEmail || null,
      clientId: session.clientId,
      portalUserId: session.portalUserId || null,
      ipAddress,
      userAgent,
    })
    .returning();

  await logActivity({
    actorType: "client",
    actorId: session.portalUserId || session.clientId,
    verb: "signed",
    targetType: "signature",
    targetId: signature.id,
    payload: { legalId, signerName: signerName.trim() },
  });

  return NextResponse.json(signature, { status: 201 });
}
