"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { createTaskAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { TaskAssigneeSelect } from "./TaskAssigneeSelect";
import { PriorityDot } from "./PriorityDot";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FlagIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";

const TASK_TYPES = [
  { value: "code", label: "Código" },
  { value: "design", label: "Diseño" },
  { value: "marketing", label: "Marketing" },
  { value: "content", label: "Contenido" },
  { value: "document", label: "Documento" },
  { value: "meeting", label: "Reunión" },
  { value: "research", label: "Investigación" },
  { value: "ops", label: "Operaciones" },
  { value: "support", label: "Soporte" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "other", label: "Otro" },
];

export function QuickTaskModal({
  open, onOpenChange, projects, users, currentUserId,
  cycles, milestones, taskTypes, parentTaskId: defaultParentTaskId,
  defaultProjectId, defaultCycleId, defaultMilestoneId
}: {
  open: boolean; onOpenChange: (open: boolean) => void;
  projects: any[]; users: any[]; currentUserId?: string;
  cycles?: any[]; milestones?: any[]; taskTypes?: { value: string; label: string }[];
  parentTaskId?: string; defaultProjectId?: string; defaultCycleId?: string; defaultMilestoneId?: string;
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId || undefined);
  const [assigneeId, setAssigneeId] = useState<string | null>(currentUserId || null);
  const [priority, setPriority] = useState<number>(0);
  const [taskType, setTaskType] = useState<string>("other");
  const [dueDate, setDueDate] = useState<string>("");
  const [estimatePoints, setEstimatePoints] = useState<number>(0);
  const [cycleId, setCycleId] = useState<string | undefined>(defaultCycleId || undefined);
  const [milestoneId, setMilestoneId] = useState<string | undefined>(defaultMilestoneId || undefined);
  const [parentTaskId] = useState<string | undefined>(defaultParentTaskId || undefined);
  const [description, setDescription] = useState("");
  const [showExtraOptions, setShowExtraOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const task = await createTaskAction({
        title,
        projectId,
        parentTaskId,
        assigneeId: assigneeId || undefined,
        priority,
        taskType,
        dueDate: dueDate || undefined,
        estimatePoints: estimatePoints || undefined,
        cycleId,
        milestoneId,
      });
      toast.success(`Tarea creada · ${task.identifier}`);
      setTitle("");
      setProjectId(defaultProjectId || undefined);
      setAssigneeId(currentUserId || null);
      setPriority(0);
      setTaskType("other");
      setDueDate("");
      setEstimatePoints(0);
      setCycleId(defaultCycleId || undefined);
      setMilestoneId(defaultMilestoneId || undefined);
      setDescription("");
      setShowExtraOptions(false);
      onOpenChange(false);
    } catch {
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

  const types = taskTypes || TASK_TYPES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden gap-0 border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="p-4">
          {parentTaskId && (
            <div className="text-xs text-[var(--color-muted-foreground)] mb-2 bg-[var(--color-primary)]/5 px-2 py-1 rounded-md border border-[var(--color-primary)]/10">
              Creando subtarea
            </div>
          )}
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
              <option value="">Bandeja (sin proyecto)</option>
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

        <div className="border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setShowExtraOptions(!showExtraOptions)}
            className="flex items-center gap-1.5 w-full px-4 py-2 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/30 transition-colors"
          >
            {showExtraOptions ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
            {showExtraOptions ? "Menos opciones" : "Más opciones"}
          </button>
          {showExtraOptions && (
            <div className="grid grid-cols-2 gap-3 p-4 border-t border-[var(--color-border)]">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Tipo</label>
                <select
                  className="w-full text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1.5"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                >
                  {types.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Vencimiento</label>
                <input
                  type="date"
                  className="w-full text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1.5"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              {cycles && cycles.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Ciclo</label>
                  <select
                    className="w-full text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1.5"
                    value={cycleId || ""}
                    onChange={(e) => setCycleId(e.target.value || undefined)}
                  >
                    <option value="">Sin ciclo</option>
                    {cycles.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.title || c.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {milestones && milestones.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Hito</label>
                  <select
                    className="w-full text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1.5"
                    value={milestoneId || ""}
                    onChange={(e) => setMilestoneId(e.target.value || undefined)}
                  >
                    <option value="">Sin hito</option>
                    {milestones.map(m => (
                      <option key={m.id} value={m.id}>{m.name || m.title || m.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Puntos estimados</label>
                <input
                  type="number"
                  min="0"
                  className="w-full text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1.5"
                  value={estimatePoints || ""}
                  onChange={(e) => setEstimatePoints(Number(e.target.value))}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Descripción</label>
                <textarea
                  className="w-full text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1.5 min-h-[60px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción de la tarea..."
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
