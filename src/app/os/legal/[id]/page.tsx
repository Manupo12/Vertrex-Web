import { db } from "@/lib/db";
import { legalDocuments, signatures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatShortDate } from "@/lib/format";
import { notFound } from "next/navigation";
import { LegalSettings } from "./LegalSettings";

interface Props { params: Promise<{ id: string }> }

export default async function LegalDetailPage({ params }: Props) {
  const { id } = await params;
  const [doc] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1);
  if (!doc) notFound();

  const docSignatures = await db.select().from(signatures).where(eq(signatures.legalId, doc.id));

  return (
    <div>
      <PageHeader title={doc.name} breadcrumbs={[{ label: "Legal", href: "/os/legal" }, { label: doc.name }]} badge={
        <Badge variant="neutral">{doc.type}</Badge>
      } secondaryActions={<EntityConnectSheet sourceId={doc.id} sourceType="legal" />} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <Tabs defaultValue="resumen">
            <TabsList>
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="portal">Configuracion</TabsTrigger>
              <TabsTrigger value="firmas">Firmas ({docSignatures.length})</TabsTrigger>
              {doc.templateId && <TabsTrigger value="plantilla">Plantilla Origen</TabsTrigger>}
            </TabsList>
            <TabsContent value="resumen"><Card><CardHeader><CardTitle className="text-sm">Detalles</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{doc.type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Firmado</span><span>{doc.signedAt ? formatShortDate(doc.signedAt) : "Pendiente"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Creado</span><span>{formatShortDate(doc.createdAt)}</span></div>
            </CardContent></Card></TabsContent>
            <TabsContent value="portal">
              <LegalSettings doc={doc} />
            </TabsContent>
            <TabsContent value="firmas">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Firmas registradas</CardTitle>
                </CardHeader>
                <CardContent>
                  {docSignatures.length > 0 ? (
                    <div className="space-y-4">
                      {docSignatures.map(s => (
                        <div key={s.id} className="p-4 border border-[var(--color-border)] rounded-lg">
                          <div className="font-semibold">{s.signerName}</div>
                          <div className="text-sm text-muted-foreground">{s.signerEmail}</div>
                          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-[var(--color-border)]">
                            Firmado el {formatShortDate(s.signedAt)} • IP: {s.ipAddress || "Desconocida"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                      No hay firmas registradas para este documento.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {doc.templateId && (
              <TabsContent value="plantilla">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Generado desde plantilla</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Este documento fue generado usando una plantilla. Puedes ver la plantilla original en el panel de Legal.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
        <div className="w-full lg:w-72 shrink-0"><EntitySidebar entityId={doc.id} /></div>
      </div>
    </div>
  );
}
