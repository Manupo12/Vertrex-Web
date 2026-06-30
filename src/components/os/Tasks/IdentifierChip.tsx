"use client";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CopyIcon } from "lucide-react";

export interface IdentifierChipProps {
  identifier: string;
  className?: string;
}

export function IdentifierChip({ identifier, className }: IdentifierChipProps) {
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(identifier);
    toast.success(`Copiado ${identifier}`);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={cn(
        "group inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium font-mono text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors whitespace-nowrap",
        className
      )}
      title="Copiar identificador"
    >
      {identifier}
      <CopyIcon className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
