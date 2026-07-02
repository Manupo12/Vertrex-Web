"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClientAction } from "@/lib/db/actions/crm";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AsyncSubmitButton } from "@/components/os/ui/AsyncSubmitButton";

export function NewClientDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Prospecto / Cliente</DialogTitle>
        </DialogHeader>
        <form 
          action={async (fd) => { 
            try {
              await createClientAction(fd); 
              setOpen(false); 
              toast.success("Cliente creado con éxito"); 
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Error al crear cliente");
            }
          }} 
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Nombre *</label>
                <Input name="name" required placeholder="Nombre del negocio o cliente" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Slug (opcional)</label>
                <Input name="slug" placeholder="Autogenerado si se deja en blanco" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Email</label>
                <Input name="email" type="email" placeholder="correo@ejemplo.com" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Teléfono</label>
                <Input name="phone" placeholder="Número de contacto" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">WhatsApp Link</label>
                <Input name="whatsapp" placeholder="https://wa.me/..." />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Instagram Link</label>
                <Input name="instagram" placeholder="Enlace del perfil" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Dirección</label>
                <Input name="address" placeholder="Dirección física" />
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Estado</label>
                <select 
                  name="status" 
                  defaultValue="no_contactado" 
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Activo (Portal)</option>
                  <option value="inactive">Inactivo (Portal)</option>
                  <option value="paused">Pausado (Portal)</option>
                  <option value="no_contactado">No contactado</option>
                  <option value="contactado">Contactado</option>
                  <option value="interesado">Interesado</option>
                  <option value="no_respondio">No respondió</option>
                  <option value="reunion_completada">1ª Reunión</option>
                  <option value="contrato_firmado">Contrato firmado</option>
                  <option value="contrato_finalizado">Contrato finalizado</option>
                  <option value="continuidad">Continuidad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Prioridad</label>
                <select 
                  name="priority" 
                  defaultValue="" 
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Ninguna</option>
                  <option value="🔥 Alta">🔥 Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Rubro / Sector</label>
                <Input name="sector" placeholder="Ej. Pizzería, Estética" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Ciudad</label>
                <Input name="city" placeholder="Ej. Neiva" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Calificación</label>
                  <Input name="rating" placeholder="Ej. 4.5" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Reseñas Count</label>
                  <Input name="reviewsCount" defaultValue={0} type="number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Presencia Web</label>
                  <Input name="webPresence" placeholder="Ej. SIN WEB, Facebook" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Sitio Web / Red Link</label>
                  <Input name="website" placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>
          
          <AsyncSubmitButton className="w-full mt-4">Crear cliente</AsyncSubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
