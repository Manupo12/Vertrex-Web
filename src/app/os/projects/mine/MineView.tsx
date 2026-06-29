"use client";

import { useState, useEffect } from "react";
import { TaskRow } from "@/components/os/Tasks/TaskRow";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle2Icon } from "lucide-react";
import { changeTaskStateAction, setTaskPriorityAction, assignTaskAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskDetailSheet } from "@/components/os/Tasks/TaskDetailSheet";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCreateButton } from "@/components/os/Tasks/TaskCreateButton";
import TaskFilters, { type TaskFilterValues } from "@/components/os/Tasks/TaskFilters";

const DEFAULT_FILTERS: TaskFilterValues = {
  state: "", priority: "", assigneeId: "", cycleId: "", milestoneId: "", tagId: "", taskType: "", search: "", groupBy: "",
};

export function MineView({ initialTasks, projects, users, currentUserId }: { initialTasks: any[], projects: any[], users: any[], currentUserId?: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [filters, setFilters] = useState<TaskFilterValues>(DEFAULT_FILTERS);
  const router = useRouter();

  const filteredTasks = tasks.filter(t => {
    if (filters.priority && String(t.priority) !== filters.priority) return false;
    if (filters.state && t.state !== filters.state) return false;
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

  const handleAssigneesChange = async (id: string, ids: string[]) => {
    try {
      const primaryId = ids[0] || null;
      const coIds = ids.slice(1);
      await assignTaskAction(id, primaryId, coIds);
      setTasks(tasks.map(t => t.id === id ? { ...t, assigneeId: primaryId, coAssigneeIds: coIds } : t));
      toast.success("Asignados actualizados");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const todoTasks = filteredTasks.filter(t => ["todo", "in_progress", "in_review"].includes(t.state));
  const backlogTasks = filteredTasks.filter(t => t.state === "backlog");
  const completedTasks = filteredTasks.filter(t => ["done", "cancelled"].includes(t.state));

  const renderTaskList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="mt-8">
          <EmptyState 
            icon={CheckCircle2Icon} 
            title="Estás al día" 
            description="Buen trabajo. No tienes tareas pendientes aquí." 
            actionLabel="Ir al roadmap"
            onAction={() => router.push('/os/projects/roadmap')}
          />
        </div>
      );
    }
    
    const grouped = list.reduce((acc: any, task: any) => {
      const p = task.projectId || 'inbox';
      if (!acc[p]) acc[p] = [];
      acc[p].push(task);
      return acc;
    }, {});

    return (
      <div className="space-y-6 mt-6">
        {Object.entries(grouped).map(([projectId, pTasks]: [string, any]) => {
          const project = projects.find(p => p.id === projectId);
          return (
            <div key={projectId} className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
              <div className="bg-[var(--color-muted)]/30 px-4 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider border-b border-[var(--color-border)]">
                {project ? project.name : "Inbox"}
              </div>
              {pTasks.map((t: any) => (
                <TaskRow 
                  key={t.id} 
                  task={t} 
                  users={users} 
                  onClick={() => setSelectedTask(t)}
                  onStateChange={(state) => handleStateChange(t.id, state)}
                  onPriorityChange={(priority) => handlePriorityChange(t.id, priority)}
                  onAssigneesChange={(userIds) => handleAssigneesChange(t.id, userIds)}
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TaskFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          users={users}
        />
        <TaskCreateButton projects={projects} users={users} currentUserId={currentUserId} label="+ Nueva tarea" />
      </div>
      <Tabs defaultValue="todo" className="w-full">
        <TabsList>
          <TabsTrigger value="todo">Por hacer ({todoTasks.length})</TabsTrigger>
          <TabsTrigger value="backlog">Backlog ({backlogTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completadas ({completedTasks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="todo">
          {renderTaskList(todoTasks)}
        </TabsContent>
        <TabsContent value="backlog">
          {renderTaskList(backlogTasks)}
        </TabsContent>
        <TabsContent value="completed">
          {renderTaskList(completedTasks)}
        </TabsContent>
      </Tabs>

      <TaskDetailSheet 
        task={selectedTask} 
        open={!!selectedTask} 
        onOpenChange={(open) => !open && setSelectedTask(null)} 
        onEditFull={() => router.push(`/t/${selectedTask?.identifier}`)}
      />
    </div>
  );
}
