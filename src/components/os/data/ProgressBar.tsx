import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({ value, max = 100, size = "md", className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const heights = { sm: "h-1.5", md: "h-2", lg: "h-3" };
  return (
    <div className={cn("w-full rounded-full bg-muted", heights[size], className)}>
      <div className={cn("rounded-full bg-primary transition-all duration-500", heights[size])} style={{ width: `${pct}%` }} />
    </div>
  );
}
