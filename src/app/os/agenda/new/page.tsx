import { createAgendaEventAction } from "@/lib/db/actions/agenda";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { clients, projects } from "@/lib/db/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default async function NewEventPage({ searchParams }: { searchParams?: Promise<{ projectId?: string }> }) {
  const { projectId } = (await searchParams) || {};
  const allClients = await db.select({ id: clients.id, name: clients.name }).from(clients);
  const allProjects = await db.select({ id: projects.id, name: projects.name }).from(projects);

  return (
    <div>
      <PageHeader title="Nuevo evento" breadcrumbs={[{ label: "Agenda", href: "/os/agenda" }, { label: "Nuevo" }]} />
      <Card className="max-w-lg"><CardHeader><CardTitle>Crear evento</CardTitle></CardHeader><CardContent>
        <form action={createAgendaEventAction} className="space-y-4">
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Titulo *</label><Input name="title" required /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Descripcion</label><Textarea name="description" rows={3} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-muted-foreground mb-1">Inicio *</label><Input name="starts_at" type="datetime-local" required /></div><div><label className="block text-sm font-medium text-muted-foreground mb-1">Fin *</label><Input name="ends_at" type="datetime-local" required /></div></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Link Meet</label><Input name="meet_link" placeholder="https://meet.google.com/..." /></div>
          
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium mb-3">Conexiones opcionales</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Cliente</label>
                <select name="client_id" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Ninguno</option>
                  {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Proyecto</label>
                <select name="project_id" defaultValue={projectId || ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Ninguno</option>
                  {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Crear evento</button>
        </form>
      </CardContent></Card>
    </div>
  );
}
