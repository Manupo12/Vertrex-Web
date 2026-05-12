"use client";

import { useState } from "react";
import { TaskRow } from "@/components/os/Tasks/TaskRow";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle2Icon } from "lucide-react";
import { changeTaskStateAction, setTaskPriorityAction, assignTaskAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskDetailSheet } from "@/components/os/Tasks/TaskDetailSheet";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCreateButton } from "@/components/os/Tasks/TaskCreateButton";

export function MineView({ initialTasks, projects, users, currentUserId }: { initialTasks: any[], projects: any[], users: any[], currentUserId?: string }) {
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

  const todoTasks = tasks.filter(t => ["todo", "in_progress", "in_review"].includes(t.state));
  const backlogTasks = tasks.filter(t => t.state === "backlog");
  const completedTasks = tasks.filter(t => ["done", "cancelled"].includes(t.state));

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
    
    // Group by project
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
                  onAssigneeChange={(userId) => handleAssigneeChange(t.id, userId)}
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
      <div className="mb-4">
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
