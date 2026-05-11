"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function ProjectsError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Error al cargar proyectos" message={error.message} onRetry={reset} />;
}
