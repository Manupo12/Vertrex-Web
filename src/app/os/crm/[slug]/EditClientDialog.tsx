"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateClientAction } from "@/lib/db/actions/crm";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

export function EditClientDialog({ client }: { client: { slug: string; name: string; email: string | null; phone: string | null; status: string } }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><Pencil className="mr-2 h-4 w-4" />Editar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
        <form action={async (fd) => { await updateClientAction(client.slug, fd); setOpen(false); toast.success("Cliente actualizado"); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre</label>
            <input name="name" defaultValue={client.name} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
            <input name="email" defaultValue={client.email || ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Telefono</label>
            <input name="phone" defaultValue={client.phone || ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Estado</label>
            <select name="status" defaultValue={client.status} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="paused">Pausado</option>
            </select>
          </div>
          <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Guardar cambios</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
