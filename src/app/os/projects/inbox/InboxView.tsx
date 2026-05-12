"use client";

import { useState, useEffect } from "react";
import { TaskRow } from "@/components/os/Tasks/TaskRow";
import { InboxIcon } from "lucide-react";
import { changeTaskStateAction, setTaskPriorityAction, assignTaskAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskDetailSheet } from "@/components/os/Tasks/TaskDetailSheet";
import { useRouter } from "next/navigation";
import { TaskCreateButton } from "@/components/os/Tasks/TaskCreateButton";
import TaskFilters, { type TaskFilterValues } from "@/components/os/Tasks/TaskFilters";

const DEFAULT_FILTERS: TaskFilterValues = {
  state: "", priority: "", assigneeId: "", cycleId: "", milestoneId: "", tagId: "", taskType: "", search: "", groupBy: "",
};

export function InboxView({ initialTasks, users, currentUserId }: { initialTasks: any[], users: any[], currentUserId?: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [filters, setFilters] = useState<TaskFilterValues>(DEFAULT_FILTERS);
  const router = useRouter();

  const filteredTasks = tasks.filter(t => {
    if (filters.priority && String(t.priority) !== filters.priority) return false;
    if (filters.state && t.state !== filters.state) return false;
    if (filters.assigneeId && t.assigneeId !== filters.assigneeId) return false;
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
      <div className="mt-6">
        <div className="mb-4">
          <TaskCreateButton users={users} currentUserId={currentUserId} label="+ Nueva tarea" />
        </div>
        <TaskFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          users={users}
        />
        <div className="text-center py-12">
          <InboxIcon className="h-12 w-12 mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-30" />
          <h3 className="text-lg font-medium mb-2">Bandeja vacía</h3>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">Sin tareas para triage.</p>
          <TaskCreateButton users={users} currentUserId={currentUserId} label="+ Capturar tarea" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TaskFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          users={users}
        />
        <TaskCreateButton users={users} currentUserId={currentUserId} label="+ Nueva tarea" />
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
        onEditFull={() => router.push(`/t/${selectedTask?.identifier}`)}
      />
    </div>
    </div>
  );
}
