"use client";

import { useState } from "react";
import { UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TaskAssigneeSelectProps {
  assigneeId?: string | null;
  assigneeName?: string | null;
  onSelect: (userId: string | null) => void;
  users: Array<{ id: string; name: string }>;
  disabled?: boolean;
}

export function TaskAssigneeSelect({ assigneeId, assigneeName, onSelect, users, disabled }: TaskAssigneeSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button className="inline-flex h-6 items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2 text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-white/10 hover:text-[var(--color-foreground)] transition-colors">
          <UserIcon className="h-3.5 w-3.5" />
          <span>{assigneeName || "Nadie"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onSelect(null)}>
          <UserIcon className="mr-2 h-4 w-4 opacity-50" />
          <span>Nadie (Desasignar)</span>
        </DropdownMenuItem>
        {users.map((u) => (
          <DropdownMenuItem key={u.id} onClick={() => onSelect(u.id)}>
            <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-primary-foreground)]">
              {u.name.substring(0, 2).toUpperCase()}
            </div>
            <span>{u.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
