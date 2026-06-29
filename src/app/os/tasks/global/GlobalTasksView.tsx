"use client";

import { useState } from "react";
import { FolderKanban, Search, X } from "lucide-react";
import { changeTaskStateAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskDetailSheet } from "@/components/os/Tasks/TaskDetailSheet";
import { useRouter } from "next/navigation";
import { IdentifierChip } from "@/components/os/Tasks/IdentifierChip";
import { PriorityDot } from "@/components/os/Tasks/PriorityDot";
import { KanbanBoard } from "@/components/os/data/KanbanBoard";

interface GlobalTasksViewProps {
  initialTasks: any[];
  users: any[];
  projects: any[];
  cycles: any[];
  milestones: any[];
  session: { userId: string; email: string; name: string; role: string };
}

export function GlobalTasksView({
  initialTasks,
  users,
  projects,
  session
}: GlobalTasksViewProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const router = useRouter();

  const handleReset = () => {
    setSearch("");
    setProjectFilter("");
    setAssigneeFilter("");
    setPriorityFilter("");
    setTypeFilter("");
  };

  const filteredTasks = tasks.filter(t => {
    if (search && !t.title?.toLowerCase().includes(search.toLowerCase()) && !t.identifier?.toLowerCase().includes(search.toLowerCase())) return false;
    if (projectFilter && t.projectId !== projectFilter) return false;
    if (assigneeFilter) {
      const allIds = [t.assigneeId, ...(t.coAssigneeIds || [])].filter(Boolean);
      if (!allIds.includes(assigneeFilter)) return false;
    }
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (typeFilter && t.taskType !== typeFilter) return false;
    return true;
  });

  const handleStateChange = async (taskId: string, newState: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isAdmin = session.role === "admin";
    const allIds = [task.assigneeId, ...(task.coAssigneeIds || [])].filter(Boolean);
    const isAssignee = allIds.includes(session.userId);

    if (!isAdmin && !isAssignee) {
      toast.error("No tienes permisos para mover esta tarea. Solo el miembro asignado o el administrador pueden moverla.");
      throw new Error("Unauthorized drag and drop");
    }

    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, state: newState } : t));
      await changeTaskStateAction(taskId, newState);
      toast.success("Estado de la tarea actualizado");
    } catch (err: any) {
      toast.error(err.message || "Error al mover la tarea");
      // Revert state
      setTasks(initialTasks);
      throw err;
    }
  };

  const boardItems = filteredTasks.map(t => ({ id: t.id, status: t.state }));

  const COLUMNS = [
    { id: "backlog", label: "Backlog" },
    { id: "todo", label: "Pendiente" },
    { id: "in_progress", label: "En desarrollo" },
    { id: "in_review", label: "En revisión" },
    { id: "done", label: "Listo" }
  ];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-card/50 border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {(search || projectFilter || assigneeFilter || priorityFilter || typeFilter) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-end md:self-auto"
            >
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Proyecto</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Todos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Asignado</label>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Todos</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Prioridad</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Todas</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Todos</option>
              <option value="code">Código</option>
              <option value="design">Diseño</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="support">Soporte</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-card/25 border border-dashed border-border rounded-xl">
          <FolderKanban className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-45" />
          <p className="text-sm text-muted-foreground">No se encontraron tareas con los filtros aplicados.</p>
        </div>
      ) : (
        <KanbanBoard
          items={boardItems}
          columns={COLUMNS}
          onItemMove={handleStateChange}
          renderItem={(item) => {
            const t = filteredTasks.find(tt => tt.id === item.id);
            if (!t) return null;
            const project = projects.find(p => p.id === t.projectId);
            const assignee = users.find(u => u.id === t.assigneeId);
            return (
              <div 
                className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer group shadow-sm flex flex-col gap-2.5"
                onClick={() => setSelectedTask(t)}
              >
                <div className="flex items-center justify-between gap-2">
                  <IdentifierChip identifier={t.identifier} />
                  <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded font-medium max-w-[120px] truncate" title={project?.name}>
                    {project?.name || "Sin proyecto"}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-foreground line-clamp-2">{t.title}</h4>
                <div className="flex items-center justify-between mt-1">
                  <PriorityDot priority={t.priority} />
                  {(() => {
                    const ids = [t.assigneeId, ...(t.coAssigneeIds || [])].filter(Boolean) as string[];
                    if (ids.length === 0) return null;
                    return (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {ids.slice(0, 3).map((uid) => {
                          const user = users.find(u => u.id === uid);
                          if (!user) return null;
                          return (
                            <div 
                              key={uid} 
                              className="inline-block h-5 w-5 rounded-full ring-2 ring-card bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center"
                              title={user.name}
                            >
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                          );
                        })}
                        {ids.length > 3 && (
                          <div 
                            className="inline-block h-5 w-5 rounded-full ring-2 ring-card bg-muted text-[8px] font-bold text-muted-foreground flex items-center justify-center"
                            title={`${ids.length - 3} más`}
                          >
                            +{ids.length - 3}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          }}
        />
      )}

      <TaskDetailSheet 
        task={selectedTask} 
        open={!!selectedTask} 
        onOpenChange={(open) => !open && setSelectedTask(null)} 
        onEditFull={() => router.push(`/os/projects/${selectedTask?.projectId}/tasks/${selectedTask?.id}`)}
        onDelete={() => setTasks(tasks.filter(t => t.id !== selectedTask?.id))}
        users={users}
      />
    </div>
  );
}
