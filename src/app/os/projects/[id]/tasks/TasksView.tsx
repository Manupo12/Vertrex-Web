"use client";

import { useState } from "react";
import { TaskRow } from "@/components/os/Tasks/TaskRow";
import { CheckSquareIcon } from "lucide-react";
import { changeTaskStateAction, setTaskPriorityAction, assignTaskAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskDetailSheet } from "@/components/os/Tasks/TaskDetailSheet";
import { TaskCreateButton } from "@/components/os/Tasks/TaskCreateButton";
import { useRouter } from "next/navigation";

export function TasksView({ initialTasks, users, projectId, projects, cycles, milestones }: { initialTasks: any[], users: any[], projectId: string, projects?: any[], cycles?: any[], milestones?: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const router = useRouter();

  const handleStateChange = async (id: string, state: string) => {
    try {
      await changeTaskStateAction(id, state);
      setTasks(tasks.map(t => t.id === id ? { ...t, state } : t));
      toast.success("Estado actualizado");
    } catch (e) {
      toast.error("Error al actualizar");
    }
  };

  const handlePriorityChange = async (id: string, priority: number) => {
    try {
      await setTaskPriorityAction(id, priority);
      setTasks(tasks.map(t => t.id === id ? { ...t, priority } : t));
      toast.success("Prioridad actualizada");
    } catch (e) {
      toast.error("Error al actualizar");
    }
  };

  const handleAssigneeChange = async (id: string, assigneeId: string | null) => {
    try {
      await assignTaskAction(id, assigneeId);
      setTasks(tasks.map(t => t.id === id ? { ...t, assigneeId } : t));
      toast.success("Asignado actualizado");
    } catch (e) {
      toast.error("Error al actualizar");
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="mt-8">
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
      <div className="flex items-center justify-between mb-4">
        <div />
        <TaskCreateButton projectId={projectId} users={users} projects={projects} cycles={cycles} milestones={milestones} />
      </div>
      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
        {tasks.map(t => (
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
