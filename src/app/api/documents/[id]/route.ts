import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { getOsSession } = await import("@/lib/auth/session");
  const { getPortalSession } = await import("@/lib/auth/portal");
  const { entityLinks } = await import("@/lib/db/schema");
  const { or, and } = await import("drizzle-orm");

  const osSession = await getOsSession();
  const portalSession = await getPortalSession();

  if (!osSession && !portalSession) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

  if (portalSession && !osSession) {
    const [link] = await db.select().from(entityLinks).where(
      and(
        or(
          and(eq(entityLinks.sourceId, portalSession.clientId), eq(entityLinks.targetId, id)),
          and(eq(entityLinks.sourceId, id), eq(entityLinks.targetId, portalSession.clientId))
        )
      )
    ).limit(1);
    if (!link) {
      return NextResponse.json({ error: "No autorizado para este documento" }, { status: 403 });
    }
  }

  if (doc.storageProvider === "drive") {
    if (doc.url) return NextResponse.redirect(doc.url);
    return NextResponse.json({ error: "URL no disponible" }, { status: 404 });
  }

  if (doc.contentBase64) {
    const buffer = Buffer.from(doc.contentBase64, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${doc.name}"`,
        "Content-Length": String(doc.sizeBytes),
      },
    });
  }

  return NextResponse.json({ error: "Contenido no disponible" }, { status: 404 });
}
