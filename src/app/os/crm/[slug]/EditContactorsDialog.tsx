"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateClientContactorsAction } from "@/lib/db/actions/crm";
import { toast } from "sonner";
import { Users, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  name: string;
  email: string;
}

interface EditContactorsDialogProps {
  clientId: string;
  currentContactors: Member[];
  teamMembers: Member[];
}

export function EditContactorsDialog({ clientId, currentContactors, teamMembers }: EditContactorsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    currentContactors.map(c => c.id)
  );
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await updateClientContactorsAction(clientId, selectedIds);
      toast.success("Asignaciones de contacto actualizadas");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error("Error al actualizar: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        setSelectedIds(currentContactors.map(c => c.id));
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <Users className="h-3.5 w-3.5" />
          Asignar Equipo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Contactantes</DialogTitle>
          <DialogDescription>
            Selecciona los miembros del equipo que están realizando el contacto con este prospecto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto">
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay otros miembros del equipo activos.</p>
          ) : (
            teamMembers.map(member => {
              const isChecked = selectedIds.includes(member.id);
              return (
                <div 
                  key={member.id}
                  onClick={() => handleToggle(member.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-all ${
                    isChecked 
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" 
                      : "border-border hover:bg-accent/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isChecked 
                        ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{member.email}</p>
                    </div>
                  </div>
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                    isChecked 
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" 
                      : "border-muted-foreground/30"
                  }`}>
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2">
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
