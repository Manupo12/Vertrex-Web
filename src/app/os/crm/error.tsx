"use client";
import { ErrorState } from "@/components/ui/error-state";

export default function CrmError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Error al cargar clientes" message={error.message} onRetry={reset} />;
}
