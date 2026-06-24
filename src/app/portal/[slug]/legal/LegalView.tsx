"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { ScaleIcon, CheckCircle2Icon, FileTextIcon, DownloadIcon } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import { SignaturePad } from "@/components/os/Legal/SignaturePad";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LegalView({ initialDocuments, clientSignatures, clientId }: { initialDocuments: any[], clientSignatures: any[], clientId: string }) {
  const [documents] = useState(initialDocuments);
  const [signatures, setSignatures] = useState(clientSignatures);
  const [signingDoc, setSigningDoc] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSign = async (data: { name: string, email: string, accepted: boolean }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/portal/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalId: signingDoc.id,
          signerName: data.name,
          signerEmail: data.email,
          checkboxAccepted: data.accepted,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al firmar");
      }

      const newSignature = await res.json();
      setSignatures([...signatures, newSignature]);
      toast.success("Documento firmado correctamente");
      setSigningDoc(null);
      window.location.reload();
    } catch (e: any) {
      toast.error("Error al firmar el documento: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (signingDoc) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSigningDoc(null)} className="mb-4">
          ← Volver a la lista
        </Button>
        <SignaturePad 
          legalName={signingDoc.name}
          onSubmit={handleSign}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState 
          icon={ScaleIcon} 
          title="Sin documentos legales" 
          description="No hay contratos ni acuerdos compartidos contigo actualmente." 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map(doc => {
        const signature = signatures.find(s => s.legalId === doc.id);
        const isSigned = !!signature || !!doc.signedAt;
        const needsSignature = doc.requiresSignature && !isSigned;

        return (
          <div key={doc.id} className={`bg-[var(--color-card)] rounded-xl border ${needsSignature ? 'border-orange-500/50 shadow-sm shadow-orange-500/10' : 'border-[var(--color-border)]'} p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
            <div className="flex items-start gap-4">
              <div className={`mt-1 shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${needsSignature ? 'bg-orange-500/10 text-orange-500' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                {isSigned ? <CheckCircle2Icon className="h-5 w-5" /> : <ScaleIcon className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{doc.name}</h3>
                  {needsSignature && (
                    <span className="text-[10px] uppercase font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">Firma requerida</span>
                  )}
                  {isSigned && (
                    <span className="text-[10px] uppercase font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">Firmado</span>
                  )}
                </div>
                <div className="text-sm text-[var(--color-muted-foreground)] flex items-center gap-3">
                  <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>Añadido {formatShortDate(doc.createdAt)}</span>
                </div>
                
                {signature && (
                  <div className="mt-3 text-sm bg-green-500/5 border border-green-500/20 text-green-600 px-3 py-2 rounded-md">
                    Firmado por <span className="font-semibold">{signature.signerName}</span> el {formatShortDate(signature.signedAt)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 self-end md:self-center w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              {needsSignature && (
                <Button className="flex-1 md:flex-none bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setSigningDoc(doc)}>
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Firmar ahora
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
