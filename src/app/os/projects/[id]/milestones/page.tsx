import { db } from "@/lib/db";
import { milestones, projects, tasks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { formatShortDate } from "@/lib/format";
import { CreateMilestoneDialog } from "./CreateMilestoneDialog";

export default async function MilestonesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOsUser();
  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) throw new Error("Proyecto no encontrado");

  const projectMilestones = await db.select().from(milestones).where(eq(milestones.projectId, id)).orderBy(asc(milestones.orderIndex));

  const allMilestoneTasks = await db.select({ id: tasks.id, state: tasks.state, milestoneId: tasks.milestoneId }).from(tasks).where(eq(tasks.projectId, id));
  const milestoneTaskCounts = new Map<string, { total: number; done: number }>();
  for (const t of allMilestoneTasks) {
    if (!t.milestoneId) continue;
    const current = milestoneTaskCounts.get(t.milestoneId) || { total: 0, done: 0 };
    current.total++;
    if (t.state === 'done' || t.state === 'cancelled') current.done++;
    milestoneTaskCounts.set(t.milestoneId, current);
  }

  return (
    <div>
      <PageHeader 
        title="Hitos" 
        description={`Milestones de ${project.name}`}
        breadcrumbs={[{ label: "Proyectos", href: "/os/projects" }, { label: project.name, href: `/os/projects/${id}` }, { label: "Hitos" }]}
        primaryAction={
          <CreateMilestoneDialog projectId={id} />
        }
      />
      
      <div className="mt-6 space-y-4">
        {projectMilestones.map(m => (
          <div key={m.id} className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/50 transition-colors flex items-center justify-between cursor-pointer">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-lg">{m.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.status === 'open' ? 'bg-blue-500/20 text-blue-500' : 
                  m.status === 'completed' ? 'bg-green-500/20 text-green-500' : 
                  'bg-red-500/20 text-red-500'
                }`}>
                  {m.status === 'open' ? 'Abierto' : m.status === 'completed' ? 'Completado' : 'Atrasado'}
                </span>
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {m.description || "Sin descripción"}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium">
                {formatShortDate(m.targetDate) || "Sin fecha"}
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)] mt-1">
                {(() => {
                    const progress = milestoneTaskCounts.get(m.id);
                    if (progress) {
                      const pct = Math.round(progress.done / progress.total * 100);
                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs whitespace-nowrap">{progress.done}/{progress.total}</span>
                        </div>
                      );
                    }
                    return <span className="text-xs text-[var(--color-muted-foreground)]">Sin tareas</span>;
                  })()}
              </div>
            </div>
          </div>
        ))}
        
        {projectMilestones.length === 0 && (
          <div className="py-12 text-center text-[var(--color-muted-foreground)] bg-[var(--color-card)] rounded-lg border border-[var(--color-border)]">
            No hay hitos creados aún.
          </div>
        )}
      </div>
    </div>
  );
}
