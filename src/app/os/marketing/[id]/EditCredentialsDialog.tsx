"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateSocialAccountCredentialsAction } from "@/lib/db/actions/marketing";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";

export function EditCredentialsDialog({ account }: { account: { id: string, handle: string, email: string | null } }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <KeyRound className="h-4 w-4" /> Editar credenciales
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Credenciales</DialogTitle>
        </DialogHeader>
        <form action={async (fd) => {
          try {
            await updateSocialAccountCredentialsAction(account.id, fd);
            setOpen(false);
            toast.success("Credenciales actualizadas correctamente");
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Error al actualizar");
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Usuario / Handle *</label>
            <Input name="handle" required defaultValue={account.handle} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email asociado</label>
            <Input name="email" type="email" defaultValue={account.email || ""} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Nueva Contraseña (dejar en blanco para no cambiar)</label>
            <Input name="password" type="password" placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full">Guardar cambios</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
