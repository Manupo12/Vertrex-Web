"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy, FileText, Mail, MessageSquare, Pencil, Save, Trash2, X } from "lucide-react";
import type { WorkspaceSnapshot } from "@/lib/ops/workspace-service";
import { canonicalDealStageOptions, getDealPipelineGroup } from "@/lib/ops/deal-stages";
import { updateDeal, advanceDealStage, archiveDeal } from "@/lib/crm/crm-service";
import type { DealStage } from "@/lib/crm/crm-service";
import { getComments, addComment } from "@/lib/comments/comment-service";
import type { CommentRecord } from "@/lib/comments/comment-service";

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

export default function DealDetailSheet({
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
  const deal = snapshot?.deals.find((item) => item.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    valueCents: 0,
    probability: 0,
    owner: "",
    summary: "",
    stage: "",
  });

  useEffect(() => {
    if (!deal?.id) return;
    getComments("deal", deal.id).then(setComments);
    setEditForm({
      title: deal.title,
      valueCents: deal.valueCents,
      probability: deal.probability,
      owner: deal.owner ?? "",
      summary: deal.summary ?? "",
      stage: deal.stage,
    });
  }, [deal?.id]);

  if (!open || !deal) return null;

  const handleSave = () => {
    startTransition(async () => {
      await updateDeal(deal.id, {
        title: editForm.title,
        valueCents: editForm.valueCents,
        probability: editForm.probability,
        owner: editForm.owner || null,
        summary: editForm.summary || null,
      });
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleAdvanceStage = () => {
    const currentIndex = canonicalDealStageOptions.findIndex((s) => s.value === deal.stage);
    const next = canonicalDealStageOptions[currentIndex + 1];
    if (!next) return;
    startTransition(async () => {
      await advanceDealStage(deal.id, next.value as DealStage);
      router.refresh();
    });
  };

  const handleArchive = () => {
    if (!confirm("¿Archivar este deal como perdido?")) return;
    startTransition(async () => {
      await archiveDeal(deal.id);
      onOpenChange(false);
      router.refresh();
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await addComment("deal", deal.id, "Equipo", newComment);
      setNewComment("");
      const updated = await getComments("deal", deal.id);
      setComments(updated);
    });
  };

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cents / 100);

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute inset-y-0 right-0 z-[141] flex w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{deal.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {deal.clientName ?? "Sin cliente"} · {getDealPipelineGroup(deal.stage).title}
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
              <button
                onClick={handleAdvanceStage}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4" />
                Avanzar
              </button>
              <button
                onClick={handleArchive}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Perdido
              </button>
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
                <label className="text-xs font-medium text-muted-foreground">Valor (COP)</label>
                <input
                  type="number"
                  value={editForm.valueCents}
                  onChange={(e) => setEditForm((f) => ({ ...f, valueCents: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Probabilidad (%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editForm.probability}
                  onChange={(e) => setEditForm((f) => ({ ...f, probability: Number(e.target.value) }))}
                  className="mt-1 w-full"
                />
                <span className="text-xs text-muted-foreground">{editForm.probability}%</span>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Owner</label>
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
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Resumen / Notas</label>
                <textarea
                  value={editForm.summary}
                  onChange={(e) => setEditForm((f) => ({ ...f, summary: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <MetricRow label="Empresa" value={deal.clientName ?? "Sin cliente"} />
              <MetricRow label="Valor" value={formatMoney(deal.valueCents)} />
              <MetricRow label="Probabilidad" value={`${deal.probability}%`} />
            </div>
          )}

          <div>
            <SectionTitle icon={FileText} title="Notas del deal" />
            <p className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground">
              {deal.summary || "Sin notas."}
            </p>
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
