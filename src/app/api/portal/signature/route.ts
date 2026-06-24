import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signatures, legalDocuments, entityLinks } from "@/lib/db/schema";
import { getPortalSession } from "@/lib/auth/portal";
import { logActivity } from "@/lib/activity/log";
import { renderPdf } from "@/lib/pdf/render";
import { eq, and, or } from "drizzle-orm";
import crypto from "crypto";

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

  const [legalDoc] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, legalId)).limit(1);
  if (!legalDoc) {
    return NextResponse.json({ error: "Documento legal no encontrado" }, { status: 404 });
  }

  // Verificar que el documento legal pertenece a este cliente
  const connections = await db.select()
    .from(entityLinks)
    .where(
      or(
        and(eq(entityLinks.sourceId, session.clientId), eq(entityLinks.targetId, legalId)),
        and(eq(entityLinks.targetId, session.clientId), eq(entityLinks.sourceId, legalId))
      )
    )
    .limit(1);

  if (connections.length === 0) {
    return NextResponse.json({ error: "No autorizado para este documento" }, { status: 403 });
  }

  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
  const userAgent = request.headers.get("user-agent") || null;

  // Generar evidencia de firma digital
  const signatureTime = new Date();
  const evidenceHtml = `${legalDoc.bodyHtml || ""}<br/><hr/><p><b>Evidencia de Firma Digital:</b></p><ul><li>Firmante: ${signerName.trim()}</li><li>Email: ${signerEmail || "N/A"}</li><li>Fecha: ${signatureTime.toISOString()}</li><li>Dirección IP: ${ipAddress || "N/A"}</li><li>Navegador: ${userAgent || "N/A"}</li></ul>`;

  const pdfBytes = await renderPdf(evidenceHtml, {});
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  const pdfHash = crypto.createHash("sha256").update(pdfBytes).digest("hex");
  const pdfUrl = `/api/documents/${legalId}`; // URL para descargar el PDF

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
      pdfHash,
      pdfUrl,
    })
    .returning();

  // Actualizar documento legal
  await db
    .update(legalDocuments)
    .set({
      signedAt: signatureTime,
      contentBase64: pdfBase64,
      bodyHtml: evidenceHtml,
    })
    .where(eq(legalDocuments.id, legalId));

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
