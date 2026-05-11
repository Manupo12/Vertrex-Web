import { getProjectById, createProjectAction, updateProjectAction, addProjectReferenceLinkAction, removeProjectReferenceLinkAction } from "@/lib/db/actions/projects";
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
import { AlertTriangle } from "lucide-react";

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
  const connections = await getResolvedEntityConnections(project.id);
  
  let hasPaidAdvance = true;
  if (project.status === "active") {
    hasPaidAdvance = await projectHasPaidAdvance(project.id);
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
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="links">Links ({links.length})</TabsTrigger>
              <TabsTrigger value="grafo">Grafo</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <Card><CardHeader><CardTitle className="text-sm">Progreso</CardTitle></CardHeader><CardContent>
                <ProgressBar value={project.progress} size="lg" className="mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>0%</span><span className="font-medium text-foreground">{project.progress}%</span><span>100%</span></div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm">Detalles</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Versi&oacute;n</span><span className="font-mono">{project.currentVersion}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><StatusBadge category="project" status={project.status} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Creado</span><span>{new Date(project.createdAt).toLocaleDateString("es-CO")}</span></div>
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="links"><ReferenceLinks projectId={project.id} links={links} /></TabsContent>
            <TabsContent value="grafo">
              <EntityGraph entityId={project.id} connections={connections} entityLabel={project.name} entityType="Proyecto" />
            </TabsContent>
          </Tabs>
        </div>
        <div className="w-full lg:w-72 shrink-0"><EntitySidebar entityId={project.id} /></div>
      </div>
    </div>
  );
}
