import { db } from "@/lib/db";
import { clients, projects, documents, legalDocuments, finances, agendaEvents, tickets, entityLinks } from "@/lib/db/schema";
import { eq, or, inArray } from "drizzle-orm";
import { requirePortalClient } from "@/lib/auth/portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/os/data/ProgressBar";
import Link from "next/link";
import { FileText, Calendar, DollarSign, MessageSquare, LogOut, Scale } from "lucide-react";
import { formatCurrencyCop, formatDateTime } from "@/lib/format";

interface Props { params: Promise<{ slug: string }> }

export default async function PortalDashboard({ params }: Props) {
  const { slug } = await params;
  const session = await requirePortalClient(slug);

  const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);
  if (!client) return <p>Cliente no encontrado</p>;

  const connections = await db.select().from(entityLinks).where(or(eq(entityLinks.sourceId, client.id), eq(entityLinks.targetId, client.id)));

  const projectIds = connections.filter(l => l.sourceType === "project" || l.targetType === "project").map(l => l.sourceId === client.id ? l.targetId : l.sourceId);
  const docIds = connections.filter(l => l.sourceType === "document" || l.targetType === "document").map(l => l.sourceId === client.id ? l.targetId : l.sourceId);
  const legalIds = connections.filter(l => l.sourceType === "legal" || l.targetType === "legal").map(l => l.sourceId === client.id ? l.targetId : l.sourceId);
  const financeIds = connections.filter(l => l.sourceType === "finance" || l.targetType === "finance").map(l => l.sourceId === client.id ? l.targetId : l.sourceId);
  const eventIds = connections.filter(l => l.sourceType === "agenda" || l.targetType === "agenda").map(l => l.sourceId === client.id ? l.targetId : l.sourceId);

  const clientProjects = projectIds.length > 0 ? await db.select().from(projects).where(inArray(projects.id, projectIds)) : [];
  const clientDocs = docIds.length > 0 ? await db.select().from(documents).where(inArray(documents.id, docIds)) : [];
  const clientLegal = legalIds.length > 0 ? await db.select().from(legalDocuments).where(inArray(legalDocuments.id, legalIds)) : [];
  const publicLegals = clientLegal.filter(l => l.isPublic);
  const clientFinances = financeIds.length > 0 ? await db.select().from(finances).where(inArray(finances.id, financeIds)) : [];
  const clientEvents = eventIds.length > 0 ? await db.select().from(agendaEvents).where(inArray(agendaEvents.id, eventIds)).orderBy(agendaEvents.startsAt) : [];
  const clientTickets = await db.select().from(tickets).where(eq(tickets.clientId, client.id)).orderBy(tickets.createdAt);

  const totalPaid = clientFinances.filter(f => f.type === "ingreso" && f.status === "paid").reduce((s, f) => s + f.amountCop, 0);
  const totalPending = clientFinances.filter(f => f.type === "ingreso" && f.status !== "paid").reduce((s, f) => s + f.amountCop, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Hola, {client.name}</h1><p className="text-gray-500 text-lg">Bienvenido a tu portal</p></div>
        <Link href="/portal/logout"><Button variant="outline" size="lg"><LogOut className="mr-2 h-5 w-5" />Salir</Button></Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {clientProjects.map(p => (
          <Card key={p.id} className="border-green-200 shadow-sm">
            <CardHeader><CardTitle className="text-xl text-gray-900">{p.name}</CardTitle></CardHeader>
            <CardContent>
              <ProgressBar value={p.progress} size="lg" className="mb-2" />
              <p className="text-lg font-semibold text-gray-900">{p.progress}% completado</p>
              <p className="text-gray-500 mt-1">Version: {p.currentVersion}</p>
            </CardContent>
          </Card>
        ))}
        {clientProjects.length === 0 && (
          <Card className="border-gray-200 col-span-1 md:col-span-2 shadow-sm">
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 text-lg">No tienes proyectos activos en este momento.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {clientEvents.filter(e => new Date(e.startsAt) >= new Date()).length > 0 && (
        <Card className="shadow-sm"><CardHeader><CardTitle className="text-xl flex items-center gap-2 text-gray-900"><Calendar className="h-5 w-5" />Proximas reuniones</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {clientEvents.filter(e => new Date(e.startsAt) >= new Date()).slice(0, 3).map(e => (
            <div key={e.id} className="rounded-lg border p-4">
              <p className="font-semibold text-lg text-gray-900">{e.title}</p>
              <p className="text-gray-500">{formatDateTime(e.startsAt)}</p>
              {e.meetLink && <a href={e.meetLink} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 font-medium mt-1 inline-block transition-colors">Unirse a Google Meet</a>}
            </div>
          ))}
        </CardContent></Card>
      )}

      {publicLegals.length > 0 && (
        <Card className="shadow-sm border-blue-100">
          <CardHeader><CardTitle className="text-xl flex items-center gap-2 text-gray-900"><Scale className="h-5 w-5" />Documentos Legales</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {publicLegals.map(l => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border p-4 bg-gray-50">
                <div>
                  <p className="font-semibold text-lg text-gray-900">{l.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{l.type.replace('_', ' ')}</p>
                </div>
                <a href={`/api/documents/${l.id}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">Descargar documento</a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="shadow-sm"><CardHeader><CardTitle className="text-lg flex items-center gap-2 text-gray-900"><FileText className="h-5 w-5" />Documentos</CardTitle></CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">{clientDocs.length}</p>
          <p className="text-gray-500 mt-1">archivos disponibles</p>
          <Link href={`/portal/${slug}/files`}><Button variant="outline" size="lg" className="mt-3 w-full border-gray-300 text-gray-700">Ver archivos</Button></Link>
        </CardContent></Card>

        <Card className="shadow-sm"><CardHeader><CardTitle className="text-lg flex items-center gap-2 text-gray-900"><DollarSign className="h-5 w-5" />Pagos</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Pagado</span><span className="font-bold text-green-600">{formatCurrencyCop(totalPaid)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Pendiente</span><span className="font-bold text-amber-600">{formatCurrencyCop(totalPending)}</span></div>
          </div>
        </CardContent></Card>

        <Card className="shadow-sm"><CardHeader><CardTitle className="text-lg flex items-center gap-2 text-gray-900"><MessageSquare className="h-5 w-5" />Soporte</CardTitle></CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">{clientTickets.filter(t => t.status !== "resolved").length}</p>
          <p className="text-gray-500 mt-1">tickets abiertos</p>
          <Link href={`/portal/${slug}/tickets`}><Button variant="outline" size="lg" className="mt-3 w-full border-gray-300 text-gray-700">Enviar ticket</Button></Link>
        </CardContent></Card>
      </div>
    </div>
  );
}
