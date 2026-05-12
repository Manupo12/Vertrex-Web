"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { activateCycleAction, closeCycleAction } from "@/lib/db/actions/cycles";
import { toast } from "sonner";

export function CycleActions({ cycleId, projectId, status, nextCycleId }: { cycleId: string; projectId: string; status: string; nextCycleId?: string | null }) {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleActivate = async () => {
    setSubmitting(true);
    try {
      await activateCycleAction(cycleId);
      toast.success("Ciclo activado");
      router.refresh();
    } catch {
      toast.error("Error al activar ciclo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (moveToBacklog: boolean) => {
    setSubmitting(true);
    try {
      await closeCycleAction(cycleId, { moveUnfinishedToBacklog: moveToBacklog });
      toast.success("Ciclo cerrado");
      setShowCloseModal(false);
      router.refresh();
    } catch {
      toast.error("Error al cerrar ciclo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {status === "planned" && (
        <button
          onClick={handleActivate}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "..." : "Activar ciclo"}
        </button>
      )}
      {status === "active" && (
        <button
          onClick={() => setShowCloseModal(true)}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
        >
          Cerrar ciclo
        </button>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCloseModal(false)}>
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Cerrar ciclo</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
              ¿Qué hacer con las tareas no terminadas?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleClose(true)}
                disabled={submitting}
                className="w-full text-left px-4 py-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
              >
                <div className="font-medium text-sm">Mover al backlog</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Las tareas sin completar volverán al backlog del proyecto</div>
              </button>
              {nextCycleId && (
                <button
                  onClick={() => handleClose(false)}
                  disabled={submitting}
                  className="w-full text-left px-4 py-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
                >
                  <div className="font-medium text-sm">Mover al siguiente ciclo</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">Las tareas sin completar pasarán al próximo ciclo planificado</div>
                </button>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowCloseModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
