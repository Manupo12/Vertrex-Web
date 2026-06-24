"use client";

import { useState } from "react";
import { BlockEditor } from "@/components/os/Editor/BlockEditor";
import { Button } from "@/components/ui/button";
import { upsertDailyNoteAction } from "@/lib/db/actions/hub";
import { toast } from "sonner";

interface Props {
  date: string;
  initialContent?: unknown;
}

export function DailyNoteEditor({ date, initialContent }: Props) {
  const [content, setContent] = useState<unknown>(
    initialContent || [{ type: "paragraph", content: [{ type: "text", text: "Hoy me voy a enfocar en..." }] }]
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertDailyNoteAction(date, content);
      toast.success("Registro diario guardado");
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar Registro"}
        </Button>
      </div>
      <BlockEditor 
        initialContent={initialContent || [{ type: "paragraph", content: [{ type: "text", text: "Hoy me voy a enfocar en..." }] }]} 
        onChange={setContent} 
        editable={true} 
      />
    </div>
  );
}
