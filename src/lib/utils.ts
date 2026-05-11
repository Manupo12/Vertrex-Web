import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

export function formatDate(date?: string | Date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function priorityToken(priority: number) {
  switch (priority) {
    case 1: return "var(--os-priority-urgent)";
    case 2: return "var(--os-priority-high)";
    case 3: return "var(--os-priority-medium)";
    case 4: return "var(--os-priority-low)";
    default: return "transparent";
  }
}

export function stateToken(state: string) {
  switch (state) {
    case "todo": return "var(--os-state-todo)";
    case "in_progress": return "var(--os-state-in-progress)";
    case "in_review": return "var(--os-state-in-review)";
    case "done": return "var(--os-state-done)";
    case "cancelled": return "var(--os-state-cancelled)";
    default: return "var(--os-state-backlog)";
  }
}
