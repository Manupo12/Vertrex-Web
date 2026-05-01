"use client";

import { CalendarDays, CheckCircle2, Clock, ListTodo, TimerReset } from "lucide-react";

import {
  EmptyWorkspacePanel,
  ErrorWorkspacePanel,
  LoadingWorkspacePanel,
  formatDateTime,
  formatNumber,
} from "@/components/os/workspace-ui";
import { dealPipelineGroups, getDealPipelineGroup } from "@/lib/ops/deal-stages";
import { isOpenTaskStatus } from "@/lib/ops/status-catalog";
import { useWorkspaceSnapshot } from "@/lib/ops/use-workspace-snapshot";
import { useUIStore } from "@/lib/store/ui";
import TimesheetView from "@/components/os/timesheet-view";

export default function TimeWorkspaceScreen() {
  const open = useUIStore((store) => store.open);
  const { snapshot, loading, error, refresh } = useWorkspaceSnapshot();

  const inProgressTasks = snapshot.tasks.filter((task) => task.status === "in_progress");
  const openTasks = snapshot.tasks.filter((task) => isOpenTaskStatus(task.status));
  const reviewTasks = snapshot.tasks.filter((task) => task.status === "review");
  const doneTasks = snapshot.tasks.filter((task) => task.status === "done");
  const upcomingEvents = [...snapshot.events]
    .filter((event) => new Date(event.startsAt).getTime() >= Date.now())
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
    .slice(0, 8);
  const workloadByOwner = Array.from(
    inProgressTasks.reduce<Map<string, number>>((accumulator, task) => {
      const owner = task.owner?.trim() || "Sin owner";
      accumulator.set(owner, (accumulator.get(owner) ?? 0) + 1);
      return accumulator;
    }, new Map()),
  ).sort((left, right) => right[1] - left[1]);

  if (loading) {
    return <LoadingWorkspacePanel label="Cargando cadencia operativa real..." />;
  }

  if (error) {
    return <ErrorWorkspacePanel message={error} onRetry={refresh} />;
  }

  if (snapshot.tasks.length === 0 && snapshot.events.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyWorkspacePanel
          title="Time todavía no tiene ritmo operativo"
          description="Registra tareas y eventos conectados al workspace para medir foco, revisiones y próximos compromisos."
        />
        <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground" onClick={refresh}>
          Actualizar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Time & Cadencia</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ritmo de ejecución inferido desde tareas, owners, revisiones y agenda del sistema operativo.
          </p>
        </div>
        <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80" onClick={refresh}>
          Actualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="En ejecución" value={String(inProgressTasks.length)} subtitle="Tareas activas ahora mismo" icon={Clock} />
        <MetricCard title="En review" value={String(reviewTasks.length)} subtitle="Pendientes de validación" icon={TimerReset} />
        <MetricCard title="Completadas" value={String(doneTasks.length)} subtitle="Tareas cerradas en el tablero" icon={CheckCircle2} />
        <MetricCard title="Próximos eventos" value={String(upcomingEvents.length)} subtitle="Agenda conectada al delivery" icon={CalendarDays} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Carga activa por owner</h2>
          </div>
          <div className="space-y-3 p-4">
            {workloadByOwner.length > 0 ? (
              workloadByOwner.map(([owner, count]) => (
                <div key={owner} className="rounded-xl border border-border/60 bg-secondary/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">{owner}</span>
                    <span className="text-sm font-semibold text-primary">{formatNumber(count)} activas</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(8, Math.min(100, count * 20))}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay tareas activas con owner asignado en este momento.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Agenda inmediata</h2>
          </div>
          <div className="space-y-3 p-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  className="w-full rounded-xl border border-border/60 bg-secondary/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                  onClick={() => open("eventDetail", event.id)}
                >
                  <p className="text-sm font-semibold text-foreground">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.clientName ?? "Sin cliente"}
                    {event.projectName ? ` · ${event.projectName}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{event.kind}</span>
                    <span>·</span>
                    <span>{formatDateTime(event.startsAt)}</span>
                    <span>·</span>
                    <span>{event.attendees.length} asistentes</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay eventos futuros conectados al workspace por ahora.</p>
            )}
          </div>
        </section>
      </div>

      <TimesheetView snapshot={snapshot} />

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <ListTodo className="h-5 w-5 text-primary" /> Cola de revisión
          </h2>
        </div>
        <div className="space-y-3 p-4">
          {reviewTasks.length > 0 ? (
            reviewTasks.map((task) => (
              <button
                key={task.id}
                className="w-full rounded-xl border border-border/60 bg-secondary/20 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                onClick={() => open("taskDetail", task.id)}
              >
                <p className="text-sm font-semibold text-foreground">{task.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {task.projectName ?? task.clientName ?? "Sin contexto"} · {task.owner ?? "Sin owner"}
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No hay tareas en review actualmente.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: typeof Clock }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</h3>
        </div>
        <div className="rounded-xl bg-secondary/60 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
