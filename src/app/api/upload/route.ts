import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { uploadToDrive } from "@/lib/drive/service";
import { getPortalSession } from "@/lib/auth/portal";
import { linkEntities } from "@/lib/db/actions/graph";

const NEON_LIMIT_BYTES = 1.5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const source = String(formData.get("source") || "os");
    if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let portalSession = null;
    let forceDrive = false;

    if (source === "portal") {
      portalSession = await getPortalSession();
      if (!portalSession) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      forceDrive = true;
    } else {
      const { getOsSession } = await import("@/lib/auth/session");
      const osSession = await getOsSession();
      if (!osSession) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const shouldUseDrive = forceDrive || file.size >= NEON_LIMIT_BYTES;

    let storageProvider: "neon" | "drive" = "neon";
    let driveFileId: string | null = null;
    let url: string | null = null;
    let contentBase64: string | null = null;

    if (shouldUseDrive) {
      const uploaded = await uploadToDrive(
        file.name,
        buffer,
        file.type || "application/octet-stream",
        process.env.DRIVE_FOLDER_ID
      );
      storageProvider = "drive";
      driveFileId = uploaded.driveFileId;
      url = uploaded.url || null;
    } else {
      contentBase64 = buffer.toString("base64");
    }

    const [doc] = await db
      .insert(documents)
      .values({ name: file.name, sizeBytes: file.size, storageProvider, driveFileId, url, mimeType: file.type || "application/octet-stream", contentBase64 })
      .returning();

    if (portalSession) {
      await linkEntities(portalSession.clientId, "client", doc.id, "document", "uploaded_by_client");
    }

    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error al subir archivo" }, { status: 500 });
  }
}
