"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { createTaskAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskAssigneeSelect } from "./TaskAssigneeSelect";
import { PriorityDot } from "./PriorityDot";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FlagIcon } from "lucide-react";

export function QuickTaskModal({ open, onOpenChange, projects, users, currentUserId }: { open: boolean, onOpenChange: (open: boolean) => void, projects: any[], users: any[], currentUserId?: string }) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [assigneeId, setAssigneeId] = useState<string | null>(currentUserId || null);
  const [priority, setPriority] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const task = await createTaskAction({ title, projectId, assigneeId: assigneeId || undefined, priority });
      toast.success(`Tarea creada · ${task.identifier}`);
      setTitle("");
      setProjectId(undefined);
      setAssigneeId(currentUserId || null);
      setPriority(0);
      onOpenChange(false);
    } catch (e) {
      toast.error("Error al crear la tarea");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden gap-0 border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="p-4">
          <input
            autoFocus
            type="text"
            placeholder="Captura una tarea..."
            className="w-full bg-transparent border-none outline-none text-lg font-medium placeholder:text-[var(--color-muted-foreground)] focus:ring-0"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
          />
        </div>
        <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-muted)]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              className="text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1 max-w-[150px] truncate"
              value={projectId || ""}
              onChange={(e) => setProjectId(e.target.value || undefined)}
            >
              <option value="">Inbox</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            <TaskAssigneeSelect
              assigneeId={assigneeId}
              assigneeName={users.find(u => u.id === assigneeId)?.name}
              users={users}
              onSelect={setAssigneeId}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex h-6 items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2 text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-white/10 hover:text-[var(--color-foreground)] transition-colors">
                  {priority === 0 ? <FlagIcon className="h-3.5 w-3.5" /> : <PriorityDot priority={priority} />}
                  <span>{priority === 0 ? "Prioridad" : ""}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-32">
                {[0, 4, 3, 2, 1].map((p) => (
                  <DropdownMenuItem key={p} onClick={() => setPriority(p)}>
                    <PriorityDot priority={p} showLabel />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="text-xs text-[var(--color-muted-foreground)] hidden sm:flex items-center gap-1">
            <span className="bg-[var(--color-muted)] px-1.5 rounded font-medium border border-[var(--color-border)] shadow-sm">Enter</span>
            <span>guardar</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
