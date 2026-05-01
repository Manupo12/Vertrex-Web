"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Trash2 } from "lucide-react";
import { formatMoney } from "@/components/os/workspace-ui";
import { getTimeEntries, deleteTimeEntry, createTimeEntry } from "@/lib/time/time-entry-service";
import type { WorkspaceSnapshot } from "@/lib/ops/workspace-service";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function TimesheetView({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState<{ id: string; taskId: string | null; projectId: string | null; durationMinutes: number; description: string | null; loggedAt: Date }[]>([]);
  const [newEntry, setNewEntry] = useState({ taskId: "", projectId: "", minutes: "", description: "" });

  const today = new Date();
  const weekStart = addDays(startOfWeek(today), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    getTimeEntries({
      startDate: weekStart,
      endDate: addDays(weekStart, 6),
    }).then((rows) =>
      setEntries(
        rows.map((r) => ({
          id: r.id,
          taskId: r.taskId,
          projectId: r.projectId,
          durationMinutes: r.durationMinutes,
          description: r.description,
          loggedAt: r.loggedAt,
        }))
      )
    );
  }, [weekOffset]);

  const tasks = snapshot.tasks;
  const projects = snapshot.projects;

  const dayTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of days) {
      const total = entries
        .filter((e) => isSameDay(new Date(e.loggedAt), d))
        .reduce((sum, e) => sum + e.durationMinutes, 0);
      totals.set(d.toDateString(), total);
    }
    return totals;
  }, [entries, days]);

  const weekTotal = Array.from(dayTotals.values()).reduce((a, b) => a + b, 0);

  const handleAddEntry = async () => {
    const minutes = Number(newEntry.minutes);
    if (!minutes || minutes <= 0) return;
    await createTimeEntry({
      taskId: newEntry.taskId || null,
      projectId: newEntry.projectId || null,
      durationMinutes: minutes,
      description: newEntry.description || null,
    });
    setNewEntry({ taskId: "", projectId: "", minutes: "", description: "" });
    const rows = await getTimeEntries({ startDate: weekStart, endDate: addDays(weekStart, 6) });
    setEntries(
      rows.map((r) => ({
        id: r.id,
        taskId: r.taskId,
        projectId: r.projectId,
        durationMinutes: r.durationMinutes,
        description: r.description,
        loggedAt: r.loggedAt,
      }))
    );
  };

  const handleDelete = async (id: string) => {
    await deleteTimeEntry(id);
    const rows = await getTimeEntries({ startDate: weekStart, endDate: addDays(weekStart, 6) });
    setEntries(
      rows.map((r) => ({
        id: r.id,
        taskId: r.taskId,
        projectId: r.projectId,
        durationMinutes: r.durationMinutes,
        description: r.description,
        loggedAt: r.loggedAt,
      }))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Timesheet semanal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {weekStart.toLocaleDateString("es-CO")} — {addDays(weekStart, 6).toLocaleDateString("es-CO")} ·{" "}
            <span className="font-medium text-foreground">{Math.floor(weekTotal / 60)}h {weekTotal % 60}m</span> total
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

      <div className="grid gap-4 md:grid-cols-7">
        {days.map((d, i) => {
          const total = dayTotals.get(d.toDateString()) ?? 0;
          const dayEntries = entries.filter((e) => isSameDay(new Date(e.loggedAt), d));
          const isToday = isSameDay(d, today);
          return (
            <div
              key={d.toDateString()}
              className={`rounded-xl border p-4 ${isToday ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="mb-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">{weekDays[i]}</p>
                <p className={`text-lg font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</p>
              </div>
              <div className="space-y-2">
                {dayEntries.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border/60 bg-secondary/20 px-2 py-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground truncate">
                        {tasks.find((t) => t.id === e.taskId)?.title ?? "General"}
                      </span>
                      <button onClick={() => handleDelete(e.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-muted-foreground">{Math.floor(e.durationMinutes / 60)}h {e.durationMinutes % 60}m</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-border/40 pt-2 text-center">
                <span className="text-xs font-semibold text-foreground">{Math.floor(total / 60)}h {total % 60}m</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Nuevo registro manual</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto_1fr_auto] items-end">
          <select
            value={newEntry.projectId}
            onChange={(e) => setNewEntry((p) => ({ ...p, projectId: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Proyecto...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={newEntry.taskId}
            onChange={(e) => setNewEntry((p) => ({ ...p, taskId: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Tarea...</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min"
            value={newEntry.minutes}
            onChange={(e) => setNewEntry((p) => ({ ...p, minutes: e.target.value }))}
            className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            placeholder="Nota"
            value={newEntry.description}
            onChange={(e) => setNewEntry((p) => ({ ...p, description: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            onClick={handleAddEntry}
            disabled={!newEntry.minutes || Number(newEntry.minutes) <= 0}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Clock className="h-4 w-4" />
            Registrar
          </button>
        </div>
      </div>
    </div>
  );
}
