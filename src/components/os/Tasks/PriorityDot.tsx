import { cn, priorityToken } from "@/lib/utils";

export interface PriorityDotProps {
  priority: number;
  showLabel?: boolean;
  className?: string;
}

export function PriorityDot({ priority, showLabel = false, className }: PriorityDotProps) {
  const label = (() => {
    switch (priority) {
      case 1: return "Urgente";
      case 2: return "Alta";
      case 3: return "Media";
      case 4: return "Baja";
      default: return "Sin prioridad";
    }
  })();

  const color = priorityToken(priority);

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div 
        className={cn(
          "h-2 w-2 rounded-full",
          priority === 0 ? "border border-white/20 bg-transparent" : "shadow-sm"
        )} 
        style={{ backgroundColor: priority !== 0 ? color : undefined }}
      />
      {showLabel && <span className="text-xs text-[var(--color-muted-foreground)]">{label}</span>}
    </div>
  );
}
