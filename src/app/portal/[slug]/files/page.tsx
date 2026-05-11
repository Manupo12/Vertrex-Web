import { db } from "@/lib/db";
import { clients, documents, entityLinks } from "@/lib/db/schema";
import { eq, or, inArray, and } from "drizzle-orm";
import { requirePortalClient } from "@/lib/auth/portal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Upload, Download } from "lucide-react";
import { formatFileSize } from "@/lib/format";
import { SmartUploader } from "@/components/os/Uploader/SmartUploader";

interface Props { params: Promise<{ slug: string }> }

export default async function PortalFiles({ params }: Props) {
  const { slug } = await params;
  const session = await requirePortalClient(slug);

  const connections = await db.select().from(entityLinks).where(or(eq(entityLinks.sourceId, session.clientId), eq(entityLinks.targetId, session.clientId)));
  const docIds = connections.filter(l => l.sourceType === "document" || l.targetType === "document").map(l => l.sourceId === session.clientId ? l.targetId : l.sourceId);
  const allDocs = docIds.length > 0 ? await db.select().from(documents).where(and(inArray(documents.id, docIds), eq(documents.isPublic, true))) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><Link href={`/portal/${slug}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-lg"><ArrowLeft className="h-5 w-5" />Volver</Link><h1 className="text-2xl font-bold mt-2 text-gray-900">Archivos</h1></div>
      </div>

      <SmartUploader source="portal" variant="dropzone" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-8">
        {allDocs.map(d => (
          <div key={d.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
            <div><p className="font-medium text-lg text-gray-900">{d.name}</p><p className="text-gray-500">{formatFileSize(d.sizeBytes)}</p></div>
            <a href={`/api/documents/${d.id}`}><Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50"><Download className="mr-2 h-5 w-5" />Descargar</Button></a>
          </div>
        ))}
        {allDocs.length === 0 && <div className="col-span-1 sm:col-span-2 text-center py-12 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50"><p className="text-gray-500 text-lg">No hay archivos disponibles.</p></div>}
      </div>
    </div>
  );
}
