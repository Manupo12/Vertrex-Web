"use client";

import { useState } from "react";
import { formatRelativeTime } from "@/lib/format";
import { AlertCircleIcon, CheckCircle2Icon, XCircleIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ApprovalCardProps {
  approval: any;
  isClientView?: boolean;
  onRespond?: (id: string, status: string, note?: string) => Promise<void>;
}

export function ApprovalCard({ approval, isClientView = false, onRespond }: ApprovalCardProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [responseType, setResponseType] = useState<"approved" | "changes_requested" | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRespond = async () => {
    if (!responseType || !onRespond) return;
    setSubmitting(true);
    try {
      await onRespond(approval.id, responseType, note);
      setIsResponding(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    switch (approval.status) {
      case "approved":
        return (
          <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-md font-medium text-sm">
            <CheckCircle2Icon className="h-4 w-4" />
            <span>Aprobado</span>
          </div>
        );
      case "changes_requested":
        return (
          <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-md font-medium text-sm">
            <XCircleIcon className="h-4 w-4" />
            <span>Cambios solicitados</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-md font-medium text-sm">
            <ClockIcon className="h-4 w-4" />
            <span>Pendiente de revisión</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-muted)] text-[var(--color-muted-foreground)] mb-2">
              <AlertCircleIcon className="h-3 w-3" />
              Solicitud de aprobación
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{approval.title}</h3>
          </div>
          {getStatusDisplay()}
        </div>
        
        {approval.description && (
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2 whitespace-pre-wrap">
            {approval.description}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-4 text-xs text-[var(--color-muted-foreground)]">
          <span>Solicitado {formatRelativeTime(approval.createdAt)}</span>
          {approval.targetType && (
            <>
              <span>•</span>
              <span className="font-medium">{approval.targetType}</span>
            </>
          )}
        </div>
      </div>
      
      {approval.status !== "pending" && (
        <div className="bg-[var(--color-muted)]/30 p-5 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-muted-foreground)] mb-1">
            Respondido {formatRelativeTime(approval.respondedAt)} {approval.respondedBy ? "por cliente" : ""}
          </p>
          {approval.responseNote ? (
            <p className="text-sm font-medium italic">"{approval.responseNote}"</p>
          ) : (
            <p className="text-sm italic opacity-50">Sin comentarios adicionales</p>
          )}
        </div>
      )}
      
      {approval.status === "pending" && isClientView && onRespond && (
        <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-muted)]/10">
          {!isResponding ? (
            <div className="flex gap-3">
              <Button onClick={() => { setResponseType("approved"); setIsResponding(true); }} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                <CheckCircle2Icon className="mr-2 h-4 w-4" /> Aprobar
              </Button>
              <Button variant="outline" onClick={() => { setResponseType("changes_requested"); setIsResponding(true); }} className="flex-1 border-orange-500/30 hover:bg-orange-500/10 text-orange-500">
                <XCircleIcon className="mr-2 h-4 w-4" /> Pedir cambios
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <h4 className="font-medium text-sm">
                {responseType === "approved" ? "Aprobar solicitud" : "Solicitar cambios"}
              </h4>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={responseType === "approved" ? "Comentario opcional..." : "Describe qué cambios necesitas..."}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-h-[80px] resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setIsResponding(false)} disabled={submitting}>Cancelar</Button>
                <Button 
                  size="sm" 
                  onClick={handleRespond} 
                  disabled={submitting || (responseType === "changes_requested" && !note.trim())}
                  className={responseType === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
                >
                  {submitting ? "Enviando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
