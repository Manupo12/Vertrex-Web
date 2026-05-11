import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { Button } from "@/components/ui/button";
import { formatFileSize, formatShortDate } from "@/lib/format";
import { Download, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props { params: Promise<{ id: string }> }

export default async function DocDetailPage({ params }: Props) {
  const { id } = await params;
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) notFound();

  const isImage = doc.mimeType?.startsWith('image/');
  const isPdf = doc.mimeType === 'application/pdf';

  return (
    <div>
      <PageHeader title={doc.name} breadcrumbs={[{ label: "Documentos", href: "/os/documents" }, { label: doc.name }]} primaryAction={
        <Link href={`/api/documents/${doc.id}`}><Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Descargar</Button></Link>
      } secondaryActions={<EntityConnectSheet sourceId={doc.id} sourceType="document" />} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="w-full flex items-center justify-center bg-accent/20 border-b border-border min-h-[400px]">
                {isImage && doc.storageProvider === 'neon' && doc.contentBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`data:${doc.mimeType};base64,${doc.contentBase64}`} alt={doc.name} className="max-w-full max-h-[60vh] object-contain" />
                ) : isPdf && doc.storageProvider === 'neon' && doc.contentBase64 ? (
                  <iframe src={`data:application/pdf;base64,${doc.contentBase64}#toolbar=0`} className="w-full h-[60vh] border-0" />
                ) : (
                  <div className="text-center p-12 text-muted-foreground flex flex-col items-center">
                    <FileText className="h-16 w-16 mb-4 opacity-50" />
                    <p>Vista previa no disponible para este formato o destino.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-sm">Metadata</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{doc.mimeType || "Desconocido"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tama&ntilde;o</span><span>{formatFileSize(doc.sizeBytes)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Almacenamiento</span><StatusBadge category="storage" status={doc.storageProvider} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Creado</span><span>{formatShortDate(doc.createdAt)}</span></div>
          </CardContent></Card>
        </div>
        <div className="w-full lg:w-72 shrink-0"><EntitySidebar entityId={doc.id} /></div>
      </div>
    </div>
  );
}
