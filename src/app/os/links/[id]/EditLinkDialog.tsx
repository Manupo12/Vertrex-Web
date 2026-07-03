"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateExternalReferenceAction } from "@/lib/db/actions/links";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface Collection {
  id: string;
  name: string;
}

interface EditLinkDialogProps {
  id: string;
  type: "repo" | "link";
  initialData: {
    title?: string | null;
    description?: string | null;
    savedReason?: string | null;
    collectionId?: string | null;
  };
  collections: Collection[];
}

export function EditLinkDialog({ id, type, initialData, collections }: EditLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialData.title || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [savedReason, setSavedReason] = useState(initialData.savedReason || "");
  const [collectionId, setCollectionId] = useState(initialData.collectionId || "none");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await updateExternalReferenceAction(id, type, {
        title: type === "link" ? title : undefined,
        description: type === "link" ? description : undefined,
        savedReason: savedReason,
        collectionId: collectionId === "none" ? null : collectionId,
      });
      toast.success(type === "repo" ? "Repositorio actualizado" : "Enlace actualizado");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setSavedReason(initialData.savedReason || "");
        setCollectionId(initialData.collectionId || "none");
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar {type === "repo" ? "repositorio" : "enlace"}</DialogTitle>
          <DialogDescription>Modifica la metadata y los detalles guardados.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {type === "link" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Título</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del enlace" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Descripción</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descripción del enlace" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">¿Por qué lo guardaste? / Motivo</label>
            <Textarea value={savedReason} onChange={(e) => setSavedReason(e.target.value)} rows={3} placeholder="Motivo para guardar..." />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Colección</label>
            <select 
              value={collectionId} 
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="none">Ninguna colección</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
