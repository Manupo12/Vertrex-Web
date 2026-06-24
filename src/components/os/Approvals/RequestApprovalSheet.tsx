"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { requestApprovalAction } from "@/lib/db/actions/approvals";

export interface RequestApprovalSheetProps {
  targetType: string;
  targetId: string;
  targetName: string;
  clientId?: string;
  clientUsers?: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestApprovalSheet({ targetType, targetId, targetName, clientId, clientUsers = [], open, onOpenChange }: RequestApprovalSheetProps) {
  const [title, setTitle] = useState(`Aprobación de ${targetName}`);
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !clientId) return;
    setIsSubmitting(true);
    try {
      await requestApprovalAction({
        title,
        description: description || undefined,
        targetType,
        targetId,
        clientId,
      });
      toast.success("Aprobación solicitada al cliente");
      onOpenChange(false);
    } catch (e) {
      toast.error("Error al solicitar aprobación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(u => u !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] w-[90vw] flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-[var(--color-border)]">
          <SheetTitle>Solicitar aprobación</SheetTitle>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            El cliente recibirá una notificación para revisar {targetName}.
          </p>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título de la solicitud</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Mensaje para el cliente (opcional)</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Por favor revisa los últimos cambios..."
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-h-[100px] resize-none"
            />
          </div>
          
          {clientId ? (
            <div className="space-y-3">
              <label className="text-sm font-medium">Notificar a (opcional)</label>
              {clientUsers.length > 0 ? (
                <div className="space-y-2">
                  {clientUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]/20 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <div>
                        <div className="font-medium text-sm">{u.name}</div>
                        {u.roleLabel && <div className="text-xs text-[var(--color-muted-foreground)]">{u.roleLabel}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[var(--color-muted-foreground)] p-4 bg-[var(--color-muted)]/20 rounded-lg border border-[var(--color-border)]">
                  Este cliente no tiene usuarios de portal configurados. Se usará el acceso principal.
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-orange-500 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              No se puede solicitar aprobación porque este elemento no está asociado a ningún cliente.
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !clientId || isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
