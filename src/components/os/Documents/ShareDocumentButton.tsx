"use client";

import { useState, useEffect, useCallback } from "react";
import { ShareIcon } from "lucide-react";
import { ShareDocumentSheet } from "./ShareDocumentSheet";
import { createShareTokenAction, revokeShareTokenAction } from "@/lib/db/actions/documents";

interface Props {
  documentId: string;
  documentName: string;
}

export function ShareDocumentButton({ documentId, documentName }: Props) {
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/tokens`);
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch { /* ignore */ }
  }, [documentId]);

  useEffect(() => {
    if (open) fetchTokens();
  }, [open, fetchTokens]);

  const handleGenerateToken = async (ttlHours: number) => {
    const st = await createShareTokenAction(documentId, ttlHours);
    await fetchTokens();
    return st;
  };

  const handleRevokeToken = async (tokenId: string) => {
    await revokeShareTokenAction(tokenId);
    await fetchTokens();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
      >
        <ShareIcon className="h-4 w-4" /> Compartir con enlace
      </button>
      <ShareDocumentSheet
        documentId={documentId}
        documentName={documentName}
        activeTokens={tokens}
        open={open}
        onOpenChange={setOpen}
        onGenerateToken={handleGenerateToken}
        onRevokeToken={handleRevokeToken}
      />
    </>
  );
}
