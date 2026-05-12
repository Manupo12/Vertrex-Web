"use client";

import { useState, useEffect } from "react";
import { TaskRow } from "@/components/os/Tasks/TaskRow";
import { CheckSquareIcon } from "lucide-react";
import { changeTaskStateAction, setTaskPriorityAction, assignTaskAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskDetailSheet } from "@/components/os/Tasks/TaskDetailSheet";
import { TaskCreateButton } from "@/components/os/Tasks/TaskCreateButton";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TaskFilters, { type TaskFilterValues } from "@/components/os/Tasks/TaskFilters";
import { SavedViewBar } from "@/components/os/SavedViews/SavedViewBar";
import { listSavedViewsAction, createSavedViewAction, updateSavedViewAction, deleteSavedViewAction } from "@/lib/db/actions/saved-views";

const DEFAULT_FILTERS: TaskFilterValues = {
  state: "", priority: "", assigneeId: "", cycleId: "", milestoneId: "", tagId: "", taskType: "", search: "", groupBy: "",
};

export function TasksView({ initialTasks, users, projectId, projects, cycles, milestones }: { initialTasks: any[], users: any[], projectId: string, projects?: any[], cycles?: any[], milestones?: any[] }) {
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

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const merged: TaskFilterValues = { ...DEFAULT_FILTERS };
    for (const key of Object.keys(DEFAULT_FILTERS)) {
      if (params[key]) (merged as any)[key] = params[key];
    }
    setFilters(merged);
  }, [searchParams]);

  const filteredTasks = tasks.filter(t => {
    if (filters.state && t.state !== filters.state) return false;
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
      await changeTaskStateAction(id, state);
      setTasks(tasks.map(t => t.id === id ? { ...t, state } : t));
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handlePriorityChange = async (id: string, priority: number) => {
    try {
      await setTaskPriorityAction(id, priority);
      setTasks(tasks.map(t => t.id === id ? { ...t, priority } : t));
      toast.success("Prioridad actualizada");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleAssigneeChange = async (id: string, assigneeId: string | null) => {
    try {
      await assignTaskAction(id, assigneeId);
      setTasks(tasks.map(t => t.id === id ? { ...t, assigneeId } : t));
      toast.success("Asignado actualizado");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="mt-8">
        <SavedViewBar
          route={pathname}
          views={savedViews}
          currentViewId={currentViewId}
          onSelectView={(id) => {
            setCurrentViewId(id === 'default' ? null : id);
          }}
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
          <CheckSquareIcon className="h-12 w-12 mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-30" />
          <h3 className="text-lg font-medium mb-2">No hay tareas aún</h3>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">Comienza a organizar el trabajo creando la primera tarea.</p>
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
        onSelectView={(id) => {
          setCurrentViewId(id === 'default' ? null : id);
        }}
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
      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        {filteredTasks.map(t => (
          <TaskRow 
            key={t.id} 
            task={t} 
            users={users} 
            onClick={() => setSelectedTask(t)}
            onStateChange={(state) => handleStateChange(t.id, state)}
            onPriorityChange={(priority) => handlePriorityChange(t.id, priority)}
            onAssigneeChange={(userId) => handleAssigneeChange(t.id, userId)}
          />
        ))}
        <TaskDetailSheet 
          task={selectedTask} 
          open={!!selectedTask} 
          onOpenChange={(open) => !open && setSelectedTask(null)} 
          onEditFull={() => router.push(`/os/projects/${projectId}/tasks/${selectedTask?.id}`)}
          onDelete={() => setTasks(tasks.filter(t => t.id !== selectedTask?.id))}
          users={users}
        />
      </div>
    </div>
  );
}
