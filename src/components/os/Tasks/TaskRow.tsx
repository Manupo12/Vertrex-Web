"use client";

import { cn } from "@/lib/utils";
import { IdentifierChip } from "./IdentifierChip";
import { TaskStatePill } from "./TaskStatePill";
import { PriorityDot } from "./PriorityDot";
import { TaskAssigneeSelect } from "./TaskAssigneeSelect";
import { TaskQuickEditMenu } from "./TaskQuickEditMenu";
import { formatShortDate } from "@/lib/format";
import { TASK_TYPE_COLORS, TASK_TYPES } from "./TaskFilters";

export interface TaskRowProps {
  task: any;
  users: any[];
  onClick?: () => void;
  onStateChange?: (state: string) => void;
  onPriorityChange?: (priority: number) => void;
  onAssigneesChange?: (userIds: string[]) => void;
  onAssigneeChange?: (userId: string | null) => void;
  className?: string;
  density?: "comfortable" | "compact";
}

export function TaskRow({ task, users, onClick, onStateChange, onPriorityChange, onAssigneesChange, onAssigneeChange, className, density = "comfortable" }: TaskRowProps) {
  return (
    <div 
      className={cn(
        "group flex items-center gap-3 border-b border-[var(--color-border)] px-4 hover:bg-[var(--color-muted)]/30 transition-colors cursor-pointer",
        density === "compact" ? "h-8 text-xs" : "h-11 text-sm",
        task.parentTaskId ? "pl-6 ml-6 border-l-2 border-[var(--color-primary)]/20" : "",
        className
      )}
      onClick={onClick}
    >
      <div className="w-24 shrink-0">
        <IdentifierChip identifier={task.identifier} />
      </div>
      
      <div className="flex-1 truncate font-medium text-[var(--color-foreground)]">
        {task.title}
        {task.taskType && task.taskType !== "other" && (
          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
            style={{ backgroundColor: `${TASK_TYPE_COLORS[task.taskType] || "#94a3b8"}15`, color: TASK_TYPE_COLORS[task.taskType] || "#94a3b8", borderColor: `${TASK_TYPE_COLORS[task.taskType] || "#94a3b8"}30` }}>
            {TASK_TYPES.find(t => t.value === task.taskType)?.label || task.taskType}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div onClick={e => e.stopPropagation()}>
          <TaskQuickEditMenu onStateChange={onStateChange} onPriorityChange={onPriorityChange}>
            <button className="flex items-center gap-2 px-1 hover:bg-[var(--color-muted)] rounded">
              <TaskStatePill state={task.state} showLabel={false} />
              <PriorityDot priority={task.priority} />
            </button>
          </TaskQuickEditMenu>
        </div>

        <div className="w-32 hidden sm:flex" onClick={e => e.stopPropagation()}>
          <TaskAssigneeSelect 
            assigneeIds={[task.assigneeId, ...(task.coAssigneeIds || [])].filter(Boolean)}
            onSelectChange={onAssigneesChange}
            assigneeId={task.assigneeId}
            assigneeName={users.find(u => u.id === task.assigneeId)?.name}
            users={users}
            onSelect={(userId) => onAssigneeChange?.(userId)} 
          />
        </div>

        {task.dueDate && (
          <div className="w-24 hidden md:flex text-[var(--color-muted-foreground)] text-xs">
            {formatShortDate(task.dueDate)}
          </div>
        )}
      </div>
    </div>
  );
}
