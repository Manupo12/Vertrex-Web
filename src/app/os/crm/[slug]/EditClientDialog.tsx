"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateClientAction } from "@/lib/db/actions/crm";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AsyncSubmitButton } from "@/components/os/ui/AsyncSubmitButton";

interface ClientData {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  priority: string | null;
  city: string | null;
  sector: string | null;
  whatsapp: string | null;
  instagram: string | null;
  webPresence: string | null;
  website: string | null;
  address: string | null;
  rating: string | null;
  reviewsCount: number | null;
}

export function EditClientDialog({ client }: { client: ClientData }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Prospecto / Cliente</DialogTitle>
        </DialogHeader>
        <form 
          action={async (fd) => { 
            try {
              await updateClientAction(client.slug, fd); 
              setOpen(false); 
              toast.success("Información del cliente actualizada"); 
            } catch (e: any) {
              toast.error("Error al actualizar: " + e.message);
            }
          }} 
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Nombre *</label>
                <Input name="name" defaultValue={client.name} required />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Email</label>
                <Input name="email" defaultValue={client.email || ""} type="email" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Teléfono</label>
                <Input name="phone" defaultValue={client.phone || ""} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">WhatsApp Link</label>
                <Input name="whatsapp" defaultValue={client.whatsapp || ""} placeholder="https://wa.me/..." />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Instagram Link</label>
                <Input name="instagram" defaultValue={client.instagram || ""} placeholder="Enlace del perfil" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Dirección</label>
                <Input name="address" defaultValue={client.address || ""} />
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Estado</label>
                <select 
                  name="status" 
                  defaultValue={client.status} 
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
                  defaultValue={client.priority || ""} 
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
                <Input name="sector" defaultValue={client.sector || ""} placeholder="Ej. Pizzería, Estética" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Ciudad</label>
                <Input name="city" defaultValue={client.city || ""} placeholder="Ej. Neiva" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Calificación</label>
                  <Input name="rating" defaultValue={client.rating || ""} placeholder="Ej. 4.5" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Reseñas Count</label>
                  <Input name="reviewsCount" defaultValue={client.reviewsCount || 0} type="number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Presencia Web</label>
                  <Input name="webPresence" defaultValue={client.webPresence || ""} placeholder="Ej. SIN WEB, Facebook" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Sitio Web / Red Link</label>
                  <Input name="website" defaultValue={client.website || ""} placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>
          
          <AsyncSubmitButton className="w-full mt-4">Guardar cambios</AsyncSubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
