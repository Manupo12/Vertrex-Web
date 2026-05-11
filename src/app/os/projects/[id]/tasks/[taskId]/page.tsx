import { db } from "@/lib/db";
import { tasks, users, projects, entityLinks } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { IdentifierChip } from "@/components/os/Tasks/IdentifierChip";
import { TaskStatePill } from "@/components/os/Tasks/TaskStatePill";
import { PriorityDot } from "@/components/os/Tasks/PriorityDot";
import { requireOsUser } from "@/lib/auth/session";
import { BlockEditor } from "@/components/os/Editor/BlockEditor";
import { formatShortDate } from "@/lib/format";
import { AddSubtaskForm } from "./AddSubtaskForm";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string, taskId: string }> }) {
  await requireOsUser();
  const { id, taskId } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) throw new Error("Proyecto no encontrado");

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task) throw new Error("Tarea no encontrada");

  const allUsers = await db.select().from(users);

  const subtasks = await db.select().from(tasks).where(eq(tasks.parentTaskId, taskId));
  const blockingLinks = await db.select().from(entityLinks).where(and(eq(entityLinks.sourceId, taskId), eq(entityLinks.relationType, "blocks")));
  const blockedByLinks = await db.select().from(entityLinks).where(and(eq(entityLinks.targetId, taskId), eq(entityLinks.relationType, "blocked_by")));
  const blockingTasks = await db.select().from(tasks).where(inArray(tasks.id, blockingLinks.map(l => l.targetId)));
  const blockedByTasks = await db.select().from(tasks).where(inArray(tasks.id, blockedByLinks.map(l => l.sourceId)));

  return (
    <div>
      <PageHeader 
        title={task.title} 
        breadcrumbs={[
          { label: "Proyectos", href: "/os/projects" }, 
          { label: project.name, href: `/os/projects/${id}` },
          { label: "Tareas", href: `/os/projects/${id}/tasks` },
          { label: task.identifier }
        ]}
      />
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--color-border)]">
            <IdentifierChip identifier={task.identifier} />
            <TaskStatePill state={task.state} />
            <PriorityDot priority={task.priority} showLabel />
          </div>
          
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
            {/* 
              This is a Client Component block. We would normally pass the content
              and handle updates. For now, it's read-only in this Server Component wrapper. 
            */}
            <BlockEditor 
              initialContent={task.descriptionJson} 
              onChange={() => {}} 
              editable={false} 
            />
          </div>

          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Subtareas ({subtasks.length})</h3>
            {subtasks.length > 0 ? (
              <div className="space-y-2">
                {subtasks.map(st => (
                  <div key={st.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--color-muted)]/30 transition-colors">
                    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 ${st.state === 'done' ? 'bg-green-500 border-green-500' : 'border-[var(--color-border)]'}`}>
                      {st.state === 'done' && <span className="text-white text-[8px] flex items-center justify-center">✓</span>}
                    </div>
                    <span className="text-sm font-mono text-[var(--color-muted-foreground)]">{st.identifier}</span>
                    <span className={`text-sm flex-1 ${st.state === 'done' ? 'line-through text-[var(--color-muted-foreground)]' : ''}`}>{st.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">Sin subtareas.</p>
            )}
            <AddSubtaskForm parentTaskId={taskId} />
          </div>
          
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Bloqueos</h3>
            {blockingTasks.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase mb-2">Esta tarea bloquea</p>
                <div className="space-y-2">
                  {blockingTasks.map(bt => (
                    <div key={bt.id} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <span className="font-mono text-[var(--color-muted-foreground)]">{bt.identifier}</span>
                      <span>{bt.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {blockedByTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase mb-2">Bloqueada por</p>
                <div className="space-y-2">
                  {blockedByTasks.map(bt => (
                    <div key={bt.id} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                      <span className="font-mono text-[var(--color-muted-foreground)]">{bt.identifier}</span>
                      <span>{bt.title}</span>
                      {bt.state === 'done' && <span className="text-[10px] text-green-500 ml-auto">✓ Resuelto</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {blockingTasks.length === 0 && blockedByTasks.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)]">Sin bloqueos registrados.</p>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-4">Propiedades</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Asignado</span>
                <span className="col-span-2 font-medium">
                  {allUsers.find(u => u.id === task.assigneeId)?.name || "Nadie"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Estado</span>
                <span className="col-span-2"><TaskStatePill state={task.state} size="sm" /></span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Prioridad</span>
                <span className="col-span-2 flex items-center gap-2"><PriorityDot priority={task.priority} showLabel /></span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Vencimiento</span>
                <span className="col-span-2 font-medium">{formatShortDate(task.dueDate) || "Sin fecha"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
