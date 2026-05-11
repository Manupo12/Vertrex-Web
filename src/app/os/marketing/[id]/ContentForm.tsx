"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createContentPlanAction } from "@/lib/db/actions/marketing";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AsyncSubmitButton } from "@/components/os/ui/AsyncSubmitButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ContentForm({ socialAccountId }: { socialAccountId: string }) {
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("post");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const fd = new FormData();
      fd.append("social_account_id", socialAccountId);
      fd.append("title", title);
      fd.append("content_type", contentType);
      fd.append("scheduled_at", scheduledAt);
      fd.append("notes", notes);
      await createContentPlanAction(fd);
      toast.success("Contenido planificado");
      setTitle(""); setNotes(""); setContentType("post"); setScheduledAt(""); setOpen(false);
    } catch {
      toast.error("Error al planificar contenido");
    }
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
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="reel">Reel</SelectItem>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Programar para</label>
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Notas</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <AsyncSubmitButton loadingText="Guardando...">Guardar</AsyncSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
