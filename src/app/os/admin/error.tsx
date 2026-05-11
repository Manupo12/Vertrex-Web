"use client";
import { ErrorState } from "@/components/ui/error-state";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Error al cargar el dashboard" message={error.message} onRetry={reset} />;
}
