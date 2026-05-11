"use client";

import { cn } from "@/lib/utils";
import { AtSignIcon, FileIcon, UserIcon, CheckSquareIcon } from "lucide-react";

export interface EntityMentionRendererProps {
  entityType: string;
  entityId: string;
  label: string;
  className?: string;
}

export function EntityMentionRenderer({ entityType, entityId, label, className }: EntityMentionRendererProps) {
  const Icon = (() => {
    switch (entityType) {
      case "task": return CheckSquareIcon;
      case "client": return UserIcon;
      case "document": return FileIcon;
      default: return AtSignIcon;
    }
  })();

  return (
    <a
      href={`/os/resolve-mention/${entityId}`}
      className={cn(
        "inline-flex items-center gap-1 rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors cursor-pointer",
        className
      )}
      title={`${entityType}: ${label}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}
