import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, legalDocuments, entityLinks } from "@/lib/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";
import { getOsSession } from "@/lib/auth/session";
import { getPortalSession } from "@/lib/auth/portal";

type DocumentType = {
  id: string;
  name: string;
  sizeBytes: number;
  storageProvider: "neon" | "drive";
  driveFileId: string | null;
  url: string | null;
  mimeType: string | null;
  contentBase64: string | null;
  isPublic: boolean;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");

  const osSession = await getOsSession();
  const portalSession = await getPortalSession();

  if (!osSession && !portalSession) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let doc: DocumentType | null = null;
  let isLegal = typeParam === "legal";

  if (isLegal) {
    const [legalDoc] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1);
    if (legalDoc) {
      doc = { 
        ...legalDoc, 
        driveFileId: null, 
        contentBase64: (legalDoc as unknown as { contentBase64?: string | null }).contentBase64 || null,
        mimeType: "application/pdf"
      } as DocumentType;
    }
  } else {
    const [normalDoc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (normalDoc) {
      doc = normalDoc as DocumentType;
    } else {
      // Fallback to legal if not found in documents and no type specified
      const [legalDoc] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1);
      if (legalDoc) {
        doc = { 
          ...legalDoc, 
          driveFileId: null, 
          contentBase64: (legalDoc as unknown as { contentBase64?: string | null }).contentBase64 || null,
          mimeType: "application/pdf"
        } as DocumentType;
        isLegal = true;
      }
    }
  }

  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

  if (portalSession && !osSession) {
    if (!doc.isPublic) {
      return NextResponse.json({ error: "No autorizado para este documento" }, { status: 403 });
    }

    const [directLink] = await db.select().from(entityLinks).where(
      and(
        or(
          and(eq(entityLinks.sourceId, portalSession.clientId), eq(entityLinks.targetId, id)),
          and(eq(entityLinks.sourceId, id), eq(entityLinks.targetId, portalSession.clientId))
        )
      )
    ).limit(1);

    if (!directLink) {
      const projectLinks = await db.select().from(entityLinks).where(
        or(
          and(eq(entityLinks.sourceId, portalSession.clientId), eq(entityLinks.targetType, "project")),
          and(eq(entityLinks.targetId, portalSession.clientId), eq(entityLinks.sourceType, "project"))
        )
      );
      const projectIds = projectLinks.map(l => l.sourceId === portalSession.clientId ? l.targetId : l.sourceId);

      if (projectIds.length > 0) {
        const [projectDocLink] = await db.select().from(entityLinks).where(
          and(
            or(
              inArray(entityLinks.sourceId, projectIds),
              inArray(entityLinks.targetId, projectIds)
            ),
            or(
              eq(entityLinks.sourceId, id),
              eq(entityLinks.targetId, id)
            )
          )
        ).limit(1);

        if (!projectDocLink) {
          return NextResponse.json({ error: "No autorizado para este documento" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "No autorizado para este documento" }, { status: 403 });
      }
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
        "Content-Type": isLegal ? "application/pdf" : doc.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${doc.name}"`,
        "Content-Length": String(doc.sizeBytes),
      },
    });
  }

  return NextResponse.json({ error: "Contenido no disponible" }, { status: 404 });
}
