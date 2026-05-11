"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCycleAction } from "@/lib/db/actions/cycles";
import { toast } from "sonner";

export function CreateCycleDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [goal, setGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!name.trim() || !startsAt || !endsAt) {
      toast.error("Nombre, inicio y fin son obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      await createCycleAction(projectId, { name: name.trim(), startsAt: new Date(startsAt), endsAt: new Date(endsAt), goal: goal.trim() || undefined });
      toast.success("Ciclo creado");
      setOpen(false);
      setName(""); setStartsAt(""); setEndsAt(""); setGoal("");
      router.refresh();
    } catch {
      toast.error("Error al crear ciclo");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        + Nuevo ciclo
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Nuevo ciclo</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Sprint 18" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Inicio *</label>
              <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Fin *</label>
              <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Meta (opcional)</label>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2} placeholder="Qué queremos lograr este ciclo..." className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {submitting ? "Creando..." : "Crear ciclo"}
          </button>
        </div>
      </div>
    </div>
  );
}
