"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { WorkspaceSnapshot } from "@/lib/ops/workspace-service";
import { formatDateTime } from "@/components/os/workspace-ui";

type TaskItem = {
  id: string;
  title: string;
  projectName: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  status: string;
  owner: string | null;
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export default function ProjectsTimelineView({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const viewStart = addDays(startOfWeek(today), weekOffset * 7);
  const viewEnd = addDays(viewStart, 13);

  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    days.push(addDays(viewStart, i));
  }

  const tasks = useMemo<TaskItem[]>(() => {
    const items: TaskItem[] = [];
    for (const project of snapshot.projects) {
      const start = project.startDate ? new Date(project.startDate) : addDays(today, -7);
      const end = project.endDate ? new Date(project.endDate) : addDays(start, 14);
      items.push({
        id: project.id,
        title: project.name,
        projectName: project.name,
        projectId: project.id,
        startDate: start,
        endDate: end,
        status: project.status,
        owner: null,
      });
      for (const task of snapshot.tasks.filter((t) => t.projectId === project.id)) {
        const taskStart = addDays(start, Math.max(0, Math.floor(Math.random() * 10)));
        items.push({
          id: task.id,
          title: task.title,
          projectName: project.name,
          projectId: project.id,
          startDate: taskStart,
          endDate: addDays(taskStart, 3),
          status: task.status,
          owner: task.owner,
        });
      }
    }
    return items;
  }, [snapshot]);

  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Timeline de proyectos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(viewStart.toISOString())} — {formatDateTime(viewEnd.toISOString())}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((v) => v - 1)}
            className="rounded-lg border border-border bg-secondary/50 p-2 text-muted-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
          >
            Hoy
          </button>
          <button
            onClick={() => setWeekOffset((v) => v + 1)}
            className="rounded-lg border border-border bg-secondary/50 p-2 text-muted-foreground hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {snapshot.projects.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground">Sin proyectos</h3>
          <p className="mt-1 text-sm text-muted-foreground">Crea proyectos y tareas para ver el timeline.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid" style={{ gridTemplateColumns: `200px repeat(${days.length}, 1fr)` }}>
            {/* Header row */}
            <div className="sticky left-0 z-10 border-b border-r border-border bg-card px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Proyecto / Tarea
            </div>
            {days.map((d, i) => (
              <div
                key={i}
                className={`border-b border-r border-border px-2 py-3 text-center text-xs ${
                  isWeekend(d) ? "bg-secondary/30 text-muted-foreground/60" : "text-foreground"
                } ${
                  d.toDateString() === today.toDateString() ? "bg-primary/10 text-primary font-semibold" : ""
                }`}
              >
                <div>{d.toLocaleDateString("es-CO", { weekday: "short" })}</div>
                <div className="text-[11px]">{d.getDate()}</div>
              </div>
            ))}

            {/* Project + task rows */}
            {snapshot.projects.map((project) => {
              const projectTasks = tasks.filter((t) => t.projectId === project.id);
              return (
                <>
                  {/* Project row */}
                  <div key={`proj-${project.id}`} className="border-b border-r border-border bg-secondary/10 px-4 py-2 text-sm font-semibold text-foreground sticky left-0 z-10">
                    <Link href={`/os/projects/${project.id}`} className="hover:text-primary">
                      {project.name}
                    </Link>
                  </div>
                  {days.map((_, i) => (
                    <div key={`proj-cell-${i}`} className="border-b border-r border-border bg-secondary/5" />
                  ))}

                  {/* Task rows */}
                  {projectTasks.map((task) => (
                    <>
                      <div key={`task-label-${task.id}`} className="border-b border-r border-border px-4 py-2 text-xs text-muted-foreground sticky left-0 z-10 bg-card">
                        <span className="truncate block">{task.title}</span>
                        {task.owner && <span className="text-[10px]">{task.owner}</span>}
                      </div>
                      {days.map((day, i) => {
                        const isInRange = day >= task.startDate && day <= task.endDate;
                        const isStart = day.toDateString() === task.startDate.toDateString();
                        return (
                          <div
                            key={`task-cell-${task.id}-${i}`}
                            className={`border-b border-r border-border relative ${
                              isWeekend(day) ? "bg-secondary/10" : ""
                            }`}
                          >
                            {isInRange && (
                              <div
                                className={`absolute inset-y-1 left-0 right-0 rounded-md ${
                                  task.status === "done"
                                    ? "bg-green-500/20 border border-green-500/30"
                                    : task.status === "in_progress"
                                    ? "bg-primary/20 border border-primary/30"
                                    : task.status === "blocked"
                                    ? "bg-destructive/20 border border-destructive/30"
                                    : "bg-secondary border border-border"
                                } ${isStart ? "ml-1" : "-ml-px mr-0"}`}
                                title={`${task.title} (${task.status})`}
                              >
                                {isStart && (
                                  <span className="truncate px-1.5 text-[10px] font-medium text-foreground block pt-0.5">
                                    {task.title}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
