"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function TasksError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="mt-8">
      <ErrorState 
        title="Error al cargar las tareas" 
        message={error.message || "Ocurrió un error inesperado al obtener la información de las tareas."}
        onRetry={reset}
      />
    </div>
  );
}
