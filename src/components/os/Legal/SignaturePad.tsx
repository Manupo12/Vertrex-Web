"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface SignaturePadProps {
  legalName: string;
  defaultName?: string;
  defaultEmail?: string;
  onSubmit: (data: { name: string, email: string, accepted: boolean }) => Promise<void>;
  isSubmitting?: boolean;
}

export function SignaturePad({ legalName, defaultName = "", defaultEmail = "", onSubmit, isSubmitting = false }: SignaturePadProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !accepted) {
      toast.error("Por favor completa todos los campos y acepta los términos.");
      return;
    }
    
    await onSubmit({ name, email, accepted });
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden max-w-2xl mx-auto">
      <div className="bg-[var(--color-muted)]/30 p-6 border-b border-[var(--color-border)]">
        <h3 className="text-xl font-bold mb-2">Firma electrónica</h3>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Estás a punto de firmar digitalmente: <span className="font-semibold text-[var(--color-foreground)]">{legalName}</span>
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="signerName" className="text-sm font-medium">Nombre completo <span className="text-red-500">*</span></label>
            <input 
              id="signerName"
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="Ej. Juan Pérez"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="signerEmail" className="text-sm font-medium">Correo electrónico <span className="text-red-500">*</span></label>
            <input 
              id="signerEmail"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="juan@ejemplo.com"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div className="p-4 bg-[var(--color-muted)]/20 rounded-lg border border-[var(--color-border)] flex items-start gap-3">
          <input 
            id="termsAccept"
            type="checkbox" 
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
            disabled={isSubmitting}
          />
          <label htmlFor="termsAccept" className="text-sm cursor-pointer">
            He leído y entiendo completamente el contenido del documento <span className="font-medium">"{legalName}"</span>. 
            Acepto que esta firma electrónica tiene la misma validez legal que una firma manuscrita.
          </label>
        </div>
        
        <div className="text-xs text-[var(--color-muted-foreground)] p-3 border border-dashed border-[var(--color-border)] rounded bg-transparent text-center">
          <p>Para garantizar la validez legal, registraremos la siguiente información:</p>
          <div className="mt-2 font-mono flex flex-wrap justify-center gap-4">
            <span>IP: <span className="font-medium text-[var(--color-foreground)]">Se registrará al enviar</span></span>
            <span>Fecha: <span className="font-medium text-[var(--color-foreground)]">Actual</span></span>
            <span>Navegador: <span className="font-medium text-[var(--color-foreground)]">Detectado automáticamente</span></span>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
          <Button 
            type="submit" 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]"
            disabled={!name.trim() || !email.trim() || !accepted || isSubmitting}
          >
            {isSubmitting ? "Firmando documento..." : "Firmar documento"}
          </Button>
        </div>
      </form>
    </div>
  );
}
