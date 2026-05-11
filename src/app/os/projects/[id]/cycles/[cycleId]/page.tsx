import { db } from "@/lib/db";
import { cycles, tasks, projects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { differenceInDays, format, addDays } from "date-fns";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { BurndownChart } from "@/components/os/Tasks/BurndownChart";
import { formatShortDate } from "@/lib/format";

export default async function CycleDetailPage({ params }: { params: Promise<{ id: string, cycleId: string }> }) {
  await requireOsUser();
  const { id, cycleId } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) throw new Error("Proyecto no encontrado");

  const [cycle] = await db.select().from(cycles).where(eq(cycles.id, cycleId));
  if (!cycle) throw new Error("Ciclo no encontrado");

  // In a real implementation we would fetch tasks for this cycle
  // For the V3 visual requirement, we will render a placeholder if there are no tasks
  const cycleTasks = await db.select().from(tasks).where(eq(tasks.cycleId, cycleId));

  // Compute real burndown data from cycle tasks
  const now = new Date();
  const totalDays = differenceInDays(cycle.endsAt, cycle.startsAt) || 1;
  const periodCount = Math.min(totalDays, 14);
  const totalPoints = cycleTasks.reduce((sum, t) => sum + (t.estimatePoints || 1), 0) || cycleTasks.length;
  const ideal = Array.from({length: periodCount}, (_, i) => Math.round(totalPoints * (1 - i / (periodCount - 1 || 1))));
  const actualPoints = [totalPoints];
  for (let i = 1; i < periodCount; i++) {
    const dayDate = addDays(cycle.startsAt, Math.floor(i * totalDays / periodCount));
    const doneByDay = cycleTasks.filter(t => {
      if (!t.completedAt) return false;
      return t.completedAt <= dayDate && (t.state === 'done' || t.state === 'cancelled');
    }).reduce((sum, t) => sum + (t.estimatePoints || 1), 0);
    actualPoints.push(totalPoints - doneByDay);
  }
  const actual = actualPoints;
  const labels = Array.from({length: periodCount}, (_, i) => format(addDays(cycle.startsAt, Math.floor(i * totalDays / periodCount)), "d MMM"));

  return (
    <div>
      <PageHeader 
        title={cycle.name} 
        description={cycle.goal || "Sin meta definida"}
        breadcrumbs={[
          { label: "Proyectos", href: "/os/projects" }, 
          { label: project.name, href: `/os/projects/${id}` },
          { label: "Ciclos", href: `/os/projects/${id}/cycles` },
          { label: cycle.name }
        ]}
        badge={cycle.status === 'active' ? 'Activo' : cycle.status === 'completed' ? 'Completado' : 'Planificado'}
        primaryAction={
          cycle.status !== 'completed' && (
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              {cycle.status === 'planned' ? 'Activar ciclo' : 'Cerrar ciclo'}
            </button>
          )
        }
      />
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">Duración</div>
          <div className="font-medium">{formatShortDate(cycle.startsAt)} - {formatShortDate(cycle.endsAt)}</div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">Tareas</div>
          <div className="font-medium text-2xl">{cycleTasks.length}</div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">Completadas</div>
          <div className="font-medium text-2xl text-[var(--color-primary)]">
            {cycleTasks.filter(t => t.state === 'done').length}
          </div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1">Restantes</div>
          <div className="font-medium text-2xl text-[var(--color-destructive)]">
            {cycleTasks.filter(t => t.state !== 'done' && t.state !== 'cancelled').length}
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6">Burndown</h3>
        {cycleTasks.length > 0 ? (
          <BurndownChart ideal={ideal} actual={actual} labels={labels} width={800} height={250} />
        ) : (
          <div className="py-12 text-center text-[var(--color-muted-foreground)]">
            Sin tareas todavía. Añade tareas al ciclo para ver el burndown.
          </div>
        )}
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Tareas del ciclo</h3>
          <button className="text-sm text-[var(--color-primary)] hover:underline">
            + Añadir tareas
          </button>
        </div>
        
        {cycleTasks.length > 0 ? (
          <div className="text-sm text-[var(--color-muted-foreground)]">
            Lista de tareas irá aquí (reutilizando TaskRow).
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
            El ciclo no tiene tareas asignadas.
          </div>
        )}
      </div>
    </div>
  );
}
