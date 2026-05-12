"use client";

import { useState } from "react";
import { updateTaskAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";
import { formatShortDate } from "@/lib/format";
import { CheckSquare, ListChecks, X } from "lucide-react";

export function MilestonesClient({ milestones, allMilestoneTasks, projectId }: {
  milestones: any[];
  allMilestoneTasks: Array<{ id: string; state: string; milestoneId: string | null; title: string }>;
  projectId: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const milestoneTaskCounts = new Map<string, { total: number; done: number }>();
  for (const t of allMilestoneTasks) {
    if (!t.milestoneId) continue;
    const current = milestoneTaskCounts.get(t.milestoneId) || { total: 0, done: 0 };
    current.total++;
    if (t.state === 'done' || t.state === 'cancelled') current.done++;
    milestoneTaskCounts.set(t.milestoneId, current);
  }

  const unassignedTasks = allMilestoneTasks.filter(t => !t.milestoneId && t.state !== 'done' && t.state !== 'cancelled');

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === milestones.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(milestones.map(m => m.id)));
    }
  };

  const handleBulkAssign = async (milestoneId: string) => {
    setSubmitting(true);
    try {
      await Promise.all(
        unassignedTasks.map(t => updateTaskAction(t.id, { milestoneId }))
      );
      toast.success(`Tareas asignadas al hito`);
      setShowAssignDialog(false);
    } catch {
      toast.error("Error al asignar tareas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {milestones.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <label className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-[var(--color-border)]"
              checked={selectedIds.size === milestones.length}
              onChange={toggleAll}
            />
            Seleccionar todos
          </label>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-[var(--color-muted-foreground)]">{selectedIds.size} seleccionados</span>
              <button
                onClick={() => setShowAssignDialog(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Asignar tareas
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)]"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {milestones.map(m => (
          <div
            key={m.id}
            className={`bg-[var(--color-card)] rounded-lg border p-5 transition-colors flex items-center justify-between ${
              selectedIds.has(m.id) ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <input
                type="checkbox"
                className="rounded border-[var(--color-border)]"
                checked={selectedIds.has(m.id)}
                onChange={() => toggleSelect(m.id)}
              />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg">{m.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.status === 'open' ? 'bg-blue-500/20 text-blue-500' : 
                    m.status === 'completed' ? 'bg-green-500/20 text-green-500' : 
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {m.status === 'open' ? 'Abierto' : m.status === 'completed' ? 'Completado' : 'Atrasado'}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {m.description || "Sin descripción"}
                </p>
              </div>
            </div>
            
            <div className="text-right ml-4">
              <div className="text-sm font-medium">
                {m.targetDate ? formatShortDate(m.targetDate) : "Sin fecha"}
              </div>
              <div className="text-xs text-[var(--color-muted-foreground)] mt-1">
                {(() => {
                    const progress = milestoneTaskCounts.get(m.id);
                    if (progress) {
                      const pct = Math.round(progress.done / progress.total * 100);
                      return (
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs whitespace-nowrap">{progress.done}/{progress.total}</span>
                        </div>
                      );
                    }
                    return <span className="text-xs text-[var(--color-muted-foreground)]">Sin tareas</span>;
                  })()}
              </div>
            </div>
          </div>
        ))}
        
        {milestones.length === 0 && (
          <div className="py-12 text-center text-[var(--color-muted-foreground)] bg-[var(--color-card)] rounded-lg border border-[var(--color-border)]">
            No hay hitos creados aún.
          </div>
        )}
      </div>

      {showAssignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAssignDialog(false)}>
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Asignar tareas a hitos</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              {unassignedTasks.length} tareas sin hito serán asignadas al hito seleccionado.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Array.from(selectedIds).map(id => {
                const m = milestones.find(ms => ms.id === id);
                if (!m) return null;
                return (
                  <button
                    key={id}
                    onClick={() => handleBulkAssign(id)}
                    disabled={submitting}
                    className="w-full text-left px-4 py-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {unassignedTasks.length} tareas → {m.name}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowAssignDialog(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
