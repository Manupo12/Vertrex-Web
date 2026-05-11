"use client";
import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { quickCaptureIdea } from "@/lib/db/actions/hub";

export function QuickIdeaModal() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await quickCaptureIdea(text);
      toast.success("Idea capturada");
      setText("");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Captura rapida</h2>
            <p className="text-xs text-muted-foreground">Describe tu idea y sigue trabajando.</p>
          </div>
        </div>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="Escribe tu idea aqui..."
          className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          rows={5}
        />
        <div className="mt-4 flex items-center justify-between">
          <kbd className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground">Enter para guardar</kbd>
          <Button onClick={handleSave} disabled={!text.trim() || saving} size="sm">
            {saving ? "Guardando..." : "Guardar idea"}
          </Button>
        </div>
      </div>
    </div>
  );
}
