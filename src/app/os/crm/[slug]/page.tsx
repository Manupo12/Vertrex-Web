import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { getClientBySlug, generateClientPinAction, createClientAction } from "@/lib/db/actions/crm";
import { getEntityConnections, getResolvedEntityConnections } from "@/lib/db/actions/graph";
import { db } from "@/lib/db";
import { projects, documents, tickets, finances } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { formatShortDate, formatCurrencyCop } from "@/lib/format";
import { notFound } from "next/navigation";
import { PinManager } from "./PinManager";
import { EditClientDialog } from "./EditClientDialog";
import { EntityGraph } from "@/components/os/Graph/EntityGraph";
import { AsyncSubmitButton } from "@/components/os/ui/AsyncSubmitButton";

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ pin?: string }> }

export default async function CrmDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { pin } = await searchParams;

  if (slug === "new") {
    return <NewClientPage />;
  }

  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const connections = await getEntityConnections(client.id);
  const resolvedConnections = await getResolvedEntityConnections(client.id);

  const projectIds = connections
    .filter(l => (l.sourceType === "project" && l.targetId === client.id) || (l.targetType === "project" && l.sourceId === client.id))
    .map(l => l.sourceId === client.id ? l.targetId : l.sourceId);

  const docIds = connections
    .filter(l => (l.sourceType === "document" && l.targetId === client.id) || (l.targetType === "document" && l.sourceId === client.id))
    .map(l => l.sourceId === client.id ? l.targetId : l.sourceId);

  const financeIds = connections
    .filter(l => (l.sourceType === "finance" && l.targetId === client.id) || (l.targetType === "finance" && l.sourceId === client.id))
    .map(l => l.sourceId === client.id ? l.targetId : l.sourceId);

  const clientProjects = projectIds.length > 0 ? await db.select().from(projects).where(inArray(projects.id, projectIds)) : [];
  const clientDocs = docIds.length > 0 ? await db.select().from(documents).where(inArray(documents.id, docIds)) : [];
  const clientFinances = financeIds.length > 0 ? await db.select().from(finances).where(inArray(finances.id, financeIds)).orderBy(finances.createdAt) : [];
  const clientTickets = await db.select().from(tickets).where(eq(tickets.clientId, client.id));

  return (
    <div>
      <PageHeader
        title={client.name}
        description={`Slug: ${client.slug}`}
        breadcrumbs={[{ label: "CRM", href: "/os/crm" }, { label: client.name }]}
        badge={<StatusBadge category="client" status={client.status} />}
        primaryAction={<PinManager slug={client.slug} generatePin={generateClientPinAction} initialPin={pin} />}
        secondaryActions={
          <div className="flex items-center gap-2">
            <EntityConnectSheet sourceId={client.id} sourceType="client" />
            <EditClientDialog client={client} />
          </div>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <Tabs defaultValue="resumen">
            <TabsList>
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="proyectos">Proyectos ({clientProjects.length})</TabsTrigger>
              <TabsTrigger value="documentos">Documentos ({clientDocs.length})</TabsTrigger>
              <TabsTrigger value="finanzas">Finanzas ({clientFinances.length})</TabsTrigger>
              <TabsTrigger value="tickets">Tickets ({clientTickets.length})</TabsTrigger>
              <TabsTrigger value="conexiones">Conexiones</TabsTrigger>
            </TabsList>
            <TabsContent value="resumen" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Información del Prospecto / Cliente</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-border/40 pb-1.5"><span className="text-muted-foreground">Prioridad</span><span className="font-semibold">{client.priority || "-"}</span></div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5"><span className="text-muted-foreground">Rubro / Sector</span><span>{client.sector || "-"}</span></div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5"><span className="text-muted-foreground">Ciudad</span><span>{client.city || "-"}</span></div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5"><span className="text-muted-foreground">Dirección</span><span className="text-right max-w-[200px] truncate" title={client.address || ""}>{client.address || "-"}</span></div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5"><span className="text-muted-foreground">Calificación</span><span>⭐ {client.rating || "-"} ({client.reviewsCount || 0} reseñas)</span></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-border/40 pb-1.5"><span className="text-muted-foreground">Email</span><span>{client.email || "No registrado"}</span></div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5"><span className="text-muted-foreground">Teléfono</span><span>{client.phone || "No registrado"}</span></div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5"><span className="text-muted-foreground">WhatsApp</span><span>{client.whatsapp ? <a href={client.whatsapp} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Abrir Chat</a> : "-"}</span></div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5"><span className="text-muted-foreground">Instagram</span><span>{client.instagram ? <a href={client.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Ver Perfil</a> : "-"}</span></div>
                    <div className="flex justify-between border-b border-border/40 pb-1.5"><span className="text-muted-foreground">Sitio Web / Red</span><span>{client.website ? <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[150px] inline-block align-bottom font-semibold">{client.webPresence || "Ver enlace"}</a> : "-"}</span></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="proyectos" className="space-y-2">
              {clientProjects.map(p => (
                <div key={p.id} className="rounded-lg border border-border p-3 text-sm hover:bg-accent/30 transition-colors flex items-center justify-between">
                  <a href={`/os/projects/${p.id}`} className="font-medium text-foreground hover:text-primary">{p.name}</a>
                  <StatusBadge category="project" status={p.status} />
                </div>
              ))}
              {clientProjects.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin proyectos conectados.</p>}
            </TabsContent>
            <TabsContent value="documentos" className="space-y-2">
              {clientDocs.map(d => (
                <div key={d.id} className="rounded-lg border border-border p-3 text-sm hover:bg-accent/30 transition-colors flex items-center justify-between">
                  <a href={`/os/documents/${d.id}`} className="font-medium text-foreground hover:text-primary">{d.name}</a>
                  <span className="text-muted-foreground text-xs">{d.storageProvider}</span>
                </div>
              ))}
              {clientDocs.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin documentos.</p>}
            </TabsContent>
            <TabsContent value="finanzas" className="space-y-2">
              {clientFinances.map(f => (
                <div key={f.id} className="rounded-lg border border-border p-3 text-sm hover:bg-accent/30 transition-colors flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <a href={`/os/finances/${f.id}`} className="font-medium text-foreground hover:text-primary">{f.concept}</a>
                    <StatusBadge category="finance" status={f.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{f.type === "ingreso" ? "Ingreso" : "Gasto"}</span>
                    <span className="font-semibold text-foreground">{formatCurrencyCop(f.amountCop)}</span>
                  </div>
                </div>
              ))}
              {clientFinances.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin movimientos financieros.</p>}
            </TabsContent>
            <TabsContent value="tickets" className="space-y-2">
              {clientTickets.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <span>{t.title}</span>
                  <StatusBadge category="ticket" status={t.status} />
                </div>
              ))}
              {clientTickets.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin tickets.</p>}
            </TabsContent>
            <TabsContent value="conexiones">
              <EntityGraph entityId={client.id} connections={resolvedConnections} entityLabel={client.name} entityType="Cliente" />
            </TabsContent>
          </Tabs>
        </div>
        <div className="w-full lg:w-72 shrink-0">
          <EntitySidebar entityId={client.id} />
        </div>
      </div>
    </div>
  );
}

import { Input } from "@/components/ui/input";

function NewClientPage() {
  return (
    <div>
      <PageHeader title="Nuevo cliente" breadcrumbs={[{ label: "CRM", href: "/os/crm" }, { label: "Nuevo" }]} />
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Crear cliente</CardTitle></CardHeader>
        <CardContent>
          <form action={createClientAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre *</label>
              <Input name="name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Slug (opcional, autogenerado)</label>
              <Input name="slug" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
              <Input name="email" type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Telefono</label>
              <Input name="phone" />
            </div>
            <AsyncSubmitButton className="w-full">Crear cliente</AsyncSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
