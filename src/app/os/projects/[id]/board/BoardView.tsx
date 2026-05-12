"use client";

import { useState, useEffect } from "react";
import { KanbanIcon } from "lucide-react";
import { changeTaskStateAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskDetailSheet } from "@/components/os/Tasks/TaskDetailSheet";
import { TaskCreateButton } from "@/components/os/Tasks/TaskCreateButton";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { IdentifierChip } from "@/components/os/Tasks/IdentifierChip";
import { PriorityDot } from "@/components/os/Tasks/PriorityDot";
import { KanbanBoard } from "@/components/os/data/KanbanBoard";
import TaskFilters, { type TaskFilterValues } from "@/components/os/Tasks/TaskFilters";
import { SavedViewBar } from "@/components/os/SavedViews/SavedViewBar";
import { listSavedViewsAction, createSavedViewAction, deleteSavedViewAction } from "@/lib/db/actions/saved-views";

const COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Pendiente" },
  { id: "in_progress", label: "En desarrollo" },
  { id: "in_review", label: "En revisión" },
  { id: "done", label: "Listo" }
];

const DEFAULT_FILTERS: TaskFilterValues = {
  state: "", priority: "", assigneeId: "", cycleId: "", milestoneId: "", tagId: "", taskType: "", search: "", groupBy: "",
};

export function BoardView({ initialTasks, users, projectId, projects, cycles, milestones }: { initialTasks: any[], users: any[], projectId: string, projects?: any[], cycles?: any[], milestones?: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [filters, setFilters] = useState<TaskFilterValues>(DEFAULT_FILTERS);
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    listSavedViewsAction(pathname).then(setSavedViews);
  }, [pathname]);

  const filteredTasks = tasks.filter(t => {
    if (filters.priority && String(t.priority) !== filters.priority) return false;
    if (filters.assigneeId && t.assigneeId !== filters.assigneeId) return false;
    if (filters.cycleId && t.cycleId !== filters.cycleId) return false;
    if (filters.milestoneId && t.milestoneId !== filters.milestoneId) return false;
    if (filters.taskType && t.taskType !== filters.taskType) return false;
    if (filters.search && !t.title?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleStateChange = async (id: string, state: string) => {
    try {
      setTasks(tasks.map(t => t.id === id ? { ...t, state } : t));
      await changeTaskStateAction(id, state);
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const boardItems = filteredTasks.map(t => ({ id: t.id, status: t.state }));

  if (tasks.length === 0) {
    return (
      <div className="mt-8">
        <SavedViewBar
          route={pathname}
          views={savedViews}
          currentViewId={currentViewId}
          onSelectView={(id) => setCurrentViewId(id === 'default' ? null : id)}
          onSaveView={async () => {
            const name = prompt("Nombre de la vista:");
            if (!name) return;
            await createSavedViewAction(name, pathname, Object.fromEntries(searchParams.entries()) as Record<string, unknown>);
            setSavedViews(await listSavedViewsAction(pathname));
            toast.success("Vista guardada");
          }}
          onDeleteView={async (viewId) => {
            await deleteSavedViewAction(viewId);
            setSavedViews(await listSavedViewsAction(pathname));
            toast.success("Vista eliminada");
          }}
        />
        <TaskFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          users={users}
          cycles={cycles}
          milestones={milestones}
        />
        <div className="text-center py-12">
          <KanbanIcon className="h-12 w-12 mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-30" />
          <h3 className="text-lg font-medium mb-2">Tablero vacío</h3>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">Crea la primera tarea para activar el tablero.</p>
          <TaskCreateButton projectId={projectId} users={users} projects={projects} cycles={cycles} milestones={milestones} label="+ Crear primera tarea" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <SavedViewBar
        route={pathname}
        views={savedViews}
        currentViewId={currentViewId}
        onSelectView={(id) => setCurrentViewId(id === 'default' ? null : id)}
        onSaveView={async () => {
          const name = prompt("Nombre de la vista:");
          if (!name) return;
          await createSavedViewAction(name, pathname, Object.fromEntries(searchParams.entries()) as Record<string, unknown>);
          setSavedViews(await listSavedViewsAction(pathname));
          toast.success("Vista guardada");
        }}
        onDeleteView={async (viewId) => {
          await deleteSavedViewAction(viewId);
          setSavedViews(await listSavedViewsAction(pathname));
          toast.success("Vista eliminada");
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <TaskFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          users={users}
          cycles={cycles}
          milestones={milestones}
        />
        <TaskCreateButton projectId={projectId} users={users} projects={projects} cycles={cycles} milestones={milestones} />
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-muted-foreground)]">No se encontraron tareas con los filtros actuales.</div>
      ) : (
        <KanbanBoard
          items={boardItems}
          columns={COLUMNS}
          onItemMove={handleStateChange}
          renderItem={(item) => {
            const t = filteredTasks.find(tt => tt.id === item.id);
            if (!t) return null;
            return (
              <div 
                className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-md p-3 shadow-sm hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedTask(t)}
              >
                <div className="flex items-start justify-between mb-2">
                  <IdentifierChip identifier={t.identifier} />
                </div>
                <h4 className="text-sm font-medium mb-3">{t.title}</h4>
                <div className="flex items-center justify-between mt-auto">
                  <PriorityDot priority={t.priority} />
                  {t.assigneeId && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-primary-foreground)]" title={users.find(u => u.id === t.assigneeId)?.name}>
                      {users.find(u => u.id === t.assigneeId)?.name?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
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
        onEditFull={() => router.push(`/os/projects/${projectId}/tasks/${selectedTask?.id}`)}
        onDelete={() => setTasks(tasks.filter(t => t.id !== selectedTask?.id))}
        users={users}
      />
    </div>
  );
}
