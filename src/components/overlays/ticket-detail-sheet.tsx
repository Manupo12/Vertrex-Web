"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, FileText, LifeBuoy, MessageSquare, Pencil, Save, ShieldAlert, Trash2, User, X } from "lucide-react";
import type { WorkspaceSnapshot } from "@/lib/ops/workspace-service";
import { updateTicketStatus, updateTicket } from "@/lib/tickets/ticket-service";
import { getComments, addComment } from "@/lib/comments/comment-service";
import type { CommentRecord } from "@/lib/comments/comment-service";
import { getMacros } from "@/lib/tickets/response-macro-service";
import type { WorkspaceRequestType, WorkspaceSlaStatus } from "@/lib/ops/request-governance";

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

const statusOptions = [
  { value: "open", label: "Abierto" },
  { value: "in_progress", label: "En progreso" },
  { value: "resolved", label: "Resuelto" },
  { value: "closed", label: "Cerrado" },
];

export default function TicketDetailSheet({
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
  const ticket = snapshot?.tickets.find((item) => item.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [newComment, setNewComment] = useState("");
  const [macros, setMacros] = useState<{ id: string; title: string; content: string }[]>([]);
  const [showMacros, setShowMacros] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    status: "open" as "open" | "in_progress" | "resolved" | "closed",
    priority: "medium",
    assignedTo: "",
  });

  useEffect(() => {
    if (!ticket?.id) return;
    getComments("ticket", ticket.id).then(setComments);
    getMacros().then((rows) => setMacros(rows.map((r) => ({ id: r.id, title: r.title, content: r.content }))));
    const meta = (ticket.metadata as Record<string, unknown>) ?? {};
    setEditForm({
      title: ticket.title,
      status: ticket.status as "open" | "in_progress" | "resolved" | "closed",
      priority: (meta.priority as string) ?? "medium",
      assignedTo: (meta.assignedTo as string) ?? "",
    });
  }, [ticket?.id]);

  if (!open || !ticket) return null;

  const meta = (ticket.metadata as Record<string, unknown>) ?? {};
  const requestType = (meta.requestType as WorkspaceRequestType) ?? "general";
  const slaStatus = (meta.slaStatus as WorkspaceSlaStatus) ?? "on_track";

  const handleSave = () => {
    startTransition(async () => {
      await updateTicket(ticket.id, {
        title: editForm.title,
        status: editForm.status,
        priority: editForm.priority,
        assignedTo: editForm.assignedTo || null,
      });
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleStatusChange = (newStatus: "open" | "in_progress" | "resolved" | "closed") => {
    startTransition(async () => {
      await updateTicketStatus(ticket.id, newStatus);
      router.refresh();
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await addComment("ticket", ticket.id, "Equipo", newComment);
      setNewComment("");
      const updated = await getComments("ticket", ticket.id);
      setComments(updated);
    });
  };

  const handleInsertMacro = (content: string) => {
    setNewComment(content);
    setShowMacros(false);
  };

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute inset-y-0 right-0 z-[141] flex w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{ticket.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ticket.clientName ?? "Sin cliente"} · {ticket.projectName ?? "Sin proyecto"}
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
            <div className="flex gap-2">
              {statusOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value as "open" | "in_progress" | "resolved" | "closed")}
                  disabled={isPending}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    ticket.status === s.value
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
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
                <label className="text-xs font-medium text-muted-foreground">Prioridad</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Asignado a</label>
                <select
                  value={editForm.assignedTo}
                  onChange={(e) => setEditForm((f) => ({ ...f, assignedTo: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {snapshot.users?.filter((u) => u.role === "team").map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <MetricRow label="Estado" value={ticket.status} />
              <MetricRow label="Tipo" value={requestType} />
              <MetricRow label="Prioridad" value={(meta.priority as string) ?? "medium"} />
              <MetricRow label="SLA" value={slaStatus} />
              <MetricRow label="Cliente" value={ticket.clientName ?? "Sin cliente"} />
              <MetricRow label="Proyecto" value={ticket.projectName ?? "Sin proyecto"} />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle icon={MessageSquare} title="Conversación" />
              <button
                onClick={() => setShowMacros((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                {showMacros ? "Cerrar macros" : "Macros"}
              </button>
            </div>
            {showMacros && (
              <div className="mb-3 flex flex-wrap gap-2">
                {macros.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleInsertMacro(m.content)}
                    className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground hover:bg-secondary"
                  >
                    {m.title}
                  </button>
                ))}
              </div>
            )}
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
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Responder..."
                rows={2}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-none"
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
