"use client";

import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";

export interface RoadmapTimelineProps {
  projects: any[];
  milestones: any[];
  cycles: any[];
  className?: string;
}

export function RoadmapTimeline({ projects, milestones, cycles, className }: RoadmapTimelineProps) {
  const now = new Date();
  const yearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  const totalDays = differenceInDays(yearFromNow, now) || 365;

  const getPosition = (date: Date) => {
    const daysFromStart = differenceInDays(date, now);
    return Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
  };

  const getWidth = (start: Date, end: Date) => {
    const startPct = getPosition(start);
    const endPct = getPosition(end);
    return Math.max(5, endPct - startPct);
  };

  const months = Array.from({length: 12}, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return format(d, "MMM", { locale: es });
  });

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="min-w-[800px] border border-[var(--color-border)] rounded-lg bg-[var(--color-card)]">
        <div className="grid grid-cols-[200px_1fr] border-b border-[var(--color-border)] text-xs font-medium text-[var(--color-muted-foreground)]">
          <div className="px-4 py-2 border-r border-[var(--color-border)]">Proyecto</div>
          <div className="relative px-4 py-2">
            <div className="flex justify-between">
              {months.map((m, i) => (
                <span key={i} className="text-[10px]">{m}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {projects.map(p => {
            const projectCycles = cycles.filter(c => c.projectId === p.id);
            const projectMilestones = milestones.filter(m => m.projectId === p.id);
            return (
              <div key={p.id} className="grid grid-cols-[200px_1fr] text-sm hover:bg-[var(--color-muted)]/20 transition-colors">
                <div className="px-4 py-4 border-r border-[var(--color-border)] font-medium truncate">{p.name}</div>
                <div className="relative py-4 px-4 h-16">
                  {projectCycles.map((c: any) => {
                    const left = getPosition(new Date(c.startsAt));
                    const w = getWidth(new Date(c.startsAt), new Date(c.endsAt));
                    const colors: Record<string, string> = { active: "bg-green-500/30 border-green-500/50", planned: "bg-blue-500/20 border-blue-500/40", completed: "bg-gray-400/20 border-gray-400/40" };
                    return (
                      <div key={c.id} className={`absolute h-6 rounded border ${colors[c.status] || colors.planned} flex items-center px-2 text-[10px] font-medium truncate`}
                        style={{ left: `${left}%`, width: `${w}%`, top: '50%', transform: 'translateY(-50%)' }}
                        title={`${c.name} (${format(new Date(c.startsAt), "d MMM")} - ${format(new Date(c.endsAt), "d MMM")})`}>
                        {c.name}
                      </div>
                    );
                  })}
                  {projectMilestones.map((m: any) => {
                    const left = getPosition(new Date(m.targetDate));
                    const statusColors: Record<string, string> = { completed: "border-green-500", missed: "border-red-500", open: "border-orange-400" };
                    return (
                      <div key={m.id} className={`absolute w-3 h-3 rotate-45 border-2 ${statusColors[m.status] || "border-orange-400"} bg-[var(--color-card)]`}
                        style={{ left: `calc(${left}% - 6px)`, top: '50%', transform: 'translateY(-50%) rotate(45deg)' }}
                        title={`${m.name} (${format(new Date(m.targetDate), "d MMM yyyy")})`}>
                      </div>
                    );
                  })}
                  {projectCycles.length === 0 && projectMilestones.length === 0 && (
                    <div className="text-[10px] text-[var(--color-muted-foreground)] italic pt-1">Sin planificación</div>
                  )}
                </div>
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">No hay proyectos activos en el roadmap.</div>
          )}
        </div>
      </div>
    </div>
  );
}
