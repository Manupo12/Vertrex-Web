"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createCollectionAction } from "@/lib/db/actions/links";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export function NewCollectionDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      await createCollectionAction(name, description);
      toast.success("Colección creada con éxito");
      setName("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error("Error al crear: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        setName("");
        setDescription("");
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nueva colección
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Colección</DialogTitle>
          <DialogDescription>Crea una nueva categoría para organizar tus links y repositorios.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Nombre *</label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ej. Frontend, DevOps, IA" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Descripción</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Ej. Recursos relacionados con..." 
              rows={3}
            />
          </div>
          <Button type="submit" disabled={submitting || !name.trim()} className="w-full">
            {submitting ? "Creando..." : "Crear colección"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
