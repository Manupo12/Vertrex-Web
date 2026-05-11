"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { TaskStatePill } from "./TaskStatePill";
import { PriorityDot } from "./PriorityDot";

export interface TaskQuickEditMenuProps {
  children: React.ReactNode;
  onStateChange?: (state: string) => void;
  onPriorityChange?: (priority: number) => void;
  disabled?: boolean;
}

const STATES = ["backlog", "todo", "in_progress", "in_review", "done", "cancelled"];

export function TaskQuickEditMenu({ children, onStateChange, onPriorityChange, disabled }: TaskQuickEditMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {onStateChange && (
          <>
            <DropdownMenuLabel className="text-xs">Estado</DropdownMenuLabel>
            {STATES.map((s) => (
              <DropdownMenuItem key={s} onClick={() => onStateChange(s)}>
                <TaskStatePill state={s} />
              </DropdownMenuItem>
            ))}
          </>
        )}
        {onStateChange && onPriorityChange && <DropdownMenuSeparator />}
        {onPriorityChange && (
          <>
            <DropdownMenuLabel className="text-xs">Prioridad</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onPriorityChange(0)}><PriorityDot priority={0} showLabel /> </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange(4)}><PriorityDot priority={4} showLabel /> </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange(3)}><PriorityDot priority={3} showLabel /> </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange(2)}><PriorityDot priority={2} showLabel /> </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange(1)}><PriorityDot priority={1} showLabel /> </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
