"use client";

import { useState } from "react";
import { KanbanIcon } from "lucide-react";
import { changeTaskStateAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskDetailSheet } from "@/components/os/Tasks/TaskDetailSheet";
import { TaskCreateButton } from "@/components/os/Tasks/TaskCreateButton";
import { useRouter } from "next/navigation";
import { IdentifierChip } from "@/components/os/Tasks/IdentifierChip";
import { PriorityDot } from "@/components/os/Tasks/PriorityDot";
import { KanbanBoard } from "@/components/os/data/KanbanBoard";

const COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Pendiente" },
  { id: "in_progress", label: "En desarrollo" },
  { id: "in_review", label: "En revisión" },
  { id: "done", label: "Listo" }
];

export function BoardView({ initialTasks, users, projectId, projects, cycles, milestones }: { initialTasks: any[], users: any[], projectId: string, projects?: any[], cycles?: any[], milestones?: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const router = useRouter();

  if (tasks.length === 0) {
    return (
      <div className="mt-8">
        <div className="text-center py-12">
          <KanbanIcon className="h-12 w-12 mx-auto mb-4 text-[var(--color-muted-foreground)] opacity-30" />
          <h3 className="text-lg font-medium mb-2">Tablero vacío</h3>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-6">Crea la primera tarea para activar el tablero.</p>
          <TaskCreateButton projectId={projectId} users={users} projects={projects} cycles={cycles} milestones={milestones} label="+ Crear primera tarea" />
        </div>
      </div>
    );
  }

  const handleStateChange = async (id: string, state: string) => {
    try {
      setTasks(tasks.map(t => t.id === id ? { ...t, state } : t));
      await changeTaskStateAction(id, state);
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const boardItems = tasks.map(t => ({ id: t.id, status: t.state }));

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div />
        <TaskCreateButton projectId={projectId} users={users} projects={projects} cycles={cycles} milestones={milestones} />
      </div>

      <KanbanBoard
        items={boardItems}
        columns={COLUMNS}
        onItemMove={handleStateChange}
        renderItem={(item) => {
          const t = tasks.find(tt => tt.id === item.id);
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
