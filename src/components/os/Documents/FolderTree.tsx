"use client";

import { FolderIcon, ChevronRightIcon, ChevronDownIcon, FolderOpenIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FolderTreeProps {
  folders: any[];
  selectedFolderId?: string | null;
  onSelect: (folderId: string | null) => void;
  className?: string;
}

export function FolderTree({ folders, selectedFolderId, onSelect, className }: FolderTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderFolder = (folder: any, depth = 0) => {
    const children = folders.filter(f => f.parentId === folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded[folder.id];
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div 
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--color-muted)]/50 transition-colors group",
            isSelected && "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelect(folder.id)}
        >
          {hasChildren ? (
            <button onClick={(e) => toggleExpand(e, folder.id)} className="p-0.5 hover:bg-[var(--color-muted)] rounded text-[var(--color-muted-foreground)]">
              {isExpanded ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <div className="w-4.5" /> // Spacer
          )}
          {isExpanded && hasChildren ? (
            <FolderOpenIcon className={cn("h-4 w-4", isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]")} />
          ) : (
            <FolderIcon className={cn("h-4 w-4", isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]")} />
          )}
          <span className="text-sm truncate">{folder.name}</span>
        </div>
        {isExpanded && children.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {children.map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folders.filter(f => !f.parentId);

  return (
    <div className={cn("w-64 shrink-0 border-r border-[var(--color-border)] p-4 overflow-y-auto hidden md:block", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-[var(--color-muted-foreground)] uppercase tracking-wider">Carpetas</h3>
        <button className="text-[var(--color-primary)] text-xs font-medium hover:underline">+ Nueva</button>
      </div>
      
      <div 
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--color-muted)]/50 transition-colors mb-2",
          !selectedFolderId && "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
        )}
        onClick={() => onSelect(null)}
      >
        <FolderIcon className={cn("h-4 w-4", !selectedFolderId ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]")} />
        <span className="text-sm">Todos los documentos</span>
      </div>
      
      <div className="space-y-0.5">
        {rootFolders.map(folder => renderFolder(folder))}
      </div>
      
      {folders.length === 0 && (
        <div className="text-center text-xs text-[var(--color-muted-foreground)] mt-6 py-4 border border-dashed border-[var(--color-border)] rounded-md">
          Sin carpetas creadas.
        </div>
      )}
    </div>
  );
}
