"use client";

import { useState } from "react";
import { BookmarkIcon, PlusIcon, StarIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface SavedViewBarProps {
  route: string;
  views?: any[];
  currentViewId?: string | null;
  onSelectView?: (viewId: string) => void;
  onSaveView?: () => void;
  onUpdateView?: (viewId: string) => void;
  onDeleteView?: (viewId: string) => void;
}

export function SavedViewBar({ route, views = [], currentViewId, onSelectView, onSaveView, onUpdateView, onDeleteView }: SavedViewBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
      <div className="flex items-center gap-2 pr-4 border-r border-[var(--color-border)]">
        <BookmarkIcon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Vistas</span>
      </div>
      
      <button 
        className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!currentViewId ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'}`}
        onClick={() => onSelectView?.('default')}
      >
        Todo
      </button>
      
      {views.map(view => (
        <div key={view.id} className="shrink-0 flex items-center">
          <button 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-l-full text-xs font-medium transition-colors border-y border-l ${currentViewId === view.id ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]' : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'}`}
            onClick={() => onSelectView?.(view.id)}
          >
            {view.isShared && <StarIcon className="h-3 w-3" />}
            {view.name}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`flex items-center justify-center px-1.5 py-1.5 h-full rounded-r-full border-y border-r transition-colors ${currentViewId === view.id ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20' : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'}`}>
                <MoreHorizontalIcon className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => onUpdateView?.(view.id)}>Actualizar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateView?.(view.id)}>Renombrar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { if (confirm("¿Eliminar esta vista?")) onDeleteView?.(view.id); }} className="text-[var(--color-destructive)]">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
      
      {onSaveView && (
        <button 
          onClick={onSaveView}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-[var(--color-border)] text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors ml-2"
        >
          <PlusIcon className="h-3 w-3" /> Guardar vista
        </button>
      )}
    </div>
  );
}
