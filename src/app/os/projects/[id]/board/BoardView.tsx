"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanIcon } from "lucide-react";
import { changeTaskStateAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskDetailSheet } from "@/components/os/Tasks/TaskDetailSheet";
import { useRouter } from "next/navigation";
import { IdentifierChip } from "@/components/os/Tasks/IdentifierChip";
import { PriorityDot } from "@/components/os/Tasks/PriorityDot";
import { stateToken } from "@/lib/utils";

const COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Pendiente" },
  { id: "in_progress", label: "En desarrollo" },
  { id: "in_review", label: "En revisión" },
  { id: "done", label: "Listo" }
];

export function BoardView({ initialTasks, users, projectId }: { initialTasks: any[], users: any[], projectId: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const router = useRouter();

  if (tasks.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState 
          icon={KanbanIcon} 
          title="Tablero vacío" 
          description="Crea la primera tarea para activar el tablero." 
          actionLabel="Ir a la lista de tareas"
          onAction={() => router.push(`/os/projects/${projectId}/tasks`)}
        />
      </div>
    );
  }

  const handleStateChange = async (id: string, state: string) => {
    try {
      // Optimistic
      setTasks(tasks.map(t => t.id === id ? { ...t, state } : t));
      await changeTaskStateAction(id, state);
      toast.success("Estado actualizado");
    } catch (e) {
      toast.error("Error al actualizar");
      // Revert optimistic could be done here
    }
  };

  return (
    <div className="mt-6 flex gap-4 overflow-x-auto pb-4 items-start h-[calc(100vh-200px)]">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.state === col.id);
        const color = stateToken(col.id);

        return (
          <div key={col.id} className="min-w-[280px] w-[280px] flex flex-col max-h-full bg-[var(--color-card)] rounded-lg border border-[var(--color-border)]">
            <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 bg-[var(--color-card)] rounded-t-lg z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <h3 className="font-semibold text-sm">{col.label}</h3>
              </div>
              <span className="text-xs text-[var(--color-muted-foreground)] bg-[var(--color-muted)] px-2 py-0.5 rounded-full">{colTasks.length}</span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {colTasks.map(t => (
                <div 
                  key={t.id} 
                  className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-md p-3 shadow-sm hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedTask(t)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <IdentifierChip identifier={t.identifier} />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <select 
                        className="text-xs bg-[var(--color-muted)] border-none rounded px-1 py-0.5 cursor-pointer"
                        value={t.state}
                        onChange={(e) => handleStateChange(t.id, e.target.value)}
                      >
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
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
              ))}
            </div>
          </div>
        );
      })}

      <TaskDetailSheet 
        task={selectedTask} 
        open={!!selectedTask} 
        onOpenChange={(open) => !open && setSelectedTask(null)} 
        onEditFull={() => router.push(`/os/projects/${projectId}/tasks/${selectedTask?.id}`)}
      />
    </div>
  );
}
