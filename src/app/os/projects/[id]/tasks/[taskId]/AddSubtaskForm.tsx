"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSubtaskAction } from "@/lib/db/actions/tasks";
import { toast } from "sonner";

export function AddSubtaskForm({ parentTaskId }: { parentTaskId: string }) {
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    if (!title.trim()) return;
    setAdding(true);
    try {
      await createSubtaskAction(parentTaskId, title.trim());
      setTitle("");
      toast.success("Subtarea creada");
      router.refresh();
    } catch {
      toast.error("Error al crear subtarea");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Añadir subtarea..."
        className="flex-1 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-1.5"
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
      />
      <button
        onClick={handleAdd}
        disabled={adding || !title.trim()}
        className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        Añadir
      </button>
    </div>
  );
}
