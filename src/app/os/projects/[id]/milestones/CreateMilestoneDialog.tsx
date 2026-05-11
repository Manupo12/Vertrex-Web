"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMilestoneAction } from "@/lib/db/actions/milestones";
import { toast } from "sonner";

export function CreateMilestoneDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSubmitting(true);
    try {
      await createMilestoneAction(projectId, { 
        name: name.trim(), 
        description: description.trim() || undefined, 
        targetDate: targetDate ? new Date(targetDate) : undefined 
      });
      toast.success("Hito creado");
      setOpen(false);
      setName(""); setDescription(""); setTargetDate("");
      router.refresh();
    } catch {
      toast.error("Error al crear hito");
    } finally { setSubmitting(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        + Nuevo hito
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Nuevo hito</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. MVP v1.0" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Qué define este hito..." className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Fecha objetivo</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {submitting ? "Creando..." : "Crear hito"}
          </button>
        </div>
      </div>
    </div>
  );
}
