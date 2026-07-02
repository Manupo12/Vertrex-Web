import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { getClientBySlug, generateClientPinAction, createClientAction, getClientContactors, listTeamMembersAction } from "@/lib/db/actions/crm";
import { getEntityConnections, getResolvedEntityConnections } from "@/lib/db/actions/graph";
import { db } from "@/lib/db";
import { projects, documents, tickets, finances } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { formatShortDate, formatCurrencyCop } from "@/lib/format";
import { notFound } from "next/navigation";
import { PinManager } from "./PinManager";
import { EditClientDialog } from "./EditClientDialog";
import { EditContactorsDialog } from "./EditContactorsDialog";
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

  const currentContactors = await getClientContactors(client.id);
  const teamMembers = await listTeamMembersAction();

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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">Contacto & Seguimiento</CardTitle>
                  <EditContactorsDialog 
                    clientId={client.id} 
                    currentContactors={currentContactors} 
                    teamMembers={teamMembers} 
                  />
                </CardHeader>
                <CardContent className="pt-2">
                  {currentContactors.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Nadie del equipo está contactando a este prospecto aún.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentContactors.map(c => (
                        <div key={c.id} className="flex items-center gap-2 bg-accent/35 border border-border rounded-lg px-3 py-1.5 text-sm shadow-sm">
                          <div className="h-5 w-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold flex items-center justify-center">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{c.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">({c.email})</span>
                        </div>
                      ))}
                    </div>
                  )}
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
      <Card className="max-w-4xl">
        <CardHeader><CardTitle>Crear Prospecto / Cliente</CardTitle></CardHeader>
        <CardContent>
          <form action={createClientAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Izquierda */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Nombre *</label>
                  <Input name="name" required placeholder="Nombre del negocio o cliente" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Slug (opcional)</label>
                  <Input name="slug" placeholder="Autogenerado si se deja en blanco" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Email</label>
                  <Input name="email" type="email" placeholder="correo@ejemplo.com" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Teléfono</label>
                  <Input name="phone" placeholder="Número de contacto" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">WhatsApp Link</label>
                  <Input name="whatsapp" placeholder="https://wa.me/..." />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Instagram Link</label>
                  <Input name="instagram" placeholder="Enlace del perfil" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Dirección</label>
                  <Input name="address" placeholder="Dirección física" />
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Estado</label>
                  <select 
                    name="status" 
                    defaultValue="no_contactado" 
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="active">Activo (Portal)</option>
                    <option value="inactive">Inactivo (Portal)</option>
                    <option value="paused">Pausado (Portal)</option>
                    <option value="no_contactado">No contactado</option>
                    <option value="contactado">Contactado</option>
                    <option value="interesado">Interesado</option>
                    <option value="no_respondio">No respondió</option>
                    <option value="reunion_completada">1ª Reunión</option>
                    <option value="contrato_firmado">Contrato firmado</option>
                    <option value="contrato_finalizado">Contrato finalizado</option>
                    <option value="continuidad">Continuidad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Prioridad</label>
                  <select 
                    name="priority" 
                    defaultValue="" 
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Ninguna</option>
                    <option value="🔥 Alta">🔥 Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Rubro / Sector</label>
                  <Input name="sector" placeholder="Ej. Pizzería, Estética" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Ciudad</label>
                  <Input name="city" placeholder="Ej. Neiva" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Calificación</label>
                    <Input name="rating" placeholder="Ej. 4.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Reseñas Count</label>
                    <Input name="reviewsCount" defaultValue={0} type="number" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Presencia Web</label>
                    <Input name="webPresence" placeholder="Ej. SIN WEB, Facebook" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Sitio Web / Red Link</label>
                    <Input name="website" placeholder="https://..." />
                  </div>
                </div>
              </div>
            </div>
            
            <AsyncSubmitButton className="w-full mt-6">Crear cliente</AsyncSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
