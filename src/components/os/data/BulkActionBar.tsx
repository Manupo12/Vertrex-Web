"use client";

import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: {
    label: string;
    icon?: React.ElementType;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  }[];
}

export function BulkActionBar({ selectedCount, onClearSelection, actions }: BulkActionBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedCount > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [selectedCount]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-200">
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl rounded-full p-2 flex items-center gap-4">
        <div className="flex items-center gap-2 pl-3 pr-2 border-r border-[var(--color-border)]">
          <div className="h-6 w-6 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold flex items-center justify-center">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-[var(--color-muted-foreground)]">seleccionados</span>
          <button 
            onClick={onClearSelection}
            className="ml-2 p-1 rounded-full hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            title="Limpiar selección"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 pr-2">
          {actions.map((action, i) => (
            <Button 
              key={i} 
              size="sm" 
              variant={action.variant || "secondary"} 
              onClick={action.onClick}
              className="h-8 text-xs rounded-full px-4"
            >
              {action.icon && <action.icon className="h-3.5 w-3.5 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
