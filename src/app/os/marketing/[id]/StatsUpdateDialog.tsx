"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateSocialAccountStatsAction } from "@/lib/db/actions/marketing";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";

export function StatsUpdateDialog({ account }: { account: { id: string, followersCount: number | null, reachCount: number | null } }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Actualizar Estad\u00edsticas</DialogTitle></DialogHeader>
        <form action={async (fd) => { 
          try {
            await updateSocialAccountStatsAction(account.id, fd); 
            setOpen(false); 
            toast.success("Estad\u00edsticas actualizadas"); 
          } catch (e: any) {
            toast.error(e.message || "Error al actualizar");
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Seguidores</label>
            <Input name="followersCount" type="number" defaultValue={account.followersCount || 0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Alcance mensual</label>
            <Input name="reachCount" type="number" defaultValue={account.reachCount || 0} />
          </div>
          <Button type="submit" className="w-full">Guardar cambios</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
