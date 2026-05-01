"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-6 rounded-full border border-destructive/20 bg-destructive/10 p-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Algo salió mal</h1>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Ocurrió un error inesperado. Intenta recargar la página o contacta al equipo de Vertrex si el problema persiste.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
        >
          Ir al inicio
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
