"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClientAction } from "@/lib/db/actions/crm";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export function NewClientDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Crear cliente</DialogTitle></DialogHeader>
        <form action={async (fd) => { 
          try {
            await createClientAction(fd); 
            setOpen(false); 
            toast.success("Cliente creado"); 
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Error al crear cliente");
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre *</label>
            <Input name="name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Slug (opcional, autogenerado)</label>
            <Input name="slug" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
            <Input name="email" type="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Telefono</label>
            <Input name="phone" />
          </div>
          <Button type="submit" className="w-full">Crear cliente</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
