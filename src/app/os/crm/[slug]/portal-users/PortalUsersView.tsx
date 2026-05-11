"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { UsersIcon, ShieldAlertIcon, RefreshCwIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { createPortalUserAction, deactivatePortalUserAction, regeneratePortalPinAction, listPortalUsersAction } from "@/lib/db/actions/portal-users";

export function PortalUsersView({ initialUsers, clientId }: { initialUsers: any[], clientId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [addOpen, setAddOpen] = useState(false);
  const [newPin, setNewPin] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const result = await createPortalUserAction(clientId, name, email, roleLabel);
      const freshUsers = await listPortalUsersAction(clientId);
      setUsers(freshUsers);
      setNewPin(result.pin);
    } catch (e) {
      toast.error("Error al crear usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const closeDialog = () => {
    setAddOpen(false);
    setNewPin(null);
    setName("");
    setEmail("");
    setRoleLabel("");
  };

  return (
    <div className="mt-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Cuentas delegadas ({users.length})</h2>
        <Button onClick={() => setAddOpen(true)}>+ Nuevo usuario</Button>
      </div>

      {users.length === 0 ? (
        <EmptyState 
          icon={UsersIcon} 
          title="Sin usuarios delegados" 
          description="Este cliente usa el PIN maestro genérico. Crea usuarios específicos para habilitar firmas y aprobaciones con nombre propio." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((u) => (
            <div key={u.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 flex flex-col hover:border-[var(--color-primary)]/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold flex items-center justify-center">
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{u.name}</h3>
                    {u.roleLabel && <p className="text-xs text-[var(--color-muted-foreground)]">{u.roleLabel}</p>}
                  </div>
                </div>
                {!u.isActive && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Inactivo</span>}
              </div>
              
              {u.email && <div className="text-sm text-[var(--color-muted-foreground)] mb-4">{u.email}</div>}
              
              <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex justify-between items-center">
                <Button variant="outline" size="sm" className="h-8" onClick={async () => {
                  try {
                    const result = await regeneratePortalPinAction(u.id);
                    setNewPin(result.pin);
                    toast.success("PIN regenerado. Cópialo ahora.");
                  } catch {
                    toast.error("Error al regenerar PIN");
                  }
                }}>
                  <RefreshCwIcon className="h-4 w-4 mr-2" /> Resetear PIN
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-[var(--color-destructive)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10" onClick={async () => {
                  try {
                    await deactivatePortalUserAction(u.id);
                    setUsers(users.filter((x: any) => x.id !== u.id));
                    toast.success("Usuario desactivado");
                  } catch {
                    toast.error("Error al desactivar usuario");
                  }
                }}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario de portal</DialogTitle>
          </DialogHeader>
          
          {newPin ? (
            <div className="space-y-4 text-center py-6">
              <ShieldAlertIcon className="h-12 w-12 text-orange-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">PIN generado exitosamente</h3>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Este es el PIN de acceso para <strong>{name}</strong>. Por seguridad, no se volverá a mostrar. Cópialo y envíalo de forma segura.
              </p>
              <div className="bg-[var(--color-muted)] p-6 rounded-lg text-4xl font-mono tracking-[0.5em] text-[var(--color-foreground)] select-all my-6">
                {newPin}
              </div>
              <Button onClick={closeDialog} className="w-full">Entendido</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Nombre *</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Ana Pérez" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Email (opcional para V3 login)</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="ana@empresa.com" type="email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Rol (opcional)</label>
                <Input value={roleLabel} onChange={e => setRoleLabel(e.target.value)} placeholder="Ej. Director de Marketing" />
              </div>
              <Button onClick={handleCreate} disabled={submitting || !name.trim()} className="w-full mt-2">
                {submitting ? "Generando..." : "Crear y generar PIN"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
