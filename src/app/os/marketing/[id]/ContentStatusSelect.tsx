"use client";
import { useState } from "react";
import { updateContentPlanStatusAction } from "@/lib/db/actions/marketing";
import { toast } from "sonner";

export function ContentStatusSelect({ contentId, initialStatus }: { contentId: string, initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);

  const handleUpdate = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await updateContentPlanStatusAction(contentId, newStatus);
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar estado");
      setStatus(initialStatus);
    }
  };

  return (
    <select 
      value={status} 
      onChange={e => handleUpdate(e.target.value)} 
      className="text-xs bg-transparent border-0 font-medium text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
    >
      <option value="idea">Idea</option>
      <option value="en_produccion">En produccion</option>
      <option value="listo">Listo</option>
      <option value="publicado">Publicado</option>
    </select>
  );
}
