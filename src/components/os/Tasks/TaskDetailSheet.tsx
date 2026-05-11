"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { IdentifierChip } from "./IdentifierChip";
import { TaskStatePill } from "./TaskStatePill";
import { PriorityDot } from "./PriorityDot";
import { formatShortDate } from "@/lib/format";

export interface TaskDetailSheetProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditFull?: () => void;
}

export function TaskDetailSheet({ task, open, onOpenChange, onEditFull }: TaskDetailSheetProps) {
  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] w-[90vw] overflow-y-auto" style={{ maxWidth: "720px" }}>
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <IdentifierChip identifier={task.identifier} />
            <TaskStatePill state={task.state} />
            <PriorityDot priority={task.priority} showLabel />
          </div>
          <SheetTitle className="text-xl">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="text-sm text-[var(--color-foreground)]">
              {/* BlockNote content would go here */}
              <p className="opacity-70 italic">Descripción de la tarea...</p>
            </div>
            {onEditFull && (
              <button 
                onClick={onEditFull}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Abrir en pantalla completa para editar
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-3 bg-[var(--color-card)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Propiedades</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-[var(--color-muted-foreground)]">Estado</span>
                <span>{task.state}</span>
                <span className="text-[var(--color-muted-foreground)]">Prioridad</span>
                <span>{task.priority}</span>
                <span className="text-[var(--color-muted-foreground)]">Vencimiento</span>
                <span>{formatShortDate(task.dueDate) || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
