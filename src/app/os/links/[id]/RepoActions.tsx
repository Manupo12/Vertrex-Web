"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateRepositoryStatusAction, updateRepositoryPriorityAction } from "@/lib/db/actions/links";
import { toast } from "sonner";
import { Star } from "lucide-react";

export function RepoActions({ repoId, initialStatus, initialPriority }: { repoId: string, initialStatus: string, initialPriority: number }) {
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      if (status !== initialStatus) {
        await updateRepositoryStatusAction(repoId, status);
      }
      if (priority !== initialPriority) {
        await updateRepositoryPriorityAction(repoId, priority);
      }
      toast.success("Repositorio actualizado");
    } catch {
      toast.error("Error al actualizar");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border mt-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">Estado</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="pendiente">Pendiente</option>
          <option value="probando">Probando</option>
          <option value="en_uso">En uso</option>
          <option value="descartado">Descartado</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">Prioridad (1-5)</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-6 w-6 cursor-pointer transition-colors ${star <= priority ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
              onClick={() => setPriority(star)}
            />
          ))}
        </div>
      </div>
      <Button className="w-full" onClick={handleUpdate} disabled={saving || (status === initialStatus && priority === initialPriority)}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
