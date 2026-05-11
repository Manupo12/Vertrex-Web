import { getProjectById, createProjectAction } from "@/lib/db/actions/projects";
import { projectHasPaidAdvance } from "@/lib/db/actions/finance-rules";
import { getResolvedEntityConnections } from "@/lib/db/actions/graph";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/os/data/ProgressBar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntitySidebar } from "@/components/os/Graph/EntitySidebar";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { EntityGraph } from "@/components/os/Graph/EntityGraph";
import { notFound } from "next/navigation";
import { EditProjectForm } from "./EditProjectForm";
import { ReferenceLinks } from "./ReferenceLinks";
import { AlertTriangle, CheckSquareIcon, KanbanIcon, RotateCwIcon, FlagIcon } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { tasks, finances, entityLinks } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";
import { formatCurrencyCop } from "@/lib/format";

interface Props { params: Promise<{ id: string }> }

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  if (id === "new") {
    return (
      <div>
        <PageHeader title="Nuevo proyecto" breadcrumbs={[{ label: "Proyectos", href: "/os/projects" }, { label: "Nuevo" }]} />
        <Card className="max-w-lg"><CardHeader><CardTitle>Crear proyecto</CardTitle></CardHeader>
        <CardContent>
          <form action={createProjectAction} className="space-y-4">
            <div><label className="block text-sm font-medium text-muted-foreground mb-1">Nombre *</label><input name="name" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Crear proyecto</button>
          </form>
        </CardContent></Card>
      </div>
    );
  }

  const project = await getProjectById(id);
  if (!project) notFound();

  const links = (project.referenceLinks as Array<{ label: string; url: string }>) || [];
  const resolvedConnections = await getResolvedEntityConnections(project.id);
  
  const clientDocs = resolvedConnections.filter(c => c.type === "document");
  const clientFinances = resolvedConnections.filter(c => c.type === "finance");
  const clientEvents = resolvedConnections.filter(c => c.type === "agenda");
  const clientResources = resolvedConnections.filter(c => c.type === "resource");

  let hasPaidAdvance = true;
  if (project.status === "active") {
    hasPaidAdvance = await projectHasPaidAdvance(project.id);
  }

  const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, id));
  const doneTasks = projectTasks.filter(t => t.state === 'done').length;
  const inProgressTasks = projectTasks.filter(t => t.state === 'in_progress').length;

  // Calculate budget
  let budgetConsumed = 0;
  let budgetPercentage = 0;
  if (project.budgetCop) {
    const financeIds = resolvedConnections.filter(c => c.type === "finance").map(c => c.id);
    if (financeIds.length > 0) {
      const pFinances = await db.select().from(finances);
      const projectGasto = pFinances.filter(f => financeIds.includes(f.id) && f.type === 'gasto' && f.status === 'paid');
      budgetConsumed = projectGasto.reduce((acc, f) => acc + f.amountCop, 0);
      budgetPercentage = (budgetConsumed / project.budgetCop) * 100;
    }
  }

  return (
    <div>
      <PageHeader 
        title={project.name} 
        badge={<StatusBadge category="project" status={project.status} />} 
        breadcrumbs={[{ label: "Proyectos", href: "/os/projects" }, { label: project.name }]} 
        primaryAction={<EditProjectForm project={project} />} 
        secondaryActions={<EntityConnectSheet sourceId={project.id} sourceType="project" />}
      />
      {!hasPaidAdvance && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">Este proyecto activo no tiene registrado el pago del anticipo (50%) en las finanzas.</p>
        </div>
      )}

      {/* V3 Navigation Links */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <Link href={`/os/projects/${id}/tasks`} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-sm font-medium hover:bg-[var(--color-muted)] transition-colors">
          <CheckSquareIcon className="h-4 w-4" /> Tareas ({projectTasks.length})
        </Link>
        <Link href={`/os/projects/${id}/board`} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-sm font-medium hover:bg-[var(--color-muted)] transition-colors">
          <KanbanIcon className="h-4 w-4" /> Tablero
        </Link>
        <Link href={`/os/projects/${id}/cycles`} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-sm font-medium hover:bg-[var(--color-muted)] transition-colors">
          <RotateCwIcon className="h-4 w-4" /> Ciclos
        </Link>
        <Link href={`/os/projects/${id}/milestones`} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-sm font-medium hover:bg-[var(--color-muted)] transition-colors">
          <FlagIcon className="h-4 w-4" /> Hitos
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="links">Links ({links.length})</TabsTrigger>
              <TabsTrigger value="documentos">Docs ({clientDocs.length})</TabsTrigger>
              <TabsTrigger value="finanzas">Finanzas ({clientFinances.length})</TabsTrigger>
              <TabsTrigger value="agenda">Agenda ({clientEvents.length})</TabsTrigger>
              <TabsTrigger value="recursos">Recursos ({clientResources.length})</TabsTrigger>
              <TabsTrigger value="grafo">Grafo</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              
              {project.budgetCop && (
                <Card className={budgetPercentage >= 100 ? "border-red-500/50 bg-red-500/5" : budgetPercentage >= 80 ? "border-yellow-500/50 bg-yellow-500/5" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">Presupuesto consumido</CardTitle>
                      {budgetPercentage >= 100 ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-500">Excedido</span>
                      ) : budgetPercentage >= 80 ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">Alerta</span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-500">Normal</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ProgressBar value={Math.min(budgetPercentage, 100)} size="lg" className="mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{formatCurrencyCop(budgetConsumed)}</span>
                      <span>{formatCurrencyCop(project.budgetCop)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resumen de ejecución</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-semibold">{projectTasks.length}</div>
                      <div className="text-xs text-muted-foreground">Tareas totales</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-green-500">{doneTasks}</div>
                      <div className="text-xs text-muted-foreground">Completadas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-blue-500">{inProgressTasks}</div>
                      <div className="text-xs text-muted-foreground">En progreso</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progreso del proyecto</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <ProgressBar value={project.progress} size="md" />
                  </div>
                </CardContent>
              </Card>

              <Card><CardHeader><CardTitle className="text-sm">Detalles</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Versión</span><span className="font-mono">{project.currentVersion}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><StatusBadge category="project" status={project.status} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Creado</span><span>{new Date(project.createdAt).toLocaleDateString("es-CO")}</span></div>
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="links"><ReferenceLinks projectId={project.id} links={links} /></TabsContent>
            <TabsContent value="documentos" className="space-y-2">
              {clientDocs.map(d => (
                <div key={d.id} className="rounded-lg border border-border p-3 text-sm hover:bg-accent/30 transition-colors flex items-center justify-between">
                  <a href={d.href} className="font-medium text-foreground hover:text-primary">{d.label}</a>
                  <span className="text-muted-foreground text-xs">{d.subtitle}</span>
                </div>
              ))}
              {clientDocs.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin documentos conectados.</p>}
            </TabsContent>
            <TabsContent value="finanzas" className="space-y-2">
              {clientFinances.map(f => (
                <div key={f.id} className="rounded-lg border border-border p-3 text-sm hover:bg-accent/30 transition-colors flex items-center justify-between">
                  <a href={f.href} className="font-medium text-foreground hover:text-primary">{f.label}</a>
                  <span className="text-muted-foreground text-xs">{f.subtitle}</span>
                </div>
              ))}
              {clientFinances.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin finanzas conectadas.</p>}
            </TabsContent>
            <TabsContent value="agenda" className="space-y-2">
              {clientEvents.map(e => (
                <div key={e.id} className="rounded-lg border border-border p-3 text-sm hover:bg-accent/30 transition-colors flex items-center justify-between">
                  <a href={e.href} className="font-medium text-foreground hover:text-primary">{e.label}</a>
                  <span className="text-muted-foreground text-xs">{e.subtitle}</span>
                </div>
              ))}
              {clientEvents.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin eventos en agenda.</p>}
            </TabsContent>
            <TabsContent value="recursos" className="space-y-2">
              {clientResources.map(r => (
                <div key={r.id} className="rounded-lg border border-border p-3 text-sm hover:bg-accent/30 transition-colors flex items-center justify-between">
                  <a href={r.href} className="font-medium text-foreground hover:text-primary">{r.label}</a>
                  <span className="text-muted-foreground text-xs">{r.subtitle}</span>
                </div>
              ))}
              {clientResources.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin recursos conectados.</p>}
            </TabsContent>
            <TabsContent value="grafo">
              <EntityGraph entityId={project.id} connections={resolvedConnections} entityLabel={project.name} entityType="Proyecto" />
            </TabsContent>
          </Tabs>
        </div>
        <div className="w-full lg:w-72 shrink-0"><EntitySidebar entityId={project.id} /></div>
      </div>
    </div>
  );
}
