import { db } from "@/lib/db";
import { shareTokens, documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [share] = await db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.token, token))
    .limit(1);

  if (!share) return new Response("Enlace no válido", { status: 404 });

  if (share.expiresAt < new Date()) {
    return new Response("Este enlace ha expirado", { status: 410 });
  }

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, share.documentId))
    .limit(1);

  if (!doc) return new Response("Documento no encontrado", { status: 404 });

  if (doc.driveFileId && doc.url) {
    return NextResponse.redirect(doc.url);
  }

  if (doc.contentBase64) {
    const buffer = Buffer.from(doc.contentBase64, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${doc.name}"`,
      },
    });
  }

  return new Response("Contenido no disponible", { status: 404 });
}
