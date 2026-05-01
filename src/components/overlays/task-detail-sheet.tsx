"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Clock, Database, FileText, MessageSquare, Pencil, Play, Plus, Save, Square, Trash2, X } from "lucide-react";
import type { WorkspaceSnapshot } from "@/lib/ops/workspace-service";
import { updateTask, archiveTask } from "@/lib/projects/task-service";
import { getComments, addComment } from "@/lib/comments/comment-service";
import type { CommentRecord } from "@/lib/comments/comment-service";
import { createTimeEntry, getTimeEntries, getTimeSummaryByTask, deleteTimeEntry } from "@/lib/time/time-entry-service";
import type { WorkspaceTaskStatusValue } from "@/lib/ops/status-catalog";

function SectionTitle({ icon: Icon, title }: { icon: typeof FileText; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {title}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

const statusOptions: { value: WorkspaceTaskStatusValue; label: string }[] = [
  { value: "todo", label: "Por hacer" },
  { value: "in_progress", label: "En progreso" },
  { value: "review", label: "En revisión" },
  { value: "blocked", label: "Bloqueada" },
  { value: "done", label: "Completada" },
  { value: "archived", label: "Archivada" },
];

export default function TaskDetailSheet({
  open,
  id,
  snapshot,
  onOpenChange,
}: {
  open: boolean;
  id: string | null;
  snapshot: WorkspaceSnapshot;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const task = snapshot?.tasks.find((item) => item.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [newComment, setNewComment] = useState("");
  const [timeEntries, setTimeEntries] = useState<{ id: string; durationMinutes: number; description: string | null; loggedAt: Date }[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [newTimeEntry, setNewTimeEntry] = useState({ minutes: "", description: "" });
  const [editForm, setEditForm] = useState({
    title: "",
    status: "todo" as WorkspaceTaskStatusValue,
    owner: "",
    dueLabel: "",
  });

  useEffect(() => {
    if (!task?.id) return;
    getComments("task", task.id).then(setComments);
    loadTimeData(task.id);
    setEditForm({
      title: task.title,
      status: task.status as WorkspaceTaskStatusValue,
      owner: task.owner ?? "",
      dueLabel: task.dueLabel ?? "",
    });
  }, [task?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const loadTimeData = async (taskId: string) => {
    const entries = await getTimeEntries({ taskId });
    setTimeEntries(entries.map((e) => ({ id: e.id, durationMinutes: e.durationMinutes, description: e.description, loggedAt: e.loggedAt })));
    const total = await getTimeSummaryByTask(taskId);
    setTotalMinutes(total);
  };

  if (!open || !task) return null;

  const handleSave = () => {
    startTransition(async () => {
      await updateTask(task.id, {
        title: editForm.title,
        status: editForm.status,
        owner: editForm.owner || null,
        dueLabel: editForm.dueLabel || null,
      });
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleArchive = () => {
    if (!confirm("¿Archivar esta tarea?")) return;
    startTransition(async () => {
      await archiveTask(task.id);
      onOpenChange(false);
      router.refresh();
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await addComment("task", task.id, "Equipo", newComment);
      setNewComment("");
      const updated = await getComments("task", task.id);
      setComments(updated);
    });
  };

  const handleLogTime = () => {
    const minutes = Number(newTimeEntry.minutes);
    if (!minutes || minutes <= 0) return;
    startTransition(async () => {
      await createTimeEntry({ taskId: task.id, durationMinutes: minutes, description: newTimeEntry.description || null });
      setNewTimeEntry({ minutes: "", description: "" });
      await loadTimeData(task.id);
      router.refresh();
    });
  };

  const handleTimerStop = () => {
    setTimerRunning(false);
    const minutes = Math.ceil(timerSeconds / 60);
    if (minutes <= 0) return;
    startTransition(async () => {
      await createTimeEntry({ taskId: task.id, durationMinutes: minutes, description: "Timer automático" });
      setTimerSeconds(0);
      await loadTimeData(task.id);
      router.refresh();
    });
  };

  const handleDeleteTimeEntry = (entryId: string) => {
    startTransition(async () => {
      await deleteTimeEntry(entryId);
      await loadTimeData(task.id);
      router.refresh();
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute inset-y-0 right-0 z-[141] flex w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{task.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {task.status} · {task.owner ?? "Sin asignar"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-border bg-secondary/50 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {isEditing ? "Cancelar" : "Editar"}
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Guardando..." : "Guardar"}
                </button>
              )}
            </div>
            <button
              onClick={handleArchive}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Archivar
            </button>
          </div>

          {isEditing ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Título</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Estado</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as WorkspaceTaskStatusValue }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Responsable</label>
                <select
                  value={editForm.owner}
                  onChange={(e) => setEditForm((f) => ({ ...f, owner: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {snapshot.users?.filter((u) => u.role === "team").map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Vencimiento</label>
                <input
                  value={editForm.dueLabel}
                  onChange={(e) => setEditForm((f) => ({ ...f, dueLabel: e.target.value }))}
                  placeholder="ej: Mañana, 10:00 AM"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <MetricRow label="Responsable" value={task.owner ?? "Sin asignar"} />
              <MetricRow label="Estado" value={task.status} />
              <MetricRow label="Vence" value={task.dueLabel ?? "Sin fecha"} />
              <MetricRow label="Proyecto" value={task.projectName ?? "Sin proyecto"} />
            </div>
          )}

          <div>
            <SectionTitle icon={Clock} title="Time tracking" />
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-lg border border-border/60 bg-secondary/20 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Total logueado:</span>{" "}
                <span className="font-medium text-foreground">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
              </div>
              <div className="flex items-center gap-2">
                {timerRunning ? (
                  <button
                    onClick={handleTimerStop}
                    className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-all hover:opacity-90"
                  >
                    <Square className="h-4 w-4" />
                    Detener {formatTime(timerSeconds)}
                  </button>
                ) : (
                  <button
                    onClick={() => setTimerRunning(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                  >
                    <Play className="h-4 w-4" />
                    Iniciar timer
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-[auto_1fr_auto] items-end mb-3">
              <input
                type="number"
                placeholder="Min"
                value={newTimeEntry.minutes}
                onChange={(e) => setNewTimeEntry((t) => ({ ...t, minutes: e.target.value }))}
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <input
                placeholder="Descripción del trabajo..."
                value={newTimeEntry.description}
                onChange={(e) => setNewTimeEntry((t) => ({ ...t, description: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleLogTime}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Log
              </button>
            </div>
            <div className="space-y-2">
              {timeEntries.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-foreground">{e.durationMinutes} min</span>
                    {e.description && <span className="ml-2 text-muted-foreground">{e.description}</span>}
                  </div>
                  <button onClick={() => handleDeleteTimeEntry(e.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle icon={Database} title="Relaciones" />
            <div className="flex flex-wrap gap-2">
              {[task.clientName, task.projectName].filter(Boolean).map((r) => (
                <span key={r} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle icon={MessageSquare} title="Comentarios" />
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{c.author}</span>
                    <span className="text-[11px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("es-CO")}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{c.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Añadir comentario..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleAddComment}
                disabled={isPending || !newComment.trim()}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
