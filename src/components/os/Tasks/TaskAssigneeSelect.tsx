"use client";

import { useState } from "react";
import { UserIcon, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TaskAssigneeSelectProps {
  // Para modo multi-responsable:
  assigneeIds?: string[];
  onSelectChange?: (userIds: string[]) => void;
  
  // Para modo tradicional (retrocompatible):
  assigneeId?: string | null;
  assigneeName?: string | null;
  onSelect?: (userId: string | null) => void;
  
  users: Array<{ id: string; name: string }>;
  disabled?: boolean;
}

export function TaskAssigneeSelect({
  assigneeIds = [],
  onSelectChange,
  assigneeId,
  assigneeName,
  onSelect,
  users,
  disabled
}: TaskAssigneeSelectProps) {
  const [open, setOpen] = useState(false);

  // Modo multi-responsable está activo si se provee la función de cambio multi
  const isMultiple = !!onSelectChange;

  // Ids seleccionados actualmente
  const currentIds = isMultiple 
    ? assigneeIds 
    : (assigneeId ? [assigneeId] : []);

  const handleToggle = (id: string) => {
    if (isMultiple) {
      if (currentIds.includes(id)) {
        onSelectChange(currentIds.filter(x => x !== id));
      } else {
        onSelectChange([...currentIds, id]);
      }
    } else {
      if (onSelect) onSelect(id);
      setOpen(false);
    }
  };

  const handleClear = () => {
    if (isMultiple) {
      onSelectChange([]);
    } else {
      if (onSelect) onSelect(null);
      setOpen(false);
    }
  };

  // Etiqueta del botón de activación
  let labelText = "Nadie";
  if (isMultiple) {
    if (currentIds.length === 1) {
      labelText = users.find(u => u.id === currentIds[0])?.name || "1 persona";
    } else if (currentIds.length === 2) {
      const n1 = users.find(u => u.id === currentIds[0])?.name?.split(" ")[0] || "";
      const n2 = users.find(u => u.id === currentIds[1])?.name?.split(" ")[0] || "";
      labelText = `${n1} + ${n2}`;
    } else if (currentIds.length > 2) {
      const n1 = users.find(u => u.id === currentIds[0])?.name?.split(" ")[0] || "";
      labelText = `${n1} + ${currentIds.length - 1}`;
    }
  } else {
    labelText = assigneeName || "Nadie";
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button className="inline-flex h-6 items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2 text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-white/10 hover:text-[var(--color-foreground)] transition-colors">
          <UserIcon className="h-3.5 w-3.5" />
          <span>{labelText}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onSelect={(e) => {
            if (isMultiple) e.preventDefault(); // Prevenir que se cierre el dropdown en multi-select
            handleClear();
          }}
        >
          <UserIcon className="mr-2 h-4 w-4 opacity-50" />
          <span>Nadie (Desasignar)</span>
          {currentIds.length === 0 && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
        {users.map((u) => {
          const isSelected = currentIds.includes(u.id);
          return (
            <DropdownMenuItem 
              key={u.id} 
              onSelect={(e) => {
                if (isMultiple) e.preventDefault(); // Prevenir que se cierre el dropdown en multi-select
                handleToggle(u.id);
              }}
            >
              <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-primary-foreground)]">
                {u.name.substring(0, 2).toUpperCase()}
              </div>
              <span>{u.name}</span>
              {isSelected && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
