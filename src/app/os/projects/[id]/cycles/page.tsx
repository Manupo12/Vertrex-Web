import { db } from "@/lib/db";
import { cycles, projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import Link from "next/link";
import { formatShortDate } from "@/lib/format";
import { CreateCycleDialog } from "./CreateCycleDialog";
import { TaskCreateButton } from "@/components/os/Tasks/TaskCreateButton";

export default async function CyclesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOsUser();
  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) throw new Error("Proyecto no encontrado");

  const projectCycles = await db.select().from(cycles).where(eq(cycles.projectId, id)).orderBy(desc(cycles.createdAt));

  return (
    <div>
      <PageHeader 
        title="Ciclos" 
        description={`Sprints de ${project.name}`}
        breadcrumbs={[{ label: "Proyectos", href: "/os/projects" }, { label: project.name, href: `/os/projects/${id}` }, { label: "Ciclos" }]}
        secondaryActions={
          <TaskCreateButton projectId={id} label="+ Tarea" />
        }
        primaryAction={
          <CreateCycleDialog projectId={id} />
        }
      />
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectCycles.map(cycle => (
          <Link key={cycle.id} href={`/os/projects/${id}/cycles/${cycle.id}`} className="block">
            <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/50 transition-colors h-full flex flex-col cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{cycle.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  cycle.status === 'active' ? 'bg-green-500/20 text-green-500' : 
                  cycle.status === 'completed' ? 'bg-gray-500/20 text-gray-400' : 
                  'bg-blue-500/20 text-blue-500'
                }`}>
                  {cycle.status === 'active' ? 'Activo' : cycle.status === 'completed' ? 'Completado' : 'Planificado'}
                </span>
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)] mb-4 flex-1">
                {cycle.goal || "Sin meta definida"}
              </p>
              <div className="text-xs text-[var(--color-muted-foreground)] mt-auto pt-4 border-t border-[var(--color-border)]">
                {formatShortDate(cycle.startsAt)} - {formatShortDate(cycle.endsAt)}
              </div>
            </div>
          </Link>
        ))}
        {projectCycles.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--color-muted-foreground)]">
            No hay ciclos creados aún.
          </div>
        )}
      </div>
    </div>
  );
}
