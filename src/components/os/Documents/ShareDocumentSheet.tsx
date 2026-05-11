"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/format";
import { CopyIcon, QrCodeIcon, TrashIcon, LinkIcon } from "lucide-react";

export interface ShareDocumentSheetProps {
  documentId: string;
  documentName: string;
  activeTokens?: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateToken?: (ttlHours: number) => Promise<any>;
  onRevokeToken?: (tokenId: string) => Promise<void>;
}

export function ShareDocumentSheet({ 
  documentId, 
  documentName, 
  activeTokens = [], 
  open, 
  onOpenChange,
  onGenerateToken,
  onRevokeToken
}: ShareDocumentSheetProps) {
  const [ttl, setTtl] = useState(168); // 7 days in hours
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!onGenerateToken) return;
    setIsGenerating(true);
    try {
      const result = await onGenerateToken(ttl);
      if (result) {
        toast.success("Enlace generado correctamente");
      }
    } catch (e) {
      toast.error("Error al generar el enlace");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] w-[90vw] flex flex-col p-0 overflow-y-auto">
        <SheetHeader className="p-6 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-background)] z-10">
          <SheetTitle>Compartir documento</SheetTitle>
          <p className="text-sm text-[var(--color-muted-foreground)] truncate">
            {documentName}
          </p>
        </SheetHeader>
        
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Generar nuevo enlace</h3>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Crea un enlace público temporal para compartir este archivo sin necesidad de acceso al portal.
            </p>
            
            <div className="flex items-center gap-3">
              <select 
                className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
              >
                <option value={24}>Expira en 24 horas</option>
                <option value={168}>Expira en 7 días</option>
                <option value={720}>Expira en 30 días</option>
                <option value={8760}>Expira en 1 año</option>
              </select>
              <Button onClick={handleGenerate} disabled={isGenerating || !onGenerateToken}>
                {isGenerating ? "Generando..." : "Generar enlace"}
              </Button>
            </div>
          </div>
          
          <div className="space-y-4 pt-6 border-t border-[var(--color-border)]">
            <h3 className="text-sm font-medium">Enlaces activos ({activeTokens.length})</h3>
            
            {activeTokens.length === 0 ? (
              <div className="text-sm text-[var(--color-muted-foreground)] p-4 bg-[var(--color-muted)]/20 rounded-lg text-center border border-[var(--color-border)] border-dashed">
                No hay enlaces activos para este documento.
              </div>
            ) : (
              <div className="space-y-3">
                {activeTokens.map(token => {
                  const isExpired = new Date(token.expiresAt) < new Date();
                  return (
                    <div key={token.id} className={`p-4 rounded-lg border ${isExpired ? 'bg-red-500/5 border-red-500/20' : 'bg-[var(--color-card)] border-[var(--color-border)]'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <LinkIcon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                          <span>.../share/{token.token.substring(0, 8)}...</span>
                        </div>
                        {isExpired ? (
                          <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Expirado</span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">Activo</span>
                        )}
                      </div>
                      
                      <div className="text-xs text-[var(--color-muted-foreground)] mb-4">
                        Expira el {formatShortDate(token.expiresAt)}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => copyToClipboard(token.token)} disabled={isExpired}>
                            <CopyIcon className="h-3.5 w-3.5 mr-1.5" /> Copiar
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={isExpired}>
                            <QrCodeIcon className="h-3.5 w-3.5 mr-1.5" /> QR
                          </Button>
                        </div>
                        {onRevokeToken && (
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)]" onClick={() => onRevokeToken(token.id)}>
                            <TrashIcon className="h-3.5 w-3.5 mr-1.5" /> Revocar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
