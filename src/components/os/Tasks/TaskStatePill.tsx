import { cn, stateToken } from "@/lib/utils";
import { humanState } from "@/lib/format";
import { CircleIcon, CircleDashedIcon, CircleDotIcon, CheckCircle2Icon, XCircleIcon, ClockIcon } from "lucide-react";

export interface TaskStatePillProps {
  state: string;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function TaskStatePill({ state, size = "sm", showLabel = true, className }: TaskStatePillProps) {
  const Icon = (() => {
    switch (state) {
      case "todo": return CircleDashedIcon;
      case "in_progress": return CircleDotIcon;
      case "in_review": return ClockIcon;
      case "done": return CheckCircle2Icon;
      case "cancelled": return XCircleIcon;
      default: return CircleIcon;
    }
  })();

  const color = stateToken(state);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/5 font-medium transition-colors",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
    >
      <Icon className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} style={{ color }} />
      {showLabel && <span>{humanState(state)}</span>}
    </div>
  );
}
