"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createContentPlanAction, updateContentPlanStatusAction } from "@/lib/db/actions/marketing";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContentForm({ socialAccountId }: { socialAccountId: string }) {
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("post");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("social_account_id", socialAccountId);
      fd.append("title", title);
      fd.append("content_type", contentType);
      fd.append("notes", notes);
      await createContentPlanAction(fd);
      toast.success("Contenido planificado");
      setTitle(""); setNotes(""); setContentType("post"); setOpen(false);
    } catch {
      toast.error("Error al planificar contenido");
    }
    setSaving(false);
  };

  if (!open) {
    return <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="mb-4 w-full"><Plus className="mr-2 h-4 w-4"/> Planificar contenido</Button>;
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle className="text-sm">Planificar contenido</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Titulo *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Tipo</label>
            <select value={contentType} onChange={e => setContentType(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="post">Post</option>
              <option value="reel">Reel</option>
              <option value="story">Story</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Notas</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !title.trim()}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
